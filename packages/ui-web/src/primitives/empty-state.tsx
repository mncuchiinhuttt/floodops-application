import type { ReactNode } from "react";

/** One sentence of what is missing, one line of why or how to fill it, at most one next action. */
export function EmptyState({ title, description, icon, action }: { title: string; description?: string; icon?: ReactNode; action?: ReactNode }) {
  if (!title.trim()) throw new Error("Empty states require a title.");
  return <div className="grid place-items-center gap-2 rounded-xl border border-dashed bg-card px-6 py-10 text-center">
    {icon && <div aria-hidden="true" className="grid size-10 place-items-center rounded-full bg-secondary text-muted-foreground">{icon}</div>}
    <p className="m-0 text-base font-medium">{title}</p>
    {description && <p className="m-0 max-w-[48ch] text-sm text-muted-foreground">{description}</p>}
    {action && <div className="mt-2">{action}</div>}
  </div>;
}
