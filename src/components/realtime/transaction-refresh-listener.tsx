"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type TransactionUpdate = {
  signature?: string;
  latest?: {
    description: string;
    amount: number;
    type: "INCOME" | "EXPENSE";
    category: string;
    source?: string | null;
  } | null;
};

function cleanDescription(description: string) {
  return description.replace(/^WhatsApp\s+-\s+/i, "");
}

export function TransactionRefreshListener() {
  const router = useRouter();
  const lastSignatureRef = useRef<string | null>(null);
  const [notice, setNotice] = useState<TransactionUpdate["latest"]>(null);

  useEffect(() => {
    let active = true;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    async function checkUpdates() {
      if (!active) return;

      if (document.visibilityState === "hidden") {
        timeoutId = setTimeout(checkUpdates, 7000);
        return;
      }

      try {
        const response = await fetch("/api/transactions/updates", {
          cache: "no-store",
          headers: { Accept: "application/json" }
        });

        if (response.ok) {
          const payload = (await response.json()) as TransactionUpdate;
          const nextSignature = payload.signature ?? null;

          if (!lastSignatureRef.current) {
            lastSignatureRef.current = nextSignature;
          } else if (nextSignature && nextSignature !== lastSignatureRef.current) {
            lastSignatureRef.current = nextSignature;
            setNotice(payload.latest ?? null);
            router.refresh();

            if (payload.latest && "Notification" in window && Notification.permission === "granted") {
              new Notification("Fluxa", {
                body: `${cleanDescription(payload.latest.description)} · ${formatCurrency(payload.latest.amount)}`
              });
            }
          }
        }
      } catch {
        // The listener is opportunistic; failed checks should not affect navigation.
      } finally {
        timeoutId = setTimeout(checkUpdates, 4000);
      }
    }

    checkUpdates();

    return () => {
      active = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [router]);

  useEffect(() => {
    if (!notice) return;
    const timeoutId = setTimeout(() => setNotice(null), 7000);
    return () => clearTimeout(timeoutId);
  }, [notice]);

  if (!notice) return null;

  return (
    <div className="fixed right-4 top-4 z-50 w-[calc(100vw-2rem)] max-w-sm rounded-xl border border-emerald-500/30 bg-card/95 p-4 shadow-glow backdrop-blur-xl">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-emerald-500/15 text-emerald-400">
          <CheckCircle2 className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Nova transação registrada</p>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {cleanDescription(notice.description)} · {formatCurrency(notice.amount)} · {notice.category}
          </p>
        </div>
        <button
          type="button"
          className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          onClick={() => setNotice(null)}
          aria-label="Fechar aviso"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
