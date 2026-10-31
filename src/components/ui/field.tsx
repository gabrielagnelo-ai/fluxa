import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Visible label above a form control (placeholder is not a label), same pattern as the access forms. */
export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("form-field", className)}>
      <span className="form-field-label">{label}</span>
      {children}
    </label>
  );
}
