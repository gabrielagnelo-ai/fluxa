"use client";

import { useMemo, useState, useTransition } from "react";
import { Sparkles, Trash2, UploadCloud } from "lucide-react";
import { classifyImportedTransactions, parsePdfStatement, previewImportedTransactions, saveImportedTransactions } from "@/app/(dashboard)/import/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ImportReview } from "@/lib/import-deduplication";
import { normalizeText } from "@/lib/utils";
import { defaultCategoryRules } from "@/services/category-service";
import { parseStatementFile } from "@/services/import-service";
import type { ParsedTransaction } from "@/types/finance";

const fallbackCategories = defaultCategoryRules.map(({ name, keywords }) => ({ name, keywords }));
type PreviewTransaction = ParsedTransaction & { fileHash: string; rowIndex: number; uiId: string; forceImport?: boolean };

type CategoryOption = {
  name: string;
  keywords: string[];
};

type GoalOption = {
  id: string;
  name: string;
  markers: string[];
};

type TagOption =
  | { type: "category"; label: string; value: string; category: string }
  | { type: "goal"; label: string; value: string; goalId: string };

export function ImportDropzone({
  categoryOptions,
  goalOptions
}: {
  categoryOptions: CategoryOption[];
  goalOptions: GoalOption[];
}) {
  const [aiCategories, setAiCategories] = useState<CategoryOption[]>([]);
  const categories = useMemo(() => {
    const baseCategories = categoryOptions.length > 0 ? categoryOptions : fallbackCategories;
    const existingNames = new Set(baseCategories.map((category) => category.name));
    return [...baseCategories, ...aiCategories.filter((category) => !existingNames.has(category.name))];
  }, [categoryOptions, aiCategories]);
  const categoryNames = categories.map((category) => category.name);
  const tagOptions = useMemo<TagOption[]>(() => {
    const categoryTags = categories.flatMap((category) =>
      category.keywords.map((keyword) => ({
        type: "category" as const,
        label: `${keyword} → ${category.name}`,
        value: `category:${category.name}:${keyword}`,
        category: category.name
      }))
    );
    const goalTags = goalOptions.flatMap((goal) =>
      goal.markers.map((marker) => ({
        type: "goal" as const,
        label: `${marker} → ${goal.name}`,
        value: `goal:${goal.id}:${marker}`,
        goalId: goal.id
      }))
    );

    return [...categoryTags, ...goalTags];
  }, [categories, goalOptions]);

  const [transactions, setTransactions] = useState<PreviewTransaction[]>([]);
  const [account, setAccount] = useState("");
  const [review, setReview] = useState<ImportReview[] | null>(null);
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [reading, setReading] = useState(false);
  const [pending, startTransition] = useTransition();
  const [aiPending, startAiTransition] = useTransition();

  function applyAutomaticTag(transaction: ParsedTransaction) {
    const normalizedDescription = normalizeText(transaction.description);
    const tag = tagOptions.find((option) => {
      const marker = option.value.split(":").slice(2).join(":");
      return marker && normalizedDescription.includes(normalizeText(marker));
    });

    if (!tag) return transaction;
    if (tag.type === "category") return { ...transaction, tag: tag.value, category: tag.category };
    return { ...transaction, tag: tag.value, goalId: tag.goalId };
  }

  async function parseFile(file: File) {
    if (file.size > 20 * 1024 * 1024) throw new Error(`${file.name}: limite de 20 MB por arquivo.`);
    if (file.name.toLowerCase().endsWith(".pdf") && file.size > 6 * 1024 * 1024) throw new Error(`${file.name}: limite de 6 MB por PDF. Exporte em CSV/XLSX ou divida o período.`);
    const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
    const fileHash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
    const withIdentity = (transaction: ParsedTransaction, rowIndex: number) => ({ ...applyAutomaticTag(transaction), source: file.name, fileHash, rowIndex, uiId: crypto.randomUUID() });
    if (file.name.toLowerCase().endsWith(".pdf")) {
      const formData = new FormData();
      formData.append("file", file);
      const result = await parsePdfStatement(formData);
      if ("error" in result) throw new Error(`${file.name}: ${result.error}`);
      return result.transactions.map(withIdentity);
    }

    const parsed = await parseStatementFile(file);
    return parsed.map(withIdentity);
  }

  async function handleFiles(files?: FileList | null) {
    setError(undefined);
    setMessage(undefined);
    if (!files?.length) return;
    // Copy FileList before the input is reset so names/count survive async parsing.
    const selectedFiles = Array.from(files);
    setReading(true);
    try {
      const parsedGroups = await Promise.all(selectedFiles.map(parseFile));
      const nextTransactions = parsedGroups.flat();
      if (transactions.length + nextTransactions.length > 5000) throw new Error("Importe até 5.000 transações por lote.");
      if (!nextTransactions.length) throw new Error("Nenhuma transação reconhecida. Confira as colunas Data, Descrição e Valor do arquivo.");
      setReview(null);
      setTransactions((current) => [...current, ...nextTransactions]);
      setFileNames((current) => [...current, ...selectedFiles.map((file) => file.name)]);
      setMessage(`${nextTransactions.length} transações lidas de ${selectedFiles.length} arquivo(s). Revise e salve.`);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Falha ao ler arquivos.");
    } finally {
      setReading(false);
    }
  }

  function updateCategory(index: number, category: string) {
    setTransactions((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, category, categoryLocked: true } : item)));
  }

  function updateGoal(index: number, goalId: string) {
    setTransactions((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, goalId: goalId || undefined } : item)));
  }

  function updateTag(index: number, value: string) {
    const tag = tagOptions.find((option) => option.value === value);
    setTransactions((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        if (!tag) return { ...item, tag: undefined };
        if (tag.type === "category") return { ...item, tag: tag.value, category: tag.category, categoryLocked: true };
        return { ...item, tag: tag.value, goalId: tag.goalId };
      })
    );
  }

  function findTagForClassification(category?: string, goalId?: string) {
    if (goalId) return tagOptions.find((option) => option.type === "goal" && option.goalId === goalId)?.value;
    return tagOptions.find((option) => option.type === "category" && option.category === category)?.value;
  }

  function clearPreview() {
    setTransactions([]);
    setFileNames([]);
    setMessage(undefined);
    setError(undefined);
    setReview(null);
  }

  function updateRow(index: number, values: Partial<PreviewTransaction>) {
    setTransactions((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...values, forceImport: false } : item));
    setReview(null);
  }

  function checkDuplicates(nextTransactions = transactions) {
    startTransition(async () => {
      setError(undefined); setMessage(undefined); setReview(null);
      try {
        const result = await previewImportedTransactions({ account, transactions: nextTransactions });
        if (result.error) setError(result.error);
        else setReview(result.review ?? null);
      } catch { setError("Não foi possível conectar. Tente conferir novamente; sua prévia foi mantida."); }
    });
  }

  function updateForceImport(index: number, forceImport: boolean) {
    const nextTransactions = transactions.map((item, itemIndex) => itemIndex === index ? { ...item, forceImport } : item);
    setTransactions(nextTransactions);
    // A confirmed extra payment changes which rows in overlapping files are
    // duplicates. Refresh the review/count before enabling Save again.
    checkDuplicates(nextTransactions);
  }

  function save() {
    startTransition(async () => {
      setError(undefined);
      try {
      const result = await saveImportedTransactions({ account, transactions });
      if (result?.error) setError(result.error);
      if (result?.success) {
        setMessage(result.success);
        setTransactions([]);
        setFileNames([]);
        setReview(null);
      }
      } catch { setError("A conexão falhou. Tente salvar novamente; a prévia foi mantida."); }
    });
  }

  function classifyWithAi() {
    startAiTransition(async () => {
      setError(undefined);
      setMessage(undefined);
      try {
      const result = await classifyImportedTransactions(transactions);

      if (result?.error) {
        setError(result.error);
        return;
      }

      const classifications = result?.classifications ?? [];
      const createdCategories = result?.createdCategories ?? [];
      const skipped = result?.skipped ?? transactions.length - classifications.length;
      if (createdCategories.length > 0) {
        setAiCategories((current) => {
          const existingNames = new Set(current.map((category) => category.name));
          return [
            ...current,
            ...createdCategories
              .filter((category) => !existingNames.has(category.name))
              .map((category) => ({ name: category.name, keywords: category.keywords }))
          ];
        });
      }
      setTransactions((current) =>
        current.map((transaction, index) => {
          const classification = classifications.find((item) => item.index === index);
          if (!classification) return transaction;

          const tag = findTagForClassification(classification.category, classification.goalId);

          return {
            ...transaction,
            category: classification.category ?? transaction.category,
            goalId: classification.goalId ?? transaction.goalId,
            tag: tag ?? transaction.tag
          };
        })
      );
      setMessage(
        `${classifications.length} transação(ões) classificadas com IA. ${skipped} já tinham categoria e não foram enviadas.${createdCategories.length ? ` ${createdCategories.length} categoria(s) criada(s): ${createdCategories.map((category) => category.name).join(", ")}.` : ""} Revise antes de salvar.`
      );
      } catch { setError("Não foi possível classificar. Tente novamente ou escolha as categorias manualmente."); }
    });
  }

  const busy = reading || pending || aiPending;
  const selectedCount = review?.filter((row) => row.status !== "imported" && (row.status === "new" || transactions[row.index]?.forceImport)).length ?? 0;
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><h2 className="font-semibold">Importar extratos</h2><p className="text-sm text-muted-foreground">Envie, revise e confira duplicadas antes de salvar. Até 5.000 transações por lote.</p></CardHeader>
        <CardContent>
          <label className="mb-4 block text-sm font-medium">Conta de origem<Input value={account} disabled={busy} maxLength={80} onChange={(event) => { setAccount(event.target.value); setReview(null); }} placeholder="Ex.: Nubank final 1234" className="mt-1 block max-w-md" /></label>
          <p className="mb-4 text-sm text-muted-foreground">Use sempre o mesmo nome para esta conta. Contas diferentes podem ter pagamentos iguais.</p>
          <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 px-5 text-center transition hover:bg-muted focus-within:ring-2 focus-within:ring-primary">
            <UploadCloud className="mb-3 size-9 text-primary" />
            <span className="font-medium">{reading ? "Lendo arquivos…" : "Selecione CSV, XLSX ou PDF"}</span>
            <span className="mt-1 text-sm text-muted-foreground">Arquivos da mesma conta. Até 20 MB para planilhas e 6 MB para PDF.</span>
            <input className="sr-only" type="file" accept=".csv,.xlsx,.xls,.pdf" multiple disabled={busy} onChange={(event) => { void handleFiles(event.target.files); event.currentTarget.value = ""; }} />
          </label>
          <details className="mt-3 rounded-lg border border-border p-3 text-sm"><summary className="cursor-pointer font-medium">Formato de exemplo</summary><p className="mt-2 text-muted-foreground">No CSV, use as colunas Data, Descrição e Valor. Valores negativos são gastos; positivos, receitas.</p><pre className="mt-2 overflow-auto rounded bg-muted p-3 text-xs">{"Data;Descrição;Valor\n27/09/2026;Mercado;-125,90\n27/09/2026;Salário;3500,00"}</pre></details>
          {fileNames.length > 0 && <p className="mt-3 break-words text-sm text-muted-foreground">Arquivos: {Array.from(new Set(fileNames)).join(", ")}</p>}
          {error && <p role="alert" className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          {message && <p role="status" className="mt-4 rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">{message}</p>}
        </CardContent>
      </Card>
      {transactions.length > 0 && <Card>
        <CardHeader className="space-y-3">
          <div><h2 className="font-semibold">Revise as {transactions.length} transações</h2><p className="text-sm text-muted-foreground">Edite qualquer campo ou remova uma linha. Depois, confira o que já existe no histórico.</p></div>
          <div className="flex flex-wrap gap-2">
            <button className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border px-3 text-sm" onClick={clearPreview} disabled={busy}><Trash2 className="size-4" />Limpar prévia</button>
            <Button onClick={classifyWithAi} disabled={busy}><Sparkles className="size-4" />{aiPending ? "Classificando…" : "Classificar com IA"}</Button>
            <Button onClick={() => checkDuplicates()} disabled={busy || account.trim().length < 2}>{pending ? "Aguarde…" : "Conferir duplicadas"}</Button>
            <Button onClick={save} disabled={busy || !review || selectedCount === 0}>{pending ? "Aguarde…" : `Salvar ${selectedCount} transações`}</Button>
          </div>
          {review && <div role="status" className="rounded-xl border border-border p-3 text-sm"><strong>{review.filter((row) => row.status === "new").length} novas</strong> · {review.filter((row) => row.status === "imported").length} já importadas · {review.filter((row) => row.status === "possible").length} possíveis repetidas.<p className="mt-1 text-muted-foreground">Repetidas ficam de fora. Se uma possível repetida for outro pagamento real, marque “Importar mesmo assim”. A conferência é refeita ao salvar.</p></div>}
        </CardHeader>
        <CardContent>
          <fieldset disabled={busy} className="min-w-0 divide-y divide-border">
            {transactions.map((item, index) => {
              const status = review?.[index]?.status;
              return <article key={item.uiId} className="space-y-3 py-5 first:pt-0">
                <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-xs text-muted-foreground">{item.source} · linha {item.rowIndex + 1}</p>{status && <p className={status === "new" ? "text-sm text-emerald-500" : "text-sm text-amber-500"}>{status === "new" ? "Nova transação" : status === "imported" ? "Já importada — será ignorada" : "Possível repetida — confira"}</p>}</div><button type="button" className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={`Remover ${item.description} da prévia`} onClick={() => { setTransactions((rows) => rows.filter((row) => row.uiId !== item.uiId)); setReview(null); }}><Trash2 className="size-4" /></button></div>
                <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="min-w-0 text-xs text-muted-foreground">Descrição<Input className="mt-1" maxLength={300} required value={item.description} onChange={(event) => updateRow(index, { description: event.target.value })} /></label>
                  <label className="min-w-0 text-xs text-muted-foreground">Data<Input className="mt-1" type="date" required value={item.date.slice(0, 10)} onChange={(event) => updateRow(index, { date: event.target.value })} /></label>
                  <label className="min-w-0 text-xs text-muted-foreground">Valor (R$)<Input className="mt-1" type="number" inputMode="decimal" min="0.01" step="0.01" required value={item.amount || ""} onChange={(event) => updateRow(index, { amount: Number(event.target.value) })} /></label>
                  <label className="min-w-0 text-xs text-muted-foreground">Tipo<select className="premium-input mt-1 h-10 w-full rounded-xl px-3 text-sm" value={item.type} onChange={(event) => updateRow(index, { type: event.target.value as "INCOME" | "EXPENSE" })}><option value="EXPENSE">Gasto</option><option value="INCOME">Receita</option></select></label>
                  <label className="min-w-0 text-xs text-muted-foreground">Categoria<select className="premium-input mt-1 h-10 w-full rounded-xl px-3 text-sm" value={item.category ?? "Outros"} onChange={(event) => updateCategory(index, event.target.value)}>{categoryNames.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
                </div>
                <details className="text-sm"><summary className="cursor-pointer text-muted-foreground">Regra de categoria e meta</summary><div className="mt-3 grid gap-3 sm:grid-cols-2"><label>Regra<select className="premium-input mt-1 h-10 w-full rounded-xl px-3" value={item.tag ?? ""} onChange={(event) => updateTag(index, event.target.value)}><option value="">Nenhuma regra</option>{tagOptions.map((tag) => <option key={tag.value} value={tag.value}>{tag.label}</option>)}</select></label><label>Meta<select className="premium-input mt-1 h-10 w-full rounded-xl px-3" value={item.goalId ?? ""} onChange={(event) => updateGoal(index, event.target.value)}><option value="">Nenhuma</option>{goalOptions.map((goal) => <option key={goal.id} value={goal.id}>{goal.name}</option>)}</select></label></div></details>
                {status === "possible" && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(item.forceImport)} onChange={(event) => updateForceImport(index, event.target.checked)} />Importar mesmo assim: este é outro pagamento real.</label>}
              </article>;
            })}
          </fieldset>
        </CardContent>
      </Card>}
    </div>
  );
}
