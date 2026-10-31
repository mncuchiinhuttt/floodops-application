import { Camera, ClipboardCheck, Gauge, Map, Route, Truck, Users, type LucideIcon } from "lucide-react";
import dispatcherMap from "./assets/app-dispatcher-map.webp";
import locationPicker from "./assets/app-location-picker.webp";
import planProjected from "./assets/app-plan-projected.webp";
import results from "./assets/app-results.webp";

export interface Shot { src: string; alt: string; width: number; height: number }
const shot = (src: string, alt: string): Shot => ({ src, alt, width: 1800, height: 1125 });
export const SHOTS = {
  map: shot(dispatcherMap, "FloodOps dispatch screen: an OpenStreetMap map with simulated road segments coloured by status."),
  picker: shot(locationPicker, "FloodOps report form: pick a road on the map, with the street name Hàm Nghi and simulated segment seg_edge33 filled in."),
  plan: shot(planProjected, "FloodOps plan screen: projected actions from the deterministic planner, with separate Approve and Reject buttons."),
  results: shot(results, "FloodOps results screen: metrics compared between the static route and FloodOps, labelled Simulation result."),
};
export const PHONE_SHOT = { width: 474, height: 1024 };

export interface FlowStep { id: string; icon: LucideIcon; title: string; body: string; shot: Shot }
export const FLOW_STEPS: readonly FlowStep[] = [
  { id: "report", icon: Camera, title: "Receive field reports", shot: SHOTS.picker,
    body: "Drivers and residents send a photo with a location. Tap a road on the map or use your device location." },
  { id: "impact", icon: Map, title: "See the impact on roads", shot: SHOTS.map,
    body: "Reviewed reports change each road segment's status per vehicle type. Expired evidence is no longer used." },
  { id: "plan", icon: Route, title: "Build a deterministic plan", shot: SHOTS.plan,
    body: "A bounded planner searches for reassignment options. The result is a projected plan that changes nothing yet." },
  { id: "result", icon: Gauge, title: "Approve, execute, measure", shot: SHOTS.results,
    body: "Approve and execute are separate actions. Results compare a static route with FloodOps on the same data." },
];

export interface Role { id: string; icon: LucideIcon; name: string; summary: string; abilities: readonly string[] }
export const ROLES: readonly Role[] = [
  { id: "dispatcher", icon: ClipboardCheck, name: "Dispatcher", summary: "Holds the decision. Every operational change goes through the dispatcher.",
    abilities: ["View the map per vehicle type", "Review reports and resolve source conflicts", "Plan, approve, then execute"] },
  { id: "driver", icon: Truck, name: "Driver", summary: "Sees their own work and reports road conditions while on the move.",
    abilities: ["See assigned orders", "Quickly report a flooded segment", "Access only their own data"] },
  { id: "contributor", icon: Users, name: "Resident", summary: "Sends photos and locations to add evidence where there is no data yet.",
    abilities: ["Send a photo with a map location", "Track the status of their reports", "Earn simulated points with no cash value"] },
];
