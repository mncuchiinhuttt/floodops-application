import type { ReactNode } from "react";
import { Tabs as TabsRoot, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

export type TabItem = { value: string; label: string; content: ReactNode; disabled?: boolean };
export function Tabs({ label, items, value, onValueChange }: {
  label: string; items: readonly TabItem[]; value: string; onValueChange: (value: string) => void;
}) {
  if (!label.trim() || items.some(item => !item.label.trim())) throw new Error("Tabs require visible labels.");
  return <TabsRoot value={value} onValueChange={onValueChange}>
    <TabsList variant="line" aria-label={label} className="h-auto min-h-11 w-full justify-start overflow-x-auto border-b p-0 md:min-h-10">
      {items.map(item => <TabsTrigger key={item.value} value={item.value} disabled={item.disabled}
        className="min-h-11 flex-none px-3 md:min-h-10">{item.label}</TabsTrigger>)}
    </TabsList>
    {items.map(item => <TabsContent key={item.value} value={item.value} className="py-4">{item.content}</TabsContent>)}
  </TabsRoot>;
}
