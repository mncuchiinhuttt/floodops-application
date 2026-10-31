import { StyleSheet } from "react-native";
import { tokens as t } from "@floodops/design-tokens";
export const styles = StyleSheet.create({
  group: { gap: t.space[2], flexShrink: 1 },
  button: { minWidth: t.target.native, minHeight: t.target.native, paddingHorizontal: t.space[4], paddingVertical: t.space[3],
    alignItems: "center", justifyContent: "center", flexDirection: "row", gap: t.space[2], borderWidth: t.stroke.default, borderRadius: t.radius.sm },
  buttonText: { fontSize: t.type.size.body, fontWeight: "500", textAlign: "center", flexShrink: 1 },
  primary: { backgroundColor: t.semantic.action.primary.bg, borderColor: t.semantic.action.primary.bg },
  secondary: { backgroundColor: t.semantic.action.secondary.bg, borderColor: t.semantic.action.secondary.border },
  danger: { backgroundColor: t.semantic.action.danger.bg, borderColor: t.semantic.action.danger.bg },
  disabled: { backgroundColor: t.semantic.action.disabled.bg, borderColor: t.semantic.action.disabled.border },
  focus: { borderColor: t.semantic.focus.ring, borderWidth: t.stroke.focus },
  label: { color: t.semantic.text.primary, fontSize: t.type.size.body, fontWeight: "500" },
  hint: { color: t.semantic.text.secondary, fontSize: t.type.size.sm, lineHeight: t.type.size.sm * t.type["line-height"].body },
  error: { color: t.semantic.status.blocked.fg, fontSize: t.type.size.sm },
  input: { minHeight: t.target.native, borderWidth: t.stroke.default, borderColor: t.semantic.border.default, borderRadius: t.radius.sm,
    padding: t.space[3], fontSize: t.type.size.body, color: t.semantic.text.primary, backgroundColor: t.semantic.surface.panel },
  invalid: { borderColor: t.semantic.status.blocked.border },
  textArea: { minHeight: t.target.native * 2, textAlignVertical: "top" },
  badge: { flexDirection: "row", gap: t.space[1], alignItems: "center", alignSelf: "flex-start", flexShrink: 1,
    paddingVertical: t.space[1], paddingHorizontal: t.space[2], borderWidth: t.stroke.default, borderRadius: t.radius.sm },
  badgeText: { fontSize: t.type.size.sm, flexShrink: 1 },
  card: { padding: t.space[4], gap: t.space[3], backgroundColor: t.semantic.surface.panel,
    borderWidth: t.stroke.default, borderColor: t.semantic.border.default, borderRadius: t.radius.md },
  heading: { fontSize: t.type.size.title, fontWeight: "700", color: t.semantic.text.primary },
  alert: { padding: t.space[4], gap: t.space[2], borderWidth: t.stroke.default, borderRadius: t.radius.sm },
  skeleton: { minHeight: t.target.native, backgroundColor: t.semantic.surface.canvas, borderWidth: t.stroke.default,
    borderColor: t.semantic.border.default, borderRadius: t.radius.sm }
});
