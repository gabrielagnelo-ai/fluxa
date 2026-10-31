"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Toast } from "@/components/ui/toast";
import { displayName, formatCurrency } from "@/lib/utils";

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

  if (!notice) return null;

  const viaWhatsApp = notice.source === "WHATSAPP" || /^WhatsApp\s+-\s+/i.test(notice.description);
  const title = `${notice.type === "INCOME" ? "Entrada registrada" : "Gasto registrado"}${viaWhatsApp ? " pelo WhatsApp" : ""}`;
  const detail = `${formatCurrency(notice.amount)} em ${displayName(notice.category)}`;

  return <Toast key={`${notice.description}-${notice.amount}`} icon={viaWhatsApp ? "whatsapp" : "check"} title={title} detail={detail} onClose={() => setNotice(null)} />;
}
