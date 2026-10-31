import type { ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { tokens } from "@floodops/design-tokens";
import { Alert, Button, Skeleton } from "@floodops/ui-native";
import type { Permission, Role } from "@floodops/contracts";
import type { QueryState } from "./query-state";
import { accessReason, sameSession, type MobileContext } from "./session-context";
export const screenStyles = StyleSheet.create({
  page: { padding: 20, gap: 16, backgroundColor: tokens.semantic.surface.canvas },
  group: { gap: 12 }, title: { fontSize: 26, fontWeight: "700", color: tokens.semantic.text.primary },
  text: { fontSize: 16, color: tokens.semantic.text.primary },
});
export function ScreenFrame({ title, context, children }: { title: string; context: MobileContext; children: ReactNode }) {
  return <ScrollView contentContainerStyle={screenStyles.page} keyboardShouldPersistTaps="handled">
    <Text accessibilityRole="header" style={screenStyles.title}>{title}</Text>
    <Text style={screenStyles.text}>Simulation · Calibration {context.session.calibration_status}</Text>
    <Text>Simulation time {context.session.sim_minute} min · Revision {context.session.revision}</Text>
    {(!context.online || context.freshness === "stale") && <Alert title="Stale/offline">Cached reads may be outdated. Refresh before sending commands.</Alert>}
    {children}
  </ScrollView>;
}
export function CommandButton({ label, reason, onPress, pending = false }: {
  label: string; reason: string | null; onPress: () => void; pending?: boolean;
}) {
  return <Button label={label} pending={pending} onPress={onPress}
    {...(reason ? { disabled: true, disabledReason: reason } : { disabled: false })} />;
}
export function DataScreen<T>({ title, context, permission, roles, query, children }: {
  title: string; context: MobileContext; permission: Permission; roles?: readonly Role[];
  query: QueryState<T>; children: (data: T) => ReactNode;
}) {
  const reason = accessReason(context, permission, roles);
  const cached = query.status !== "ready" || query.revision < context.session.revision || query.event_sequence < context.session.event_sequence;
  const wrongSession = !sameSession(context.session, query);
  return <ScreenFrame title={title} context={context}>
    {reason || wrongSession || query.status === "relink" ? <Alert title="Rejoin required">{reason ?? "This view belongs to an old session. Rejoin explicitly."}</Alert>
      : <View style={screenStyles.group}>
        {query.status === "loading" && <Skeleton label="Loading current server view" />}
        {cached && query.data !== null && <Text>Stale/cached · Revision {query.revision} · Refresh before relying on this view</Text>}
        {query.status === "error" && <Alert title="View unavailable">{query.message ?? "Refresh to try this read again."}</Alert>}
        {query.data !== null && children(query.data)}
        {query.data === null && query.status !== "loading" && <Text>No server data available.</Text>}
      </View>}
  </ScreenFrame>;
}
