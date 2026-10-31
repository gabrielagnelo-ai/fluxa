import { ImportDropzone } from "@/components/import/import-dropzone";
import { PageHeader } from "@/components/layout/page-header";
import { getCategoriesForCurrentUser, getGoalOptionsForCurrentUser } from "@/services/finance-data-service";

export default async function ImportPage() {
  const [categories, goals] = await Promise.all([getCategoriesForCurrentUser(), getGoalOptionsForCurrentUser()]);

  return (
    <div className="fluxa-page workspace-page import-page">
      <PageHeader
        title="Importar extratos"
        description="Envie o extrato do banco. Você revisa as categorias e as duplicadas antes de salvar."
      />
      <div data-tour="import-upload"><ImportDropzone
        categoryOptions={categories.map((category) => ({
          name: category.name,
          keywords: category.keywords
        }))}
        goalOptions={goals.map((goal) => ({
          id: goal.id,
          name: goal.name,
          markers: goal.markers.map((marker) => marker.keyword)
        }))}
      /></div>
    </div>
  );
}
