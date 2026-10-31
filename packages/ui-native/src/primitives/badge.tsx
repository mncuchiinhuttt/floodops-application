import { Text, View } from "react-native";
import { tokens } from "@floodops/design-tokens";
import type { StatusTone, ProvenanceTone, PriorityTone } from "@floodops/design-tokens";
import { Icon } from "@floodops/icons/native";
import type { IconName } from "@floodops/icons/native";
import { styles } from "./styles";

type Pair = { fg: string; bg: string; border: string; icon: string; pattern: string };
function Badge({ pair, label }: { pair: Pair; label: string }) {
  const borderStyle = pair.pattern === "dashed" ? "dashed" : pair.pattern === "dotted" ? "dotted" : "solid";
  return <View accessible accessibilityLabel={label} style={[styles.badge, {
    backgroundColor: pair.bg, borderColor: pair.border, borderStyle
  }]}><Icon name={pair.icon as IconName} size={16} color={pair.fg} decorative />
    <Text style={[styles.badgeText, { color: pair.fg }]}>{label}</Text>
  </View>;
}
export function StatusBadge({ tone, label }: { tone: StatusTone; label: string }) {
  return <Badge pair={tokens.semantic.status[tone]} label={label} />;
}
export function ProvenanceBadge({ tone }: { tone: ProvenanceTone }) {
  return <Badge pair={tokens.semantic.provenance[tone]} label={{ reference: "Reference data", replayed: "Replayed", simulated: "Simulated" }[tone]} />;
}
export function PriorityBadge({ tone }: { tone: PriorityTone }) {
  return <Badge pair={tokens.semantic.priority[tone]} label={{ critical: "Critical", food: "Food", standard: "Standard" }[tone]} />;
}
