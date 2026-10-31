"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { createCategory, deleteCategory, syncDefaultCategories, updateCategoryKeywords } from "@/app/(dashboard)/settings/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type CategoryKeywordItem = {
  id: string;
  name: string;
  keywords: string[];
};

function StatusMessage({ state }: { state?: { error?: string; success?: string } }) {
  if (state?.error) return <p className="text-xs text-destructive">{state.error}</p>;
  if (state?.success) return <p className="text-xs text-primary">{state.success}</p>;
  return null;
}

function CategoryKeywordRow({ category }: { category: CategoryKeywordItem }) {
  const sheet = useRef<HTMLDialogElement>(null);
  const [updateState, updateAction, updating] = useActionState(
    async (_previousState: { error?: string; success?: string } | undefined, formData: FormData) => updateCategoryKeywords(formData),
    undefined
  );
  const [deleteState, deleteAction, deleting] = useActionState(
    async (_previousState: { error?: string; success?: string } | undefined, formData: FormData) => deleteCategory(formData),
    undefined
  );
  useEffect(() => { if (updateState?.success) sheet.current?.close(); }, [updateState]);

  return (
    <li>
      <button type="button" className="list-row rule-row" aria-haspopup="dialog" onClick={() => sheet.current?.showModal()}>
        <span className="row-main">
          <span className="row-title">{category.name}</span>
          <span className="row-sub rule-keywords">{category.keywords.length ? category.keywords.join(", ") : "Sem nomes do banco ainda"}</span>
        </span>
        <ChevronRight className="row-chevron" aria-hidden="true" />
      </button>
      {(updateState?.success || deleteState?.error) && <div className="rule-status"><StatusMessage state={deleteState?.error ? deleteState : updateState} /></div>}
      <dialog ref={sheet} className="sheet" aria-labelledby={`rule-${category.id}`} onClick={(event) => { if (event.target === event.currentTarget) sheet.current?.close(); }}>
        <form action={updateAction}>
          <input type="hidden" name="id" value={category.id} />
          <div className="sheet-grabber" aria-hidden="true" />
          <div className="sheet-bar">
            <button type="button" className="btn btn-plain" onClick={() => sheet.current?.close()}>Cancelar</button>
            <h2 id={`rule-${category.id}`} className="sheet-title">Categoria</h2>
            <button type="submit" disabled={updating} className="btn btn-plain btn-plain-strong">{updating ? "Salvando..." : "Salvar"}</button>
          </div>
          <div className="field-group">
            <label className="field-row field-row-stack"><span>Nome</span><input name="name" defaultValue={category.name} required /></label>
            <label className="field-row field-row-stack"><span>Como aparece no banco</span><input name="keywords" defaultValue={category.keywords.join(", ")} placeholder="IFD*, IFOOD, AMI" /></label>
          </div>
          <p className="field-note">Separe os nomes por vírgula. Quando um deles aparecer no extrato ou no WhatsApp, o gasto entra nesta categoria.</p>
          {updateState?.error && <p className="field-error" role="alert">{updateState.error}</p>}
        </form>
        <form action={deleteAction} className="rule-delete">
          <input type="hidden" name="id" value={category.id} />
          <button type="submit" className="btn btn-plain is-destructive" disabled={deleting} onClick={(event) => { if (!confirm(`Excluir a categoria ${category.name}?`)) event.preventDefault(); }}>
            <Trash2 className="size-4" aria-hidden="true" />{deleting ? "Excluindo..." : "Excluir categoria"}
          </button>
          {deleteState?.error && <p className="field-error" role="alert">{deleteState.error}</p>}
        </form>
      </dialog>
    </li>
  );
}

function NewCategoryForm() {
  const [state, action, pending] = useActionState(
    async (_previousState: { error?: string; success?: string } | undefined, formData: FormData) => createCategory(formData),
    undefined
  );

  return (
    <form action={action} className="rounded-lg border border-border bg-muted/20 p-3">
      <div className="grid gap-3 lg:grid-cols-[240px_1fr_auto]">
        <Input name="name" placeholder="Nova categoria" required />
        <Input name="keywords" placeholder="Como aparece no banco: IFD*, AMI, SMART FIT" />
        <Button disabled={pending}>
          <Plus className="size-4" />
          {pending ? "Criando..." : "Criar"}
        </Button>
      </div>
      <div className="mt-2">
        <StatusMessage state={state} />
      </div>
    </form>
  );
}

function SyncCategoriesButton() {
  const [state, action, pending] = useActionState(async () => syncDefaultCategories(), undefined);

  return (
    <form action={action} className="space-y-2">
      <button
        type="submit"
        className="btn btn-plain is-destructive"
        disabled={pending}
        onClick={(event) => {
          if (!confirm("Restaurar as regras padrão pode recriar categorias que você removeu. Deseja continuar?")) {
            event.preventDefault();
          }
        }}
      >
        <RefreshCw className="size-4" />
        {pending ? "Restaurando..." : "Restaurar regras padrão"}
      </button>
      <StatusMessage state={state} />
    </form>
  );
}

export function CategoryKeywordsManager({ categories }: { categories: CategoryKeywordItem[] }) {
  const [query, setQuery] = useState("");
  const filteredCategories = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return categories;

    return categories.filter((category) => {
      const haystack = `${category.name} ${category.keywords.join(" ")}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [categories, query]);

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="font-semibold">Como o banco escreve seus gastos</h2>
            <p className="text-sm text-muted-foreground">Diga ao Fluxa quais nomes do extrato ou WhatsApp viram cada categoria. Ex.: IFD* vira iFood.</p>
          </div>
          <SyncCategoriesButton />
        </div>
        <NewCategoryForm />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative block w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="Buscar categoria ou nome do banco" />
          </label>
          <p className="text-sm text-muted-foreground">
            {filteredCategories.length} de {categories.length} {categories.length === 1 ? "categoria" : "categorias"}
          </p>
        </div>

        <div>
          {categories.length === 0 ? (
            <p className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground">Faça login para editar suas categorias.</p>
          ) : filteredCategories.length === 0 ? (
            <p className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground">Nenhuma categoria encontrada.</p>
          ) : (
            <ul className="list rule-list">{filteredCategories.map((category) => <CategoryKeywordRow key={category.id} category={category} />)}</ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
