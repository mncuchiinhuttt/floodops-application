import { expect, test } from "bun:test";
import { advanceRun, calculateObservedMetrics, compareObjectives, objectiveFromEtas, relativeReduction } from "@floodops/simulation";
import type { RunLog } from "@floodops/simulation";
import { fixture, highOnly, runFixture } from "../scenario/test-context.ts";

function event(kind: RunLog["kind"], orderId: string | null, atMinute: number, extra: Partial<RunLog> = {}): RunLog {
  return { sequence: 1, atMinute, branch: "floodops", kind, driverId: null, orderId, segmentId: null,
    reason: null, attemptId: null, scope: null, afterIncident: true, category: null, ...extra };
}
test("observed H metrics use distinct actual completions rather than projected ETAs", () => {
  const base = fixture().initial.orders[0]!;
  const orders = [
    { ...base, order_id: "ord_example1", tier: "critical" as const, original_sla_minute: 10, eta_minute: 0 },
    { ...base, order_id: "ord_example2", tier: "critical" as const, original_sla_minute: 20, eta_minute: null },
    { ...base, order_id: "ord_example3", tier: "food" as const, original_sla_minute: 15 },
    { ...base, order_id: "ord_example4", tier: "standard" as const, original_sla_minute: 25, eta_minute: null },
    { ...base, order_id: "ord_example5", tier: "standard" as const, original_sla_minute: 20 }
  ];
  const log = [event("delivery", "ord_example1", 12), event("delivery", "ord_example3", 15), event("delivery", "ord_example5", 19),
    event("delivery", "ord_example2", 35), event("blocked", null, 5, { attemptId: "road1", scope: "movement", category: "road" }),
    event("blocked", null, 5, { attemptId: "road1", scope: "movement", category: "road" }),
    event("blocked", null, 6, { attemptId: "hub1", scope: "movement", category: "feasibility" }),
    event("reassigned", "ord_example1", 5), event("reassigned", "ord_example1", 6), event("eta_preview", "ord_example1", 7), event("eta_preview", "ord_example1", 8)];
  const metrics = calculateObservedMetrics(orders, log, 30);
  expect(metrics).toMatchObject({ critical_late: 2, total_late: 3, total_delay_minutes: 17, unfinished_count: 2,
    unreachable_count: 2, blocked_route_attempts: 1, blocked_movement_attempts: 1, orders_reassigned: 1, updated_eta_previews: 1, executed_violations: 0 });
  expect(() => calculateObservedMetrics(orders, [...log, event("delivery", "ord_example1", 13)], 30)).toThrow("Duplicate");
  expect(relativeReduction(0, 0)).toBeNull(); expect(relativeReduction(4, 6)).toBe(-0.5);
});

test("projected delay is capped at H but lateness uses known completion, with lexicographic critical precedence", () => {
  const order = { ...fixture().initial.orders[0]!, original_sla_minute: 10 };
  const known = objectiveFromEtas([order], { [order.order_id]: 35 }, 30);
  expect(known).toMatchObject({ critical_unreachable: 0, critical_late: 1, critical_delay_minute: 20 });
  const unknown = objectiveFromEtas([order], { [order.order_id]: null }, 30);
  expect(unknown).toMatchObject({ critical_unreachable: 1, critical_late: 1, critical_delay_minute: 20 });
  expect(compareObjectives(unknown, { ...known, total_late: 1000 })).toBe(1);
});

test("functional runner produces computed raw branch metrics at one common H", () => {
  const run = advanceRun(runFixture(), 20, highOnly).run;
  const baseline = calculateObservedMetrics(run.branches.static!.operations.orders, run.log.filter(e => e.branch === "static"), 20);
  const floodops = calculateObservedMetrics(run.branches.floodops!.operations.orders, run.log.filter(e => e.branch === "floodops"), 20);
  expect(floodops).toEqual(baseline); expect(baseline).toMatchObject({ critical_late: 1, total_late: 2, total_delay_minutes: 21, unfinished_count: 2, executed_violations: 0 });
  expect(run.log.filter(e => e.branch === "static" && e.kind === "delivery").map(e => e.orderId)).toEqual(["ord_order2"]);
});
