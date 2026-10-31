import type { ReactNode } from "react";
import * as Primitive from "@radix-ui/react-tabs";
export type TabItem = { value: string; label: string; content: ReactNode; disabled?: boolean };
export function Tabs({ label, items, value, onValueChange }: {
  label: string; items: readonly TabItem[]; value: string; onValueChange: (value: string) => void;
}) {
  if (!label.trim() || items.some(item => !item.label.trim())) throw new Error("Tabs require visible labels.");
  return <Primitive.Root value={value} onValueChange={onValueChange}>
    <Primitive.List className="fo-tabs-list" aria-label={label}>
      {items.map(item => <Primitive.Trigger className="fo-tab" key={item.value} value={item.value} disabled={item.disabled}>{item.label}</Primitive.Trigger>)}
    </Primitive.List>
    {items.map(item => <Primitive.Content className="fo-tab-panel" key={item.value} value={item.value}>{item.content}</Primitive.Content>)}
  </Primitive.Root>;
}
