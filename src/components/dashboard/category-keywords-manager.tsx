"use client";

import { useMemo, useState, useActionState } from "react";
import { Plus, RefreshCw, Save, Search, Trash2 } from "lucide-react";
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
  const [updateState, updateAction, updating] = useActionState(
    async (_previousState: { error?: string; success?: string } | undefined, formData: FormData) => updateCategoryKeywords(formData),
    undefined
  );
  const [deleteState, deleteAction, deleting] = useActionState(
    async (_previousState: { error?: string; success?: string } | undefined, formData: FormData) => deleteCategory(formData),
    undefined
  );

  return (
    <div className="rounded-lg border border-border bg-background/30 p-3">
      <form action={updateAction} className="grid gap-3 xl:grid-cols-[220px_1fr_auto] xl:items-start">
        <input type="hidden" name="id" value={category.id} />
        <label className="space-y-1">
          <span className="text-xs font-medium uppercase text-muted-foreground">Categoria</span>
          <Input name="name" defaultValue={category.name} />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium uppercase text-muted-foreground">Identificadores</span>
          <Input name="keywords" defaultValue={category.keywords.join(", ")} placeholder="IFD*, IFOOD, AMI" />
        </label>
        <div className="flex gap-2 xl:pt-6">
          <Button disabled={updating} className="h-10 px-3">
            <Save className="size-4" />
            <span className="hidden sm:inline">{updating ? "Salvando..." : "Salvar"}</span>
          </Button>
        </div>
      </form>

      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-h-4">
          <StatusMessage state={updateState} />
          <StatusMessage state={deleteState} />
        </div>
        <form action={deleteAction}>
          <input type="hidden" name="id" value={category.id} />
          <Button className="h-9 bg-destructive px-3 text-white hover:bg-destructive/90" disabled={deleting}>
            <Trash2 className="size-4" />
            {deleting ? "Excluindo..." : "Excluir"}
          </Button>
        </form>
      </div>
    </div>
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
        <Input name="keywords" placeholder="Identificadores separados por vírgula: IFD*, AMI, SMART FIT" />
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
      <Button className="bg-muted text-foreground hover:bg-muted/80" disabled={pending}>
        <RefreshCw className="size-4" />
        {pending ? "Sincronizando..." : "Restaurar padrões"}
      </Button>
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
            <h2 className="font-semibold">Categorias e identificadores</h2>
            <p className="text-sm text-muted-foreground">Regras usadas para categorizar importações e mensagens do WhatsApp.</p>
          </div>
          <SyncCategoriesButton />
        </div>
        <NewCategoryForm />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative block w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="Buscar categoria ou identificador" />
          </label>
          <p className="text-sm text-muted-foreground">
            {filteredCategories.length} de {categories.length} categoria(s)
          </p>
        </div>

        <div className="space-y-2">
          {categories.length === 0 ? (
            <p className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground">Faça login para editar suas categorias.</p>
          ) : filteredCategories.length === 0 ? (
            <p className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground">Nenhuma categoria encontrada.</p>
          ) : (
            filteredCategories.map((category) => <CategoryKeywordRow key={category.id} category={category} />)
          )}
        </div>
      </CardContent>
    </Card>
  );
}
