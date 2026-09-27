"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";

export function PasswordInput({ name, label, value, onChange, newPassword = false, invalid = false, describedBy }: {
  name: string; label: string; value: string; onChange: (value: string) => void;
  newPassword?: boolean; invalid?: boolean; describedBy?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm font-medium">{label}</label>
      <div className="relative">
        <Input id={name} name={name} type={visible ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={newPassword ? "new-password" : "current-password"} minLength={newPassword ? 8 : undefined} maxLength={newPassword ? 128 : undefined} required aria-invalid={invalid} aria-describedby={describedBy} className="h-11 pr-12" />
        <button type="button" onClick={() => setVisible((current) => !current)} aria-label={`${visible ? "Ocultar" : "Mostrar"} ${label.toLowerCase()}`} aria-pressed={visible} className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-xl text-muted-foreground hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
          {visible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}
