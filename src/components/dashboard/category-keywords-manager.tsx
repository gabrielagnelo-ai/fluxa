"use client";

import { useActionState } from "react";
import { Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { createCategory, deleteCategory, syncDefaultCategories, updateCategoryKeywords } from "@/app/(dashboard)/settings/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type CategoryKeywordItem = {
  id: string;
  name: string;
  keywords: string[];
};

function CategoryKeywordForm({ category }: { category: CategoryKeywordItem }) {
  const [state, action, pending] = useActionState(
    async (_previousState: { error?: string; success?: string } | undefined, formData: FormData) => updateCategoryKeywords(formData),
    undefined
  );

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={category.id} />
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Categoria</span>
        <Input name="name" defaultValue={category.name} />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Identificadores</span>
        <textarea
          name="keywords"
          defaultValue={category.keywords.join(", ")}
          className="min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          placeholder="IFD*, IFD, IFOOD"
        />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={pending}>
          <Save className="size-4" />
          {pending ? "Salvando..." : "Salvar"}
        </Button>
      </div>
      {state?.error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}
      {state?.success && <p className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">{state.success}</p>}
    </form>
  );
}

function NewCategoryForm() {
  const [state, action, pending] = useActionState(
    async (_previousState: { error?: string; success?: string } | undefined, formData: FormData) => createCategory(formData),
    undefined
  );

  return (
    <form action={action} className="rounded-lg border border-border bg-muted/20 p-4">
      <div className="grid gap-3 md:grid-cols-[0.6fr_1fr_auto]">
        <Input name="name" placeholder="Nova categoria" required />
        <Input name="keywords" placeholder="Identificadores: IFD*, AMI, SMART FIT" />
        <Button disabled={pending}>
          <Plus className="size-4" />
          {pending ? "Criando..." : "Criar"}
        </Button>
      </div>
      {state?.error && <p className="mt-3 text-sm text-destructive">{state.error}</p>}
      {state?.success && <p className="mt-3 text-sm text-primary">{state.success}</p>}
    </form>
  );
}

function SyncCategoriesButton() {
  const [state, action, pending] = useActionState(
    async () => syncDefaultCategories(),
    undefined
  );

  return (
    <form action={action} className="space-y-2">
      <Button className="bg-muted text-foreground hover:bg-muted/80" disabled={pending}>
        <RefreshCw className="size-4" />
        {pending ? "Sincronizando..." : "Sincronizar categorias padrão"}
      </Button>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.success && <p className="text-sm text-primary">{state.success}</p>}
    </form>
  );
}

function DeleteCategoryButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState(
    async (_previousState: { error?: string; success?: string } | undefined, formData: FormData) => deleteCategory(formData),
    undefined
  );

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="id" value={id} />
      <Button className="bg-destructive text-white hover:bg-destructive/90" disabled={pending}>
        <Trash2 className="size-4" />
        {pending ? "Excluindo..." : "Excluir"}
      </Button>
      {state?.error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}
      {state?.success && <p className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">{state.success}</p>}
    </form>
  );
}

export function CategoryKeywordsManager({ categories }: { categories: CategoryKeywordItem[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-semibold">Categorias e identificadores</h2>
            <p className="text-sm text-muted-foreground">
              Edite categorias e palavras que aparecem no extrato. Exemplo: IFD* em iFood, AMI em RU UTFPR.
            </p>
          </div>
          <SyncCategoriesButton />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <NewCategoryForm />
        <div className="grid gap-4 lg:grid-cols-2">
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">Faça login para editar suas categorias.</p>
          ) : (
            categories.map((category) => (
              <div key={category.id} className="rounded-lg border border-border bg-muted/20 p-4">
                <CategoryKeywordForm category={category} />
                <div className="mt-3 border-t border-border pt-3">
                  <DeleteCategoryButton id={category.id} />
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
