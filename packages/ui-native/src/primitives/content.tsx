import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { tokens } from "@floodops/design-tokens";
import { styles } from "./styles";
export function Card({ title, children, description }: { title: string; description?: string; children: ReactNode }) {
  return <View style={styles.card}><Text accessibilityRole="header" style={styles.heading}>{title}</Text>
    {description && <Text style={styles.hint}>{description}</Text>}{children}</View>;
}
export function Alert({ title, children, urgent = false }: { title: string; children: string; urgent?: boolean }) {
  const pair = urgent ? tokens.semantic.status.blocked : tokens.semantic.status.replan;
  return <View accessible accessibilityRole={urgent ? "alert" : "text"} accessibilityLabel={`${title}. ${children}`}
    accessibilityLiveRegion={urgent ? "assertive" : "polite"}
    style={[styles.alert, { backgroundColor: pair.bg, borderColor: pair.border }]}>
    <Text style={[styles.label, { color: pair.fg }]}>{title}</Text><Text style={{ color: pair.fg }}>{children}</Text>
  </View>;
}
export function Skeleton({ label }: { label: string }) {
  return <View accessible accessibilityLabel={label} accessibilityState={{ busy: true }} style={styles.skeleton} />;
}
