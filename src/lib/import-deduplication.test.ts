import assert from "node:assert/strict";
import test from "node:test";
import { reviewImport, transactionFingerprint, type ImportCandidate } from "./import-deduplication";
import { isCalendarDate, transactionFieldsSchema } from "./transaction-validation";
import { parseStatementDate } from "../services/import-service";

const row = (overrides: Partial<ImportCandidate> = {}): ImportCandidate => ({
  date: "2026-09-27T12:00:00.000Z", description: "Mercado", amount: 25.9, type: "EXPENSE",
  source: "Extrato · conta a", importId: "statement:v1:account:file:0", ...overrides
});

test("two legitimate equal payments in one statement both survive first import", () => {
  const incoming = [row(), row({ importId: "statement:v1:account:file:1" })];
  assert.deepEqual(reviewImport(incoming, []).map((item) => item.include), [true, true]);
  assert.deepEqual(reviewImport(incoming, incoming).map((item) => item.status), ["imported", "imported"]);
});

test("renaming the file does not change its content identity", () => {
  // Browser sends content hash, not file name, as part of importId.
  assert.equal(reviewImport([row()], [row()])[0].include, false);
});

test("retry is skipped even if a saved transaction was edited or moved to another date", () => {
  assert.equal(reviewImport([row()], [row({ date: "2026-08-01", amount: 99, description: "Descrição corrigida" })])[0].status, "imported");
});

test("overlapping exports compare multiplicity and only add the extra occurrence", () => {
  const incoming = [row({ importId: "statement:v1:account:other:0" }), row({ importId: "statement:v1:account:other:1" })];
  assert.deepEqual(reviewImport(incoming, [row()]).map((item) => item.status), ["possible", "new"]);
  assert.deepEqual(reviewImport(incoming, [row()]).map((item) => item.include), [false, true]);
});

test("same file selected twice in one batch does not double the rows", () => {
  const incoming = [row(), row({ importId: "statement:v1:account:file:1" })];
  assert.deepEqual(reviewImport([...incoming, ...incoming], []).map((item) => item.include), [true, true, false, false]);
});

test("different overlapping files in the same batch require review", () => {
  assert.deepEqual(reviewImport([row(), row({ importId: "statement:v1:account:other:0" })], []).map((item) => item.status), ["new", "possible"]);
});

test("two accounts may have identical transactions", () => {
  const differentAccount = row({ source: "Extrato · conta b", importId: "statement:v1:account-b:file:0" });
  assert.equal(reviewImport([differentAccount], [row()])[0].status, "new");
});

test("legacy/manual matches are possible duplicates and can be explicitly preserved", () => {
  const old = row({ importId: "old-uuid", source: "extrato.csv" });
  assert.equal(reviewImport([row()], [old])[0].include, false);
  assert.equal(reviewImport([row({ forceImport: true })], [old])[0].include, true);
});

test("forcing a possible duplicate remains idempotent on retry", () => {
  const incoming = row({ forceImport: true });
  assert.equal(reviewImport([incoming], [incoming])[0].include, false);
});

test("legacy and current records both count toward existing multiplicity", () => {
  const existing = [row(), row({ importId: "legacy", source: "antigo.csv" })];
  const incoming = [row({ importId: "statement:v1:account:new:0" }), row({ importId: "statement:v1:account:new:1" })];
  assert.deepEqual(reviewImport(incoming, existing).map((item) => item.include), [false, false]);
});

test("forced extra payments count before a consolidated overlapping file", () => {
  const existing = [row({ importId: "statement:v1:account:existing:0" })];
  const additional = [row({ importId: "statement:v1:account:fileA:0", forceImport: true }), row({ importId: "statement:v1:account:fileA:1" })];
  const consolidated = [0, 1, 2].map((index) => row({ importId: `statement:v1:account:fileB:${index}` }));
  const incoming = [...additional, ...consolidated];
  const review = reviewImport(incoming, existing);
  assert.deepEqual(review.map((item) => item.include), [true, true, false, false, false]);
  const saved = review.filter((item) => item.include).map((item) => incoming[item.index]);
  assert.equal(existing.length + saved.length, 3);
  assert.equal(reviewImport(incoming, [...existing, ...saved]).some((item) => item.include), false);
});

test("forced payments and consolidated overlap do not depend on file selection order", () => {
  const existing = [row({ importId: "statement:v1:account:existing:0" })];
  const consolidated = [0, 1, 2].map((index) => row({ importId: `statement:v1:account:fileB:${index}` }));
  const additional = [row({ importId: "statement:v1:account:fileA:0", forceImport: true }), row({ importId: "statement:v1:account:fileA:1" })];
  assert.deepEqual(reviewImport([...consolidated, ...additional], existing).map((item) => item.include), [false, false, false, true, true]);
});

test("a genuinely larger consolidated statement still adds only its new occurrence", () => {
  const existing = [row({ importId: "statement:v1:account:existing:0" })];
  const additional = [row({ importId: "statement:v1:account:fileA:0", forceImport: true }), row({ importId: "statement:v1:account:fileA:1" })];
  const consolidated = [0, 1, 2, 3].map((index) => row({ importId: `statement:v1:account:fileB:${index}` }));
  assert.deepEqual(reviewImport([...additional, ...consolidated], existing).map((item) => item.include), [true, true, false, false, false, true]);
});

test("fingerprints normalize whitespace and case but retain amount and transaction type", () => {
  assert.equal(transactionFingerprint(row()), transactionFingerprint(row({ description: " MERCADO   " })));
  assert.notEqual(transactionFingerprint(row()), transactionFingerprint(row({ amount: 25.91 })));
  assert.notEqual(transactionFingerprint(row()), transactionFingerprint(row({ type: "INCOME" })));
});

test("calendar validation rejects overflow and preserves leap days", () => {
  assert.equal(isCalendarDate("2026-02-29"), false);
  assert.equal(isCalendarDate("2024-02-29"), true);
  assert.equal(isCalendarDate("2026-04-31"), false);
  assert.equal(isCalendarDate("2026-13-01"), false);
});

test("invalid statement dates never silently become today or roll into another month", () => {
  for (const date of ["", "invalida", "31/04/2026", "29/02/2026", "2026-02-30"]) assert.throws(() => parseStatementDate(date));
  assert.equal(parseStatementDate("27/09/2026").slice(0, 10), "2026-09-27");
  assert.equal(parseStatementDate("2026-09-27").slice(0, 10), "2026-09-27");
});

test("manual values reject zero, negatives, fractions of a cent, invalid dates and blank descriptions", () => {
  const valid = { date: "2026-09-27", description: "Mercado", amount: "25,90", type: "EXPENSE", categoryId: "" };
  assert.equal(transactionFieldsSchema.safeParse(valid).success, true);
  for (const amount of ["0", "-1", "1.001", "NaN", "Infinity", "10000000000"]) assert.equal(transactionFieldsSchema.safeParse({ ...valid, amount }).success, false);
  assert.equal(transactionFieldsSchema.safeParse({ ...valid, description: " " }).success, false);
  assert.equal(transactionFieldsSchema.safeParse({ ...valid, date: "2026-02-30" }).success, false);
});
