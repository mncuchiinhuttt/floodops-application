import { useState } from "react";
import * as Primitive from "@radix-ui/react-tooltip";
import { Button } from "./button";
export function Tooltip({ label, description }: { label: string; description: string }) {
  const [open, setOpen] = useState(false);
  if (!label.trim() || !description.trim()) throw new Error("Help requires a label and description.");
  return <Primitive.Provider delayDuration={0}><Primitive.Root open={open} onOpenChange={setOpen}>
    <Primitive.Trigger asChild><Button variant="secondary" onClick={event => { event.preventDefault(); setOpen(true); }}>{label}</Button></Primitive.Trigger>
    <Primitive.Portal><Primitive.Content className="fo-tooltip" sideOffset={8}>
      {description}<Primitive.Arrow className="fo-tooltip-arrow" />
    </Primitive.Content></Primitive.Portal>
  </Primitive.Root></Primitive.Provider>;
}
