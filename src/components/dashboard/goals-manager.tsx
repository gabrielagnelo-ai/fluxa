"use client";

import { useActionState } from "react";
import { CalendarClock, Pencil, TrendingUp, Trash2 } from "lucide-react";
import { deleteGoal, upsertGoal } from "@/app/(dashboard)/goals/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DEFAULT_SAVINGS_MONTHLY_RATE_LABEL, monthlyYield, monthsUntilDate, projectCompoundBalance } from "@/lib/savings-projection";
import { formatCurrency } from "@/lib/utils";
import { Field } from "@/components/ui/field";

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
    <form action={action} className="grid items-end gap-3 md:grid-cols-4">
      {goal?.id && <input type="hidden" name="id" value={goal.id} />}
      <Field label="Nome da meta"><Input name="name" defaultValue={goal?.name} placeholder="Ex.: Reserva de emergência" required /></Field>
      <Field label="Valor alvo (R$)"><Input name="targetAmount" defaultValue={goal?.targetAmount} type="number" min="0" step="0.01" placeholder="0,00" required /></Field>
      <Field label="Data da meta (opcional)"><Input name="dueDate" defaultValue={goal?.dueDate?.slice(0, 10)} type="date" /></Field>
      <Field label="Situação"><select name="status" defaultValue={goal?.status ?? "ACTIVE"} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
        <option value="ACTIVE">Ativa</option>
        <option value="PAUSED">Pausada</option>
        <option value="COMPLETED">Concluída</option>
      </select></Field>
      <Field label="Palavras para identificar o depósito" className="md:col-span-4"><textarea
        name="markers"
        defaultValue={goal?.markers.join(", ")}
        className="min-h-20 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        placeholder="Ex.: META RESERVA, APLICACAO RESERVA"
      /></Field>
      <Button disabled={pending} className="md:col-span-4 md:justify-self-end">{pending ? "Salvando..." : goal ? "Atualizar meta" : "Criar meta"}</Button>
      {state?.error && <p className="md:col-span-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}
      {state?.success && <p className="md:col-span-4 rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">{state.success}</p>}
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
      <button type="submit" className="btn btn-plain is-destructive" disabled={pending} onClick={(event) => { if (!confirm("Excluir esta meta?")) event.preventDefault(); }}>
        <Trash2 className="size-4" aria-hidden="true" />
        {pending ? "Excluindo..." : "Excluir meta"}
      </button>
    </form>
  );
}

export function GoalsManager({ goals }: { goals: GoalItem[] }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <h2 className="font-semibold">Nova meta</h2>
          <p className="text-sm text-muted-foreground">O Fluxa cria palavras para reconhecer quando você guardou dinheiro para essa meta.</p>
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
                  <div className="goal-progress-fill h-2 rounded-full bg-primary" style={{ width: `${progress}%` }} />
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
                      Projeção sem novos depósitos: {formatCurrency(projectedYield)} de rendimento estimado.
                    </p>
                  </div>
                </div>
                <details className="goal-editor">
                  <summary><Pencil className="size-4" aria-hidden="true" />Editar meta</summary>
                  <div className="goal-editor-body"><GoalForm goal={goal} /></div>
                </details>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
