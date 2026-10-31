import type { ReactNode } from "react";
import { Award, Camera, ChartColumn, ClipboardCheck, ClipboardList, ImagePlus, ListChecks, Map, Settings, TriangleAlert, Truck } from "lucide-react";

/** Sidebar and tab-bar glyph per destination id (Lucide, one stroke weight). */
const icons: Record<string, typeof Map> = {
  driver: Truck, "driver-report": TriangleAlert, community: ClipboardList, "community-new": Camera, points: Award,
  "dispatch-report": ImagePlus, map: Map, plans: ListChecks, review: ClipboardCheck, results: ChartColumn,
};
export function shellIcon(id: string): ReactNode {
  const Glyph = icons[id] ?? Settings;
  return <Glyph aria-hidden="true" className="size-4 shrink-0 lg:size-4 max-lg:size-5" />;
}
