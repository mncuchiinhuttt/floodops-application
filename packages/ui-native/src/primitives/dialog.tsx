import { useEffect, useRef } from "react";
import type { ComponentRef, ReactNode, RefObject } from "react";
import { AccessibilityInfo, findNodeHandle, Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import { tokens as t } from "@floodops/design-tokens";
import { Button } from "./button";
export type DialogProps = {
  open: boolean; title: string; description?: string; children: ReactNode; onClose: () => void;
  returnFocusRef?: RefObject<ComponentRef<typeof View> | null>;
};
function focus(target: ComponentRef<typeof Text> | ComponentRef<typeof View> | null) {
  const handle = target ? findNodeHandle(target) : null;
  if (typeof handle === "number") AccessibilityInfo.setAccessibilityFocus(handle);
}
export function Dialog({ open, title, description, children, onClose, returnFocusRef, sheet = false }: DialogProps & { sheet?: boolean }) {
  const heading = useRef<ComponentRef<typeof Text>>(null);
  const previous = useRef(open);
  useEffect(() => {
    if (previous.current && !open) focus(returnFocusRef?.current ?? null);
    previous.current = open;
  }, [open, returnFocusRef]);
  if (!title.trim()) throw new Error("Dialogs require a visible title.");
  return <Modal visible={open} transparent animationType="none" onRequestClose={onClose} onShow={() => focus(heading.current)}>
    <View style={[styles.overlay, sheet && styles.sheetOverlay]}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none"><View style={styles.scrim} /></View>
      <View style={[styles.panel, sheet && styles.sheet]} accessibilityViewIsModal>
        <Text ref={heading} accessibilityRole="header" style={styles.title}>{title}</Text>
        {description && <Text style={styles.text}>{description}</Text>}
        <ScrollView keyboardShouldPersistTaps="handled" style={{ flexShrink: 1 }}>{children}</ScrollView><Button label="Close" variant="secondary" onPress={onClose} />
      </View>
    </View>
  </Modal>;
}
export function Sheet(props: DialogProps) { return <Dialog {...props} sheet />; }
const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "center", padding: t.space[4] },
  sheetOverlay: { justifyContent: "flex-end" },
  scrim: { flex: 1, backgroundColor: t.semantic.surface.inverse, opacity: 0.5 },
  panel: { backgroundColor: t.semantic.surface.raised, padding: t.space[4], gap: t.space[3], borderRadius: t.radius.lg, maxHeight: "90%" },
  sheet: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  title: { color: t.semantic.text.primary, fontSize: t.type.size.title, fontWeight: "700" },
  text: { color: t.semantic.text.secondary, fontSize: t.type.size.body }
});
