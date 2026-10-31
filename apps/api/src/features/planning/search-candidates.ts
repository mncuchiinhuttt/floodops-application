import type { ToolInput } from "@floodops/contracts";
import { canonicalJson } from "@floodops/simulation";
import type { SimulationRun } from "@floodops/simulation";
import type { CandidateSpec, SearchLimits } from "./deterministic-types";
type RouteInput = ToolInput<"compute_route">;
type Ref = RouteInput["stop_refs"][number];
const tiers = { critical: 0, food: 1, standard: 2 };
const cmp = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
/** Lazy finite enumeration. Fixed structural IDs, never minted job/action IDs, define ordering. */
export function* searchCandidates(run: SimulationRun, limits: SearchLimits, etas: Readonly<Record<string, number | null>> = {}): Generator<CandidateSpec> {
  const ops = run.branches.floodops!.operations;
  const drivers = [...ops.drivers].filter(d => d.position.kind === "node" && d.status !== "servicing"
    && d.ordered_stops.length <= limits.maxStops).sort((a, b) => cmp(a.driver_id, b.driver_id)).slice(0, limits.maxDrivers);
  const base = (driver: typeof drivers[number]): RouteInput => ({
    driver_id: driver.driver_id, origin_node_id: driver.position.node_id!,
    stop_refs: driver.ordered_stops.map(s => ({ order_id: s.order_id, kind: s.kind })), assignment_overrides: []
  });
  function* modes(routes: RouteInput[], assignment: CandidateSpec["assignment"]): Generator<CandidateSpec> {
    for (const allowPending of [false, true]) yield { routes, assignment, allowPending,
      key: canonicalJson({ routes, assignment, allowPending }) };
  }
  const active = drivers.filter(d => d.ordered_stops.length).map(base);
  if (active.length) yield* modes(active, null);
  for (const driver of drivers) if (driver.ordered_stops.length) yield* modes([base(driver)], null);
  const late = (o: typeof ops.orders[number]) => Math.max(0, (etas[o.order_id] ?? run.scenario.manifest.config.horizon_minute) - o.original_sla_minute);
  const orders = [...ops.orders].filter(o => o.lifecycle === "unpicked")
    .sort((a, b) => tiers[a.tier] - tiers[b.tier] || late(b) - late(a) || cmp(a.order_id, b.order_id))
    .slice(0, limits.maxOrders);
  // Breadth across order/driver pairs before a second insertion pattern prevents early pairs exhausting the budget.
  for (const variant of [0, 1, 2]) for (const order of orders) for (const driver of drivers) {
    if (driver.driver_id === order.driver_id) continue;
    const old = ops.drivers.find(d => d.driver_id === order.driver_id);
    if (old && (old.position.kind !== "node" || old.status === "servicing")) continue;
    const route = base(driver), refs = route.stop_refs.filter(r => r.order_id !== order.order_id);
    if (refs.length + 2 > limits.maxStops) continue;
    // Three bounded pickup-before-delivery patterns: append, prepend, or share existing pickup/delivery work.
    const pair: Ref[] = [{ order_id: order.order_id, kind: "pickup" }, { order_id: order.order_id, kind: "delivery" }];
    const variants = [ [pair[0]!, ...refs, pair[1]!], [...refs, ...pair], [...pair, ...refs] ];
    yield* modes([{ ...route, stop_refs: variants[variant]!,
      assignment_overrides: [{ order_id: order.order_id, driver_id: driver.driver_id, pickup_hub_id: null }] }],
    { order_id: order.order_id, driver_id: driver.driver_id });
  }
}
