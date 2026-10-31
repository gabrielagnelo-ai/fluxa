"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function PasswordInput({ name, label, value, onChange, newPassword = false, invalid = false, describedBy }: {
  name: string; label: string; value: string; onChange: (value: string) => void;
  newPassword?: boolean; invalid?: boolean; describedBy?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="auth-field">
      <label htmlFor={name}>{label}</label>
      <div className="auth-field-control">
        <input id={name} name={name} type={visible ? "text" : "password"} value={value} onChange={event => onChange(event.target.value)} autoComplete={newPassword ? "new-password" : "current-password"} minLength={newPassword ? 8 : undefined} maxLength={newPassword ? 128 : undefined} required aria-invalid={invalid} aria-describedby={describedBy} />
        <button type="button" className="icon-btn" onClick={() => setVisible(current => !current)} aria-label={`${visible ? "Ocultar" : "Mostrar"} ${label.toLowerCase()}`} aria-pressed={visible}>
          {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}
