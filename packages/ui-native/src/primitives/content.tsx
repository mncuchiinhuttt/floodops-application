import type { ReactNode } from "react";
import { Text, View } from "react-native";
import type { StatusTone } from "@floodops/design-tokens";
import { tokens } from "@floodops/design-tokens";
import { styles } from "./styles";
export function Card({ title, children, description }: { title: string; description?: string; children: ReactNode }) {
  if (!title.trim()) throw new Error("Cards require a visible title.");
  return <View style={styles.card}><Text accessibilityRole="header" style={styles.heading}>{title}</Text>
    {description && <Text style={styles.hint}>{description}</Text>}{children}</View>;
}
export function Alert({ title, children, urgent = false, tone }: { title: string; children: string; urgent?: boolean; tone?: StatusTone }) {
  if (!title.trim()) throw new Error("Alerts require a visible title.");
  const pair = tokens.semantic.status[tone ?? (urgent ? "blocked" : "replan")];
  return <View accessible accessibilityRole={urgent ? "alert" : "text"} accessibilityLabel={`${title}. ${children}`}
    accessibilityLiveRegion={urgent ? "assertive" : "polite"}
    style={[styles.alert, { backgroundColor: pair.bg, borderColor: pair.border }]}>
    <Text style={[styles.label, { color: pair.fg }]}>{title}</Text><Text style={{ color: pair.fg }}>{children}</Text>
  </View>;
}
export function Skeleton({ label }: { label: string }) {
  if (!label.trim()) throw new Error("Loading states require a label.");
  return <View accessible accessibilityLabel={label} accessibilityState={{ busy: true }} style={styles.skeleton} />;
}
