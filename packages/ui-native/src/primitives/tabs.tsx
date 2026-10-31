import { useState } from "react";
import type { ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { tokens as t } from "@floodops/design-tokens";
import { styles } from "./styles";
export type TabItem = { value: string; label: string; content: ReactNode; disabled?: boolean };
export function Tabs({ label, items, value, onValueChange }: {
  label: string; items: readonly TabItem[]; value: string; onValueChange: (value: string) => void;
}) {
  if (!label.trim() || items.some(item => !item.label.trim())) throw new Error("Tabs require visible labels.");
  const current = items.find(item => item.value === value);
  return <View style={styles.group}>
    <ScrollView horizontal accessibilityLabel={label} contentContainerStyle={{ gap: t.space[2] }}>
      {items.map(item => <Tab key={item.value} item={item} selected={item.value === value} onSelect={() => onValueChange(item.value)} />)}
    </ScrollView>
    {current && <View accessibilityLabel={current.label}>{current.content}</View>}
  </View>;
}

function Tab({ item, selected, onSelect }: { item: TabItem; selected: boolean; onSelect: () => void }) {
  const [focused, setFocused] = useState(false);
  return <Pressable accessibilityRole="tab" accessibilityLabel={item.label}
    accessibilityState={{ selected, disabled: item.disabled }} disabled={item.disabled}
    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onPress={onSelect}
    style={[styles.button, selected ? styles.primary : styles.secondary, item.disabled && styles.disabled, focused && styles.focus]}>
    <Text style={[styles.buttonText, { color: item.disabled ? t.semantic.text.disabled : selected ? t.semantic.text.inverse : t.semantic.action.secondary.fg }]}>{item.label}</Text>
  </Pressable>;
}
