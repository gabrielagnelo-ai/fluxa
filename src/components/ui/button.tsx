import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "premium-button inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-primary-foreground disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}
