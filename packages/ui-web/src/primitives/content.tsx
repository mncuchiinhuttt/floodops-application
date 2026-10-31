import { tokens } from "@floodops/design-tokens";
import type { StatusTone } from "@floodops/design-tokens";
import { useId } from "react";
import type { ReactNode } from "react";
export function Card({ title, children, description }: { title: string; description?: string; children: ReactNode }) {
  if (!title.trim()) throw new Error("Cards require a visible title.");
  const heading = useId();
  return <section className="fo-card" aria-labelledby={heading}>
    <h2 id={heading}>{title}</h2>{description && <p className="fo-hint">{description}</p>}{children}
  </section>;
}
export function Alert({ title, children, urgent = false, tone }: { title: string; children: ReactNode; urgent?: boolean; tone?: StatusTone }) {
  if (!title.trim()) throw new Error("Alerts require a visible title.");
  const pair = tokens.semantic.status[tone ?? (urgent ? "blocked" : "replan")];
  return <div className="fo-alert" role={urgent ? "alert" : "status"} aria-atomic="true"
    style={{ color: pair.fg, backgroundColor: pair.bg, borderColor: pair.border }}>
    <strong>{title}</strong><div>{children}</div>
  </div>;
}
export function Skeleton({ label }: { label: string }) {
  if (!label.trim()) throw new Error("Loading states require a label.");
  return <div role="status" aria-label={label} className="fo-skeleton"><span className="fo-sr-only">{label}</span></div>;
}
