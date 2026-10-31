import type { ReactNode } from "react";

/** Page title (xl) with an optional one-line description and the page's primary actions. */
export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  if (!title.trim()) throw new Error("Pages require a visible title.");
  return <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
    <div className="grid min-w-0 gap-1"><h1 className="m-0 text-xl font-semibold tracking-tight [overflow-wrap:anywhere]">{title}</h1>
      {description && <p className="m-0 max-w-[75ch] text-sm text-muted-foreground">{description}</p>}</div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </header>;
}
