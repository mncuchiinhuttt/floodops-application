import { createGraph, findRoute } from "../../src/graph/index.ts";
import { advanceEventClock, createEventClock } from "../../src/clock/index.ts";
import { graphFixture } from "./graph-builder.ts";

const graph = createGraph(graphFixture());
const query = { from: "A", to: "D", vehicle: "car", departureMs: 0 } as const;
const car = findRoute(graph, query);
const motorbike = findRoute(graph, { ...query, vehicle: "motorbike" });
const clock = createEventClock(0, 20, [
  { id: "entry", atMs: 10, phase: "entry", sequence: 0 },
  { id: "closure", atMs: 10, phase: "input", sequence: 1 },
  { id: "expiry", atMs: 10, phase: "expiry", sequence: 2 }
]);
const result = advanceEventClock(clock, 20);
if (car?.edgeIds.join(",") !== "AC,CB,BD" || motorbike?.edgeIds.join(",") !== "AD-bike"
  || result.emitted.map(item => item.event.id).join(",") !== "closure,expiry,entry"
  || clock.nowMs !== 0) throw new Error("Foundation smoke failed.");
console.log(JSON.stringify({ label: "synthetic-foundation-smoke", calibrationStatus: "incomplete",
  car, motorbike, noReverseRoute: findRoute(graph, { ...query, from: "D", to: "A" }),
  eventOrder: result.emitted.map(item => item.event.id), finalTimeMs: result.clock.nowMs,
  originalTimeMs: clock.nowMs }, null, 2));
