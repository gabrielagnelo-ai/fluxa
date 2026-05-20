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

const AUTO_DISMISS_MS = 5500;

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
                body: `${cleanDescription(payload.latest.description)} - ${formatCurrency(payload.latest.amount)}`
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
    const timeoutId = setTimeout(() => setNotice(null), AUTO_DISMISS_MS);
    return () => clearTimeout(timeoutId);
  }, [notice]);

  if (!notice) return null;

  return (
    <div className="fixed right-4 top-4 z-50 w-[calc(100vw-2rem)] max-w-md animate-[toast-enter_240ms_ease-out]">
      <div className="overflow-hidden rounded-2xl border border-emerald-500/25 bg-[#10251f]/95 shadow-glow backdrop-blur-xl">
        <div className="flex items-start gap-3 p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/20">
            <CheckCircle2 className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-foreground">Registro do WhatsApp confirmado</p>
              <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                Gravado no banco
              </span>
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {cleanDescription(notice.description)}
            </p>
            <p className="mt-2 text-sm font-semibold text-emerald-200">
              {formatCurrency(notice.amount)} <span className="text-muted-foreground">em {notice.category}</span>
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
        <div className="h-1 w-full bg-emerald-400/10">
          <div className="h-full w-full origin-left animate-[toast-progress_5.5s_linear_forwards] bg-emerald-400/70" />
        </div>
      </div>
    </div>
  );
}
