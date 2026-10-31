import { useState } from "react";
import { Tooltip as TooltipRoot, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip";
import { Button } from "./button";

export function Tooltip({ label, description }: { label: string; description: string }) {
  const [open, setOpen] = useState(false);
  if (!label.trim() || !description.trim()) throw new Error("Help requires a label and description.");
  return <TooltipProvider delayDuration={0}><TooltipRoot open={open} onOpenChange={setOpen}>
    <TooltipTrigger asChild><Button variant="secondary" onClick={event => { event.preventDefault(); setOpen(true); }}>{label}</Button></TooltipTrigger>
    <TooltipContent sideOffset={8} className="max-w-[min(24rem,calc(100vw-2rem))] p-3">{description}</TooltipContent>
  </TooltipRoot></TooltipProvider>;
}
