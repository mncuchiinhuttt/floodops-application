import { tokens } from "@floodops/design-tokens";
import type { StatusTone, ProvenanceTone, PriorityTone } from "@floodops/design-tokens";
import { Icon } from "@floodops/icons/web";
import type { IconName } from "@floodops/icons/web";

type BadgePair = { fg: string; bg: string; border: string; icon: string; pattern: string };
function Badge({ pair, label }: { pair: BadgePair; label: string }) {
  if (!label.trim()) throw new Error("Status badges require a visible label.");
  return <span className="fo-badge" data-pattern={pair.pattern}
    style={{ color: pair.fg, backgroundColor: pair.bg, borderColor: pair.border }}>
    <Icon name={pair.icon as IconName} size={16} decorative />{label}
  </span>;
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
