import { tokens } from "@floodops/design-tokens";
import type { StatusTone } from "@floodops/design-tokens";
import { useId } from "react";
import type { ReactNode } from "react";
import { Alert as ShadAlert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Card as ShadCard, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Skeleton as ShadSkeleton } from "../components/ui/skeleton";
import { cn } from "../lib/utils";

export function Card({ title, children, description, className }: { title: string; description?: string; children: ReactNode; className?: string }) {
  if (!title.trim()) throw new Error("Cards require a visible title.");
  const heading = useId();
  return <ShadCard role="region" aria-labelledby={heading} className={cn("min-w-0", className)}>
    <CardHeader><CardTitle><h2 id={heading} className="text-base font-semibold tracking-tight">{title}</h2></CardTitle>
      {description && <CardDescription>{description}</CardDescription>}</CardHeader>
    <CardContent className="grid min-w-0 gap-3 [&>*]:min-w-0 [&>p]:m-0">{children}</CardContent>
  </ShadCard>;
}
export function Alert({ title, children, urgent = false, tone }: { title: string; children: ReactNode; urgent?: boolean; tone?: StatusTone }) {
  if (!title.trim()) throw new Error("Alerts require a visible title.");
  const pair = tokens.semantic.status[tone ?? (urgent ? "blocked" : "replan")];
  return <ShadAlert role={urgent ? "alert" : "status"} aria-atomic="true" className="min-w-0 [overflow-wrap:anywhere]"
    style={{ color: pair.fg, backgroundColor: pair.bg, borderColor: pair.border }}>
    <AlertTitle className="line-clamp-none font-semibold">{title}</AlertTitle>
    <AlertDescription className="text-current/90">{children}</AlertDescription>
  </ShadAlert>;
}
export function Skeleton({ label }: { label: string }) {
  if (!label.trim()) throw new Error("Loading states require a label.");
  return <div role="status" aria-label={label} className="grid gap-2"><ShadSkeleton className="h-4 w-1/3" /><ShadSkeleton className="h-10 w-full" />
    <ShadSkeleton className="h-10 w-5/6" /><span className="sr-only">{label}</span></div>;
}
