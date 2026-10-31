"use client";

import { useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** A button that opens a glass sheet holding a form: forms stay closed until asked for. */
export function SheetButton({ label, title, icon, children, filled = false, className }: {
  label: string; title: string; icon?: ReactNode; children: ReactNode; filled?: boolean; className?: string;
}) {
  const sheet = useRef<HTMLDialogElement>(null);
  const heading = useId();
  return (
    <>
      <button type="button" className={cn("btn", filled ? "btn-filled" : "btn-gray", className)} aria-haspopup="dialog" onClick={() => sheet.current?.showModal()}>{icon}{label}</button>
      <dialog ref={sheet} className="sheet" aria-labelledby={heading} onClick={event => { if (event.target === event.currentTarget) sheet.current?.close(); }}>
        <div className="sheet-grabber" aria-hidden="true" />
        <div className="sheet-bar">
          <span />
          <h2 id={heading} className="sheet-title">{title}</h2>
          <button type="button" className="btn btn-plain btn-plain-strong" onClick={() => sheet.current?.close()}>Fechar</button>
        </div>
        <div className="sheet-body">{children}</div>
      </dialog>
    </>
  );
}
