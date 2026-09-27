"use client";

import { useActionState, useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteMyData } from "@/app/(dashboard)/privacy/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DeleteDataButton() {
  const [reviewing, setReviewing] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [state, action, pending] = useActionState(async (_previous: { error?: string } | undefined, formData: FormData) => deleteMyData(formData), undefined);
  if (!reviewing) return <Button type="button" className="min-h-11 bg-muted text-foreground hover:bg-muted/80" onClick={() => setReviewing(true)}><Trash2 className="size-4" aria-hidden="true" />Revisar exclusão de dados</Button>;
  return (
    <form action={action} onReset={(event) => event.preventDefault()} className="space-y-3 rounded-xl border border-destructive/40 p-4" aria-label="Confirmar exclusão de dados">
      <p className="font-semibold text-foreground">Esta exclusão é permanente</p>
      <p>Seu histórico financeiro será apagado. O cadastro de acesso e os consentimentos no banco não serão excluídos.</p>
      <label className="flex items-start gap-3"><input name="acknowledged" type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} required className="mt-1 size-4 accent-primary" /><span>Entendi quais dados serão excluídos e que não poderei recuperá-los.</span></label>
      <div className="space-y-1.5"><label htmlFor="delete-confirmation" className="font-medium text-foreground">Digite APAGAR MEUS DADOS</label><Input id="delete-confirmation" name="confirmation" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" required className="h-11" /></div>
      <div className="flex flex-wrap gap-2"><Button type="button" className="min-h-11 bg-muted text-foreground" disabled={pending} onClick={() => { setReviewing(false); setConfirmation(""); setAcknowledged(false); }}>Cancelar</Button><Button className="min-h-11 bg-red-600 text-white hover:bg-red-700" disabled={pending || confirmation !== "APAGAR MEUS DADOS" || !acknowledged}>{pending ? "Excluindo..." : "Excluir dados definitivamente"}</Button></div>
      {state?.error && <p role="alert" className="text-sm text-red-400">{state.error}</p>}
    </form>
  );
}
