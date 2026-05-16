"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { deleteMyData } from "@/app/(dashboard)/privacy/actions";
import { Button } from "@/components/ui/button";

export function DeleteDataButton() {
  const [state, action, pending] = useActionState(async () => deleteMyData(), undefined as { error?: string; success?: string } | undefined);

  return (
    <form action={action} className="space-y-3">
      <Button className="bg-red-500 text-white hover:shadow-none" disabled={pending}>
        <Trash2 className="size-4" />
        {pending ? "Excluindo..." : "Excluir meus dados"}
      </Button>
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-400">{state.success}</p>}
    </form>
  );
}
