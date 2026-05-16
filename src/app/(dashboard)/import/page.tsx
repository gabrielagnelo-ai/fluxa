import { ImportDropzone } from "@/components/import/import-dropzone";
import { PageHeader } from "@/components/layout/page-header";
import { getCategoriesForCurrentUser, getGoalOptionsForCurrentUser } from "@/services/finance-data-service";

export default async function ImportPage() {
  const [categories, goals] = await Promise.all([getCategoriesForCurrentUser(), getGoalOptionsForCurrentUser()]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="CSV, XLSX e PDF"
        title="Importação de extratos"
        description="Anexe vários arquivos, revise categorias, escolha tags e vincule metas antes de salvar."
      />
      <ImportDropzone
        categoryOptions={categories.map((category) => ({
          name: category.name,
          keywords: category.keywords
        }))}
        goalOptions={goals.map((goal) => ({
          id: goal.id,
          name: goal.name,
          markers: goal.markers.map((marker) => marker.keyword)
        }))}
      />
    </div>
  );
}
