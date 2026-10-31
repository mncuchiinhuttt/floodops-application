import type { ReactNode } from "react";
function visibleText(content: ReactNode): string {
  if (typeof content === "string" || typeof content === "number") return String(content);
  if (Array.isArray(content)) return content.map(visibleText).join("");
  return "";
}
/** Plain text fragments supply a name. Opaque rich content needs an explicit label. */
export function requireControlName(content: ReactNode, label?: string): void {
  if (!(label ?? visibleText(content)).trim()) throw new Error("Control requires visible text or a non-empty aria-label.");
}
