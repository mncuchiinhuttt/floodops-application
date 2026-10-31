import type { ReactNode } from "react";

/** One metric: quiet label, big tabular value, optional hint. A row of tiles shares one accent: the numbers differ, not the colour. */
export function StatTile({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return <div className="grid min-w-0 gap-1 rounded-xl border bg-card p-4">
    <span className="text-xs font-medium text-muted-foreground">{label}</span>
    <span className="text-2xl font-semibold tracking-tight tabular-nums [overflow-wrap:anywhere]">{value}</span>
    {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
  </div>;
}
