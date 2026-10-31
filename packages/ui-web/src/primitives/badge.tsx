import { tokens } from "@floodops/design-tokens";
import type { StatusTone, ProvenanceTone, PriorityTone } from "@floodops/design-tokens";
import { Icon } from "@floodops/icons/web";
import type { IconName } from "@floodops/icons/web";
import { Badge as ShadBadge } from "../components/ui/badge";

type BadgePair = { fg: string; bg: string; border: string; icon: string; pattern: string };
/** Border style carries the pattern so a tone is never colour alone (icon + label + pattern). */
const patternStyle: Record<string, "solid" | "dashed" | "dotted" | "double"> = { dashed: "dashed", dotted: "dotted", double: "double" };
function Badge({ pair, label }: { pair: BadgePair; label: string }) {
  if (!label.trim()) throw new Error("Status badges require a visible label.");
  return <ShadBadge variant="outline" data-pattern={pair.pattern} className="h-6 gap-1.5 px-2.5 [overflow-wrap:anywhere]"
    style={{ color: pair.fg, backgroundColor: pair.bg, borderColor: pair.border, borderStyle: patternStyle[pair.pattern] ?? "solid",
      borderWidth: pair.pattern === "crosshatch" || pair.pattern === "double" ? 2 : 1 }}>
    <Icon name={pair.icon as IconName} size={14} decorative />{label}
  </ShadBadge>;
}
export function StatusBadge({ tone, label }: { tone: StatusTone; label: string }) {
  return <Badge pair={tokens.semantic.status[tone]} label={label} />;
}
export function ProvenanceBadge({ tone }: { tone: ProvenanceTone }) {
  const label = { reference: "Reference data", replayed: "Replayed", simulated: "Simulated" }[tone];
  return <Badge pair={tokens.semantic.provenance[tone]} label={label} />;
}
export function PriorityBadge({ tone }: { tone: PriorityTone }) {
  const label = { critical: "Critical", food: "Food", standard: "Standard" }[tone];
  return <Badge pair={tokens.semantic.priority[tone]} label={label} />;
}
