import assert from "node:assert/strict";
import { after, afterEach, before, beforeEach, test } from "node:test";
import { act, createElement, useActionState, type ComponentProps } from "react";
import type { Root } from "react-dom/client";
import { JSDOM } from "jsdom";
import { TransactionCategoryForm } from "./transaction-category-form";

type FormProps = ComponentProps<typeof TransactionCategoryForm>;
type SaveResult = Awaited<ReturnType<FormProps["saveCategory"]>>;
const categories = [
  { id: "category-market", name: "Mercado" },
  { id: "category-transport", name: "Transporte" },
  { id: "category-other", name: "Outros" }
];

let dom: JSDOM;
let host: HTMLDivElement;
let root: Root;
let createRoot: typeof import("react-dom/client").createRoot;
const originalGlobals = new Map<string, PropertyDescriptor | undefined>();

before(async () => {
  dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/transactions" });
  const browserGlobals = {
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement,
    HTMLFormElement: dom.window.HTMLFormElement,
    HTMLSelectElement: dom.window.HTMLSelectElement,
    Event: dom.window.Event,
    FormData: dom.window.FormData,
    IS_REACT_ACT_ENVIRONMENT: true
  };
  for (const [key, value] of Object.entries(browserGlobals)) {
    originalGlobals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  // React DOM must discover the browser environment after JSDOM is installed.
  ({ createRoot } = await import("react-dom/client"));
});

beforeEach(() => {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
});

after(() => {
  dom.window.close();
  for (const [key, descriptor] of originalGlobals) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
});

function deferred() {
  let resolve!: (value: SaveResult) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<SaveResult>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

async function renderForm(overrides: Partial<FormProps> = {}) {
  const props: FormProps = {
    transactionId: "transaction-1",
    currentCategoryId: null,
    categories,
    saveCategory: async (data) => ({ success: "Categoria atualizada.", categoryId: String(data.get("categoryId")) }),
    ...overrides
  };
  await act(async () => root.render(createElement(TransactionCategoryForm, props)));
  return props;
}

function selectAt(index = 0) {
  const element = host.querySelectorAll("select")[index];
  assert.ok(element, "The transaction category selector should exist");
  return element;
}

async function choose(categoryId: string, index = 0) {
  await act(async () => {
    const select = selectAt(index);
    select.value = categoryId;
    select.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
  });
}

test("saving categories avoids React 19 form resets and preserves subsequent changes", async () => {
  const submissions: FormData[] = [];
  await renderForm({ saveCategory: async (data) => {
    submissions.push(data);
    return { success: "Categoria atualizada.", categoryId: String(data.get("categoryId")) };
  } });
  const form = host.querySelector("form");
  assert.ok(form);
  let actionResets = 0;
  form.addEventListener("reset", () => actionResets++);
  assert.equal(selectAt().value, "");

  // Choose a non-first option so a native fallback cannot accidentally pass.
  await choose("category-transport");
  assert.equal(selectAt().value, "category-transport");
  assert.equal(selectAt().disabled, false);
  assert.equal(submissions[0].get("id"), "transaction-1");
  assert.equal(submissions[0].get("categoryId"), "category-transport");
  assert.equal(actionResets, 0, "A category update must not reset the form after its action resolves");

  await choose("category-other");
  assert.equal(selectAt().value, "category-other");
  assert.equal(submissions.length, 2);
  assert.equal(submissions[1].get("categoryId"), "category-other");
  assert.equal(actionResets, 0);
});

test("the legacy uncontrolled React form reproduces the placeholder reset after a successful save", async () => {
  let persistedCategory = "";
  function LegacyCategoryForm() {
    const [, action] = useActionState(async (_previous: undefined, data: FormData) => {
      persistedCategory = String(data.get("categoryId"));
      return undefined;
    }, undefined);
    return createElement("form", { action }, createElement("select", {
      name: "categoryId",
      defaultValue: "",
      onChange: (event: React.ChangeEvent<HTMLSelectElement>) => event.currentTarget.form?.requestSubmit()
    }, createElement("option", { value: "", disabled: true }, "Selecionar"),
    ...categories.map((category) => createElement("option", { key: category.id, value: category.id }, category.name))));
  }
  await act(async () => root.render(createElement(LegacyCategoryForm)));
  let actionResets = 0;
  host.querySelector("form")?.addEventListener("reset", () => actionResets++);

  await choose("category-transport");
  assert.equal(persistedCategory, "category-transport", "The database-equivalent write succeeds");
  assert.equal(selectAt().value, "", "The former uncontrolled UI incorrectly returns to Selecionar");
  assert.equal(actionResets, 1, "React itself emits the reset; the fixture never invokes form.reset()");
});

test("a pending change disables the selector and displays the server-confirmed category", async () => {
  const saving = deferred();
  await renderForm({ currentCategoryId: "category-market", saveCategory: () => saving.promise });

  await choose("category-transport");
  assert.equal(selectAt().disabled, true);
  assert.equal(selectAt().value, "category-transport");
  await act(async () => saving.resolve({ success: "Categoria atualizada.", categoryId: "category-other" }));
  assert.equal(selectAt().disabled, false);
  assert.equal(selectAt().value, "category-other", "Use the acknowledged category rather than assuming the submitted value was saved");
});

test("server errors restore the last acknowledged category and allow a retry", async () => {
  let calls = 0;
  await renderForm({ saveCategory: async (data) => {
    calls++;
    return calls === 2
      ? { error: "Não foi possível atualizar a categoria. Tente novamente." }
      : { success: "Categoria atualizada.", categoryId: String(data.get("categoryId")) };
  } });
  await choose("category-market");
  await choose("category-transport");
  assert.equal(selectAt().value, "category-market");
  assert.equal(selectAt().disabled, false);
  assert.match(host.querySelector('[role="alert"]')?.textContent ?? "", /Não foi possível atualizar/);

  await choose("category-transport");
  assert.equal(calls, 3);
  assert.equal(selectAt().value, "category-transport");
  assert.equal(host.querySelector('[role="alert"]'), null);
});

test("a thrown network failure restores the saved category without trapping the selector", async () => {
  let calls = 0;
  await renderForm({ currentCategoryId: "category-market", saveCategory: async (data) => {
    calls++;
    if (calls === 1) throw new Error("Network unavailable");
    return { success: "Categoria atualizada.", categoryId: String(data.get("categoryId")) };
  } });
  await choose("category-transport");
  assert.equal(selectAt().value, "category-market");
  assert.equal(selectAt().disabled, false);
  assert.ok(host.querySelector('[role="alert"]')?.textContent);

  await choose("category-transport");
  assert.equal(selectAt().value, "category-transport");
  assert.equal(host.querySelector('[role="alert"]'), null);
});

test("a refreshed server category updates the existing mounted form, including no category", async () => {
  const props = await renderForm({ currentCategoryId: "category-market" });
  const originalSelect = selectAt();
  await act(async () => root.render(createElement(TransactionCategoryForm, { ...props, currentCategoryId: "category-transport" })));
  assert.equal(selectAt(), originalSelect, "Exercise a prop refresh without remounting the selector");
  assert.equal(selectAt().value, "category-transport");

  await act(async () => root.render(createElement(TransactionCategoryForm, { ...props, currentCategoryId: null })));
  assert.equal(selectAt(), originalSelect);
  assert.equal(selectAt().value, "");
});

test("two transaction forms keep independent pending and saved categories", async () => {
  const firstSave = deferred();
  const submitted: string[] = [];
  const saveCategory = async (data: FormData) => {
    submitted.push(String(data.get("id")));
    return data.get("id") === "transaction-1"
      ? firstSave.promise
      : { success: "Categoria atualizada.", categoryId: String(data.get("categoryId")) };
  };
  await act(async () => root.render(createElement("div", null,
    createElement(TransactionCategoryForm, { transactionId: "transaction-1", currentCategoryId: null, categories, saveCategory }),
    createElement(TransactionCategoryForm, { transactionId: "transaction-2", currentCategoryId: "category-other", categories, saveCategory })
  )));
  await choose("category-market", 0);
  assert.equal(selectAt(0).disabled, true);
  assert.equal(selectAt(1).disabled, false);
  assert.equal(selectAt(1).value, "category-other");

  await choose("category-transport", 1);
  assert.equal(selectAt(1).value, "category-transport");
  await act(async () => firstSave.resolve({ success: "Categoria atualizada.", categoryId: "category-market" }));
  assert.equal(selectAt(0).value, "category-market");
  assert.equal(selectAt(1).value, "category-transport");
  assert.deepEqual(submitted, ["transaction-1", "transaction-2"]);
});
