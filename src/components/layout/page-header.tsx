import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, description, actions }: {
  eyebrow?: ReactNode; title: string; description?: string; actions?: ReactNode;
}) {
  return <>
    <header className="fluxa-header">
      <div className="fluxa-header-copy">
        {eyebrow && <div className="fluxa-header-eyebrow">{eyebrow}</div>}
        <h1 className="text-foreground">{title}</h1>
        {description && <p className="fluxa-header-description">{description}</p>}
      </div>
      {actions && <div className="fluxa-header-actions">{actions}</div>}
    </header>
  </>;
}
