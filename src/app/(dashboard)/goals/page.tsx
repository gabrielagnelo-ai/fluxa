import { GoalsManager } from "@/components/dashboard/goals-manager";
import { PageHeader } from "@/components/layout/page-header";
import { getGoalsForCurrentUser } from "@/services/finance-data-service";

export default async function GoalsPage() {
  const goals = await getGoalsForCurrentUser();

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Metas financeiras"
        title="Objetivos"
        description="Crie metas, acompanhe o dinheiro guardado e ensine o Fluxa como reconhecer depositos para cada objetivo."
      />
      <GoalsManager
        goals={goals.map((goal) => ({
          id: goal.id,
          name: goal.name,
          targetAmount: Number(goal.targetAmount),
          dueDate: goal.dueDate?.toISOString() ?? null,
          status: goal.status,
          markers: goal.markers.map((marker) => marker.keyword),
          contributedAmount: goal.contributions.reduce((sum, contribution) => sum + Number(contribution.amount), 0),
          savedAmount: Number(goal.currentAmount) + goal.contributions.reduce((sum, contribution) => sum + Number(contribution.amount), 0)
        }))}
      />
    </div>
  );
}
