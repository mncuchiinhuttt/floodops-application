import type { ComponentRef, Ref } from "react";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { PressableProps } from "react-native";
import { tokens } from "@floodops/design-tokens";
import { Icon } from "@floodops/icons/native";
import type { IconName } from "@floodops/icons/native";
import { styles } from "./styles";

type Disabled = { disabled?: false; disabledReason?: never } | { disabled: true; disabledReason: string };
export type ButtonProps = Omit<PressableProps, "children" | "disabled" | "style" | "accessibilityRole"> & Disabled & {
  ref?: Ref<ComponentRef<typeof View>>; label: string; variant?: "primary" | "secondary" | "danger"; pending?: boolean; pendingLabel?: string; icon?: IconName;
};
export function Button({ label, variant = "primary", pending = false, pendingLabel = "Working…", disabled,
  disabledReason, icon, onFocus, onBlur, accessibilityState, accessibilityHint, ...props }: ButtonProps) {
  const [focused, setFocused] = useState(false);
  const inactive = disabled || pending;
  const color = inactive ? tokens.semantic.action.disabled.fg : variant === "secondary"
    ? tokens.semantic.action.secondary.fg : tokens.semantic.action.primary.fg;
  if (!label.trim()) throw new Error("Button requires a text label.");
  if (disabled && !disabledReason?.trim()) throw new Error("Disabled controls require a visible disabled reason.");
  if (pending && !pendingLabel.trim()) throw new Error("Pending buttons require a visible status label.");
  return <View style={styles.group}>
    <Pressable {...props} disabled={inactive} accessibilityRole="button" accessibilityLabel={pending ? pendingLabel : label}
      accessibilityHint={[accessibilityHint, disabledReason].filter(Boolean).join(". ") || undefined}
      accessibilityState={{ ...accessibilityState, disabled: Boolean(inactive), busy: pending }}
      onFocus={event => { setFocused(true); onFocus?.(event); }} onBlur={event => { setFocused(false); onBlur?.(event); }}
      style={[styles.button, styles[variant], inactive && styles.disabled, focused && styles.focus]}>
      {icon && <Icon name={icon} decorative color={color} />}
      <Text style={[styles.buttonText, { color }]}>{pending ? pendingLabel : label}</Text>
    </Pressable>
    {disabledReason && <Text style={styles.hint}>{disabledReason}</Text>}
  </View>;
}
export function IconButton(props: ButtonProps & { icon: IconName }) {
  return <Button {...props} />;
}
export function LinkButton({ label, onPress, hint }: { label: string; onPress: NonNullable<PressableProps["onPress"]>; hint?: string }) {
  const [focused, setFocused] = useState(false);
  if (!label.trim()) throw new Error("LinkButton requires a text label.");
  return <Pressable onPress={onPress} accessibilityRole="link" accessibilityLabel={label} accessibilityHint={hint}
    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
    style={[styles.button, styles.secondary, focused && styles.focus]}>
    <Text style={[styles.buttonText, { color: tokens.semantic.action.secondary.fg }]}>{label}</Text>
  </Pressable>;
}
