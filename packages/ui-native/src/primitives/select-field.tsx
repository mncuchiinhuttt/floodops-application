import type { ComponentRef } from "react";
import { useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { tokens as t } from "@floodops/design-tokens";
import { Button } from "./button";
import { Sheet } from "./dialog";
import { styles } from "./styles";
export type SelectOption = { value: string; label: string; disabledReason?: string };
export type SelectFieldProps = {
  label: string; value: string; options: readonly SelectOption[]; onValueChange: (value: string) => void;
  hint?: string; error?: string; required?: boolean; disabledReason?: string;
};
export function SelectField({ label, value, options, onValueChange, hint, error, required, disabledReason }: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<ComponentRef<typeof View>>(null);
  if (!label.trim() || options.some(option => !option.label.trim())) throw new Error("Select fields and options require visible labels.");
  const selected = options.find(option => option.value === value)?.label ?? "Choose an option";
  const name = `${label}${required ? " (required)" : ""}`;
  const state = disabledReason ? { disabled: true as const, disabledReason } : { disabled: false as const };
  return <View style={styles.group}><Text style={styles.label}>{name}</Text>
    {hint && <Text style={styles.hint}>{hint}</Text>}
    <Button ref={trigger} {...state} variant="secondary" label={`${name}: ${selected}`} onPress={() => setOpen(true)}
      accessibilityHint={[hint, error && `Error: ${error}`].filter(Boolean).join(". ") || undefined} />
    {error && <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text>}
    <Sheet open={open} title={name} returnFocusRef={trigger} onClose={() => setOpen(false)}><View>
      {options.map(option => <Choice key={option.value} option={option} selected={option.value === value}
        onSelect={() => { onValueChange(option.value); setOpen(false); }} />)}
    </View></Sheet>
  </View>;
}

function Choice({ option, selected, onSelect }: { option: SelectOption; selected: boolean; onSelect: () => void }) {
  const [focused, setFocused] = useState(false);
  return <View style={styles.group}><Pressable accessibilityRole="radio" accessibilityLabel={option.label}
    accessibilityState={{ checked: selected, disabled: Boolean(option.disabledReason) }} disabled={Boolean(option.disabledReason)}
    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onPress={onSelect}
    style={[styles.button, selected ? styles.primary : styles.secondary, option.disabledReason && styles.disabled, focused && styles.focus]}>
    <Text style={[styles.buttonText, { color: option.disabledReason ? t.semantic.text.disabled : selected ? t.semantic.text.inverse : t.semantic.action.secondary.fg }]}>{option.label}</Text>
  </Pressable>{option.disabledReason && <Text style={styles.hint}>{option.disabledReason}</Text>}</View>;
}
