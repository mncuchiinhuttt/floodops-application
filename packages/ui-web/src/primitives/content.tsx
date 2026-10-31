import { useId } from "react";
import type { ReactNode } from "react";
export function Card({ title, children, description }: { title: string; description?: string; children: ReactNode }) {
  const heading = useId();
  return <section className="fo-card" aria-labelledby={heading}>
    <h2 id={heading}>{title}</h2>{description && <p className="fo-hint">{description}</p>}{children}
  </section>;
}
export function Alert({ title, children, urgent = false }: { title: string; children: ReactNode; urgent?: boolean }) {
  return <div className="fo-alert" role={urgent ? "alert" : "status"} aria-atomic="true">
    <strong>{title}</strong><div>{children}</div>
  </div>;
}
export function Skeleton({ label }: { label: string }) {
  return <div role="status" aria-label={label} className="fo-skeleton"><span className="fo-sr-only">{label}</span></div>;
}
