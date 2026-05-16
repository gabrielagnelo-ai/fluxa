import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions
}: {
  eyebrow?: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-border pb-5 xl:flex-row xl:items-end xl:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="text-sm font-medium text-primary">{eyebrow}</p>}
        <h1 className="mt-1 text-3xl font-semibold tracking-normal sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </header>
  );
}
