"use client";

import { useMemo, useState, useTransition } from "react";
import { Sparkles, Trash2, UploadCloud } from "lucide-react";
import { classifyImportedTransactions, parsePdfStatement, saveImportedTransactions } from "@/app/(dashboard)/import/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { normalizeText } from "@/lib/utils";
import { defaultCategoryRules } from "@/services/category-service";
import { parseStatementFile } from "@/services/import-service";
import type { ParsedTransaction } from "@/types/finance";

const fallbackCategories = defaultCategoryRules.map(({ name, keywords }) => ({ name, keywords }));

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

  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
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
    if (file.name.toLowerCase().endsWith(".pdf")) {
      const formData = new FormData();
      formData.append("file", file);
      const result = await parsePdfStatement(formData);
      if ("error" in result) throw new Error(`${file.name}: ${result.error}`);
      return result.transactions.map((transaction) => applyAutomaticTag({ ...transaction, source: file.name }));
    }

    const parsed = await parseStatementFile(file);
    return parsed.map((transaction) => applyAutomaticTag({ ...transaction, source: file.name }));
  }

  async function handleFiles(files?: FileList | null) {
    setError(undefined);
    setMessage(undefined);
    if (!files?.length) return;

    setReading(true);
    try {
      const parsedGroups = await Promise.all(Array.from(files).map(parseFile));
      const nextTransactions = parsedGroups.flat();

      setTransactions((current) => [...current, ...nextTransactions]);
      setFileNames((current) => [...current, ...Array.from(files).map((file) => file.name)]);
      setMessage(`${nextTransactions.length} transações lidas de ${files.length} arquivo(s). Revise e salve.`);
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
  }

  function save() {
    startTransition(async () => {
      setError(undefined);
      const result = await saveImportedTransactions(transactions);
      if (result?.error) setError(result.error);
      if (result?.success) {
        setMessage(result.success);
        setTransactions([]);
        setFileNames([]);
      }
    });
  }

  function classifyWithAi() {
    startAiTransition(async () => {
      setError(undefined);
      setMessage(undefined);
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
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <h2 className="font-semibold">Importar extratos</h2>
          <p className="text-sm text-muted-foreground">
            Tags de categoria e marcadores de meta aparecem na prévia para seleção manual.
          </p>
        </CardHeader>
        <CardContent>
          <label className="flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 px-5 text-center transition hover:bg-muted">
            <UploadCloud className="mb-3 size-9 text-primary" />
            <span className="font-medium">{reading ? "Lendo arquivos..." : "Selecione CSV, XLSX ou PDF"}</span>
            <span className="mt-1 text-sm text-muted-foreground">Colunas esperadas: data, descrição e valor.</span>
            <input
              className="sr-only"
              type="file"
              accept=".csv,.xlsx,.xls,.pdf"
              multiple
              disabled={reading}
              onChange={(event) => {
                void handleFiles(event.target.files);
                event.currentTarget.value = "";
              }}
            />
          </label>
          <p className="mt-3 text-sm text-muted-foreground">
            Tags disponíveis: {tagOptions.length ? tagOptions.map((tag) => tag.label).join(", ") : "nenhuma tag cadastrada"}
          </p>
          {fileNames.length > 0 && (
            <p className="mt-3 text-sm text-muted-foreground">
              Arquivos na prévia: {Array.from(new Set(fileNames)).join(", ")}
            </p>
          )}
          {error && <p className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          {message && <p className="mt-4 rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">{message}</p>}
        </CardContent>
      </Card>

      {transactions.length > 0 && (
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">Prévia da importação</h2>
              <p className="text-sm text-muted-foreground">{transactions.length} transações reconhecidas em lote.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button className="bg-muted text-foreground hover:bg-muted/80" onClick={clearPreview} disabled={pending || aiPending}>
                <Trash2 className="size-4" />
                Limpar
              </Button>
              <Button className="bg-blue-500 text-white hover:bg-blue-500/90" onClick={classifyWithAi} disabled={pending || aiPending || reading}>
                <Sparkles className="size-4" />
                {aiPending ? "Classificando..." : "Classificar com IA"}
              </Button>
              <Button onClick={save} disabled={pending || aiPending || reading}>
                {pending ? "Salvando..." : "Salvar transações"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1180px] text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="py-3 font-medium">Data</th>
                    <th className="font-medium">Descrição</th>
                    <th className="font-medium">Arquivo</th>
                    <th className="font-medium">Tipo</th>
                    <th className="font-medium">Tag</th>
                    <th className="font-medium">Categoria</th>
                    <th className="font-medium">Meta</th>
                    <th className="text-right font-medium">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((item, index) => (
                    <tr key={`${item.description}-${item.date}-${index}`} className="border-b border-border/60 transition last:border-0 hover:bg-muted/40">
                      <td className="py-3 text-muted-foreground">{new Date(item.date).toLocaleDateString("pt-BR")}</td>
                      <td className="max-w-[320px] truncate font-medium">{item.description}</td>
                      <td className="max-w-48 truncate text-muted-foreground">{item.source ?? "Upload"}</td>
                      <td>{item.type === "INCOME" ? "Entrada" : "Saída"}</td>
                      <td>
                        <select className="h-9 min-w-56 rounded-md border border-border bg-background px-2" value={item.tag ?? ""} onChange={(event) => updateTag(index, event.target.value)}>
                          <option value="">Nenhuma</option>
                          <optgroup label="Categorias">
                            {tagOptions.filter((tag) => tag.type === "category").map((tag) => (
                              <option key={tag.value} value={tag.value}>{tag.label}</option>
                            ))}
                          </optgroup>
                          <optgroup label="Metas">
                            {tagOptions.filter((tag) => tag.type === "goal").map((tag) => (
                              <option key={tag.value} value={tag.value}>{tag.label}</option>
                            ))}
                          </optgroup>
                        </select>
                      </td>
                      <td>
                        <select className="h-9 rounded-md border border-border bg-background px-2" value={item.category ?? "Outros"} onChange={(event) => updateCategory(index, event.target.value)}>
                          {categoryNames.map((category) => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select className="h-9 min-w-40 rounded-md border border-border bg-background px-2" value={item.goalId ?? ""} onChange={(event) => updateGoal(index, event.target.value)}>
                          <option value="">Nenhuma</option>
                          {goalOptions.map((goal) => (
                            <option key={goal.id} value={goal.id}>{goal.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="text-right font-semibold">R$ {item.amount.toFixed(2).replace(".", ",")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

