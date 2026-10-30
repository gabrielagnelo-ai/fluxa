"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function PasswordInput({ name, label, value, onChange, newPassword = false, error, describedBy }: {
  name: string; label: string; value: string; onChange: (value: string) => void;
  newPassword?: boolean; error?: string; describedBy?: string;
}) {
  const [visible, setVisible] = useState(false);
  const errorId = `${name}-error`;
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-[15px] font-medium">{label}</label>
      <div className="relative">
        <input id={name} name={name} type={visible ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={newPassword ? "new-password" : "current-password"} maxLength={newPassword ? 128 : undefined} required aria-invalid={Boolean(error)} aria-describedby={[error ? errorId : "", describedBy ?? ""].filter(Boolean).join(" ") || undefined} className="field-input pr-14" />
        <button type="button" onClick={() => setVisible((current) => !current)} aria-label={`${visible ? "Ocultar" : "Mostrar"} ${label.toLowerCase()}`} aria-pressed={visible} className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-xl text-[var(--text-2)] hover:text-[var(--text)]">
          {visible ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
        </button>
      </div>
      {error && <p id={errorId} className="field-error">{error}</p>}
    </div>
  );
}
