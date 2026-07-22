"use client";

import { useActionState } from "react";
import { CalendarClock, TrendingUp, Trash2 } from "lucide-react";
import { deleteGoal, upsertGoal } from "@/app/(dashboard)/goals/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DEFAULT_SAVINGS_MONTHLY_RATE_LABEL, monthlyYield, monthsUntilDate, projectCompoundBalance } from "@/lib/savings-projection";
import { formatCurrency } from "@/lib/utils";

type GoalItem = {
  id: string;
  name: string;
  targetAmount: number;
  dueDate: string | null;
  status: "ACTIVE" | "PAUSED" | "COMPLETED";
  markers: string[];
  contributedAmount: number;
  savedAmount: number;
};

function GoalForm({ goal }: { goal?: GoalItem }) {
  const [state, action, pending] = useActionState(
    async (_previousState: { error?: string; success?: string } | undefined, formData: FormData) => upsertGoal(formData),
    undefined
  );

  return (
    <form action={action} className="grid gap-3 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.7fr_auto]">
      {goal?.id && <input type="hidden" name="id" value={goal.id} />}
      <Input name="name" defaultValue={goal?.name} placeholder="Nome da meta" required />
      <Input name="targetAmount" defaultValue={goal?.targetAmount} type="number" min="0" step="0.01" placeholder="Valor alvo" required />
      <Input name="dueDate" defaultValue={goal?.dueDate?.slice(0, 10)} type="date" />
      <select name="status" defaultValue={goal?.status ?? "ACTIVE"} className="h-10 rounded-md border border-border bg-background px-3 text-sm">
        <option value="ACTIVE">Ativa</option>
        <option value="PAUSED">Pausada</option>
        <option value="COMPLETED">Concluída</option>
      </select>
      <Button disabled={pending}>{pending ? "Salvando..." : goal ? "Atualizar" : "Criar"}</Button>
      <textarea
        name="markers"
        defaultValue={goal?.markers.join(", ")}
        className="min-h-20 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 md:col-span-5"
        placeholder="Palavras para identificar deposito: META RESERVA, APLICACAO RESERVA"
      />
      {state?.error && <p className="md:col-span-5 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}
      {state?.success && <p className="md:col-span-5 rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">{state.success}</p>}
    </form>
  );
}

function DeleteGoalButton({ id }: { id: string }) {
  const [, action, pending] = useActionState(
    async (_previousState: { error?: string; success?: string } | undefined, formData: FormData) => deleteGoal(formData),
    undefined
  );

  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <Button className="bg-destructive text-white hover:bg-destructive/90" disabled={pending}>
        <Trash2 className="size-4" />
        {pending ? "Excluindo..." : "Excluir"}
      </Button>
    </form>
  );
}

export function GoalsManager({ goals }: { goals: GoalItem[] }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <h2 className="font-semibold">Nova meta</h2>
          <p className="text-sm text-muted-foreground">O Fluxa cria palavras para reconhecer quando voce guardou dinheiro para essa meta.</p>
        </CardHeader>
        <CardContent>
          <GoalForm />
        </CardContent>
      </Card>

      {goals.length === 0 ? (
        <Card>
          <CardContent className="pt-5 text-sm text-muted-foreground">Nenhuma meta cadastrada para este usuário.</CardContent>
        </Card>
      ) : (
        goals.map((goal) => {
          const progress = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.savedAmount / goal.targetAmount) * 100)) : 0;
          const projectionMonths = monthsUntilDate(goal.dueDate) ?? 12;
          const projectedBalance = projectCompoundBalance({ principal: goal.savedAmount, months: projectionMonths });
          const projectedYield = Math.max(0, projectedBalance - goal.savedAmount);
          const periodLabel = goal.dueDate ? "Na data da meta" : "Em 12 meses";

          return (
            <Card key={goal.id}>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-semibold">{goal.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(goal.savedAmount)} de {formatCurrency(goal.targetAmount)} · {progress}%
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Dinheiro guardado identificado: {formatCurrency(goal.contributedAmount)} · Palavras usadas: {goal.markers.join(", ") || "nenhuma"}
                  </p>
                </div>
                <DeleteGoalButton id={goal.id} />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${progress}%` }} />
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-lg border border-border bg-background/35 p-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="size-4 text-emerald-500" />
                      Rendimento mensal
                    </div>
                    <strong className="mt-1 block text-lg text-emerald-500">{formatCurrency(monthlyYield(goal.savedAmount))}</strong>
                    <p className="mt-1 text-xs text-muted-foreground">Conta rendendo {DEFAULT_SAVINGS_MONTHLY_RATE_LABEL}.</p>
                  </div>
                  <div className="rounded-lg border border-border bg-background/35 p-3 md:col-span-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarClock className="size-4 text-primary" />
                      {periodLabel}
                    </div>
                    <strong className="mt-1 block text-lg">{formatCurrency(projectedBalance)}</strong>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Projecao sem novos depositos: {formatCurrency(projectedYield)} de rendimento estimado.
                    </p>
                  </div>
                </div>
                <GoalForm goal={goal} />
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
