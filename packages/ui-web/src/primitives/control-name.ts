import type { ReactNode } from "react";

/** Rich content needs an explicit name; plain visible text supplies its own name. */
export function requireControlName(content: ReactNode, label?: string): void {
  const name = label ?? (typeof content === "string" || typeof content === "number" ? String(content) : "");
  if (!name.trim()) throw new Error("Control requires visible text or a non-empty aria-label.");
}
