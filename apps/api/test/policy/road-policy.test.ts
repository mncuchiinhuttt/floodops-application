import { expect, test } from "bun:test";
import type { SegmentKnowledge } from "@floodops/contracts";
import { checkEntry } from "@floodops/simulation";
import { evaluateRoadEntry, createPlanningPolicy } from "../../../../packages/domain/src/planning/index.ts";
import { approval, authority, makePlan, moto, car, runFixture, highOnly } from "../planning/planning-context.ts";
function context() {
  const run = runFixture(), plan = makePlan(), auth = authority(run, plan);
  const knowledge = structuredClone(run.knowledge.find(k => k.segment_id === "seg_edge17" && k.vehicle_type === "motorbike")!);
  return { run, plan, input: { driver: { driver_id: moto, vehicle_type: "motorbike" as const }, segmentId: knowledge.segment_id,
    atMinute: 2, knowledge, actionIds: [plan.actions[0]!.action_id], authority: auth } };
}
test("fresh known high evidence is ready without an approval", () => {
  const { input } = context(); expect(evaluateRoadEntry(input)).toMatchObject({ status: "ready", uncertain: false, rule_id: "POL-08" });
});
test.each(["authoritative_closed", "unresolved_conflict"] as const)("%s cannot be overridden by exact approval", state => {
  const { plan, input } = context(); input.knowledge.state = state; input.authority.approvals = [approval(plan)];
  expect(evaluateRoadEntry(input).status).toBe("blocked");
});
test("fresh effective impassable is hard blocked; expired impassable needs replan", () => {
  const { plan, input } = context(); input.knowledge.condition = "impassable"; input.authority.approvals = [approval(plan)];
  expect(evaluateRoadEntry(input).code).toBe("EFFECTIVE_IMPASSABLE");
  input.atMinute = input.knowledge.expires_sim_minute!; expect(evaluateRoadEntry(input).status).toBe("needs_replan");
});
test.each(["low", null] as const)("confidence %s needs exact human approval and remains uncertain", confidence => {
  const { plan, input } = context(); input.knowledge.confidence_band = confidence;
  expect(evaluateRoadEntry(input).status).toBe("pending_approval");
  input.authority.approvals = [approval(plan)];
  expect(evaluateRoadEntry(input)).toMatchObject({ status: "ready", uncertain: true, code: "SOFT_RISK_APPROVED" });
});
test("ordinary unknown may be explicitly approved; empty action binding cannot", () => {
  const { plan, input } = context(); input.knowledge.state = "ordinary_unknown"; input.knowledge.condition = "unknown";
  input.authority.approvals = [approval(plan)]; expect(evaluateRoadEntry(input).status).toBe("ready");
  input.actionIds = []; expect(evaluateRoadEntry(input).status).toBe("pending_approval");
});
test.each(["plan", "action", "revision"] as const)("wrong %s approval does not authorize risk", field => {
  const { plan, input } = context(), a = approval(plan); input.knowledge.confidence_band = "low";
  if (field === "plan") a.plan_id = "pln_other001"; if (field === "action") a.action_id = "act_other001";
  if (field === "revision") a.input_revision++;
  input.authority.approvals = [a]; expect(evaluateRoadEntry(input).status).toBe("pending_approval");
});
test("all affected actions need approval; explicit reject wins over approve", () => {
  const { plan, input } = context(); input.knowledge.confidence_band = "low"; input.actionIds.push("act_other001");
  input.authority.approvals = [approval(plan)]; expect(evaluateRoadEntry(input).status).toBe("pending_approval");
  input.authority.approvals = [approval(plan), approval(plan, "act_other001")]; expect(evaluateRoadEntry(input).status).toBe("ready");
  input.authority.approvals = [...input.authority.approvals, approval(plan, "act_other001", "reject")];
  expect(evaluateRoadEntry(input).code).toBe("ACTION_REJECTED");
});
test("evidence is stale at the exact expiry boundary, including with an approval", () => {
  const { plan, input } = context(); input.authority.approvals = [approval(plan)];
  input.atMinute = input.knowledge.expires_sim_minute! - 0.001; expect(evaluateRoadEntry(input).status).toBe("ready");
  input.atMinute += 0.001; expect(evaluateRoadEntry(input).code).toBe("EVIDENCE_EXPIRED");
  input.knowledge.expires_sim_minute = null; expect(evaluateRoadEntry(input).status).toBe("needs_replan");
});
test("epoch mismatch requires replan; missing/duplicate trusted epoch fails closed", () => {
  const { input } = context(); input.knowledge.knowledge_epoch++; expect(evaluateRoadEntry(input).code).toBe("STALE_EPOCH");
  input.authority.epochs = []; expect(evaluateRoadEntry(input).code).toBe("CONFIG_INCOMPLETE");
  const epoch = { segment_id: input.segmentId, vehicle_type: "motorbike" as const, knowledge_epoch: 1 };
  input.authority.epochs = [epoch, epoch]; expect(evaluateRoadEntry(input).status).toBe("blocked");
});
test("motorbike evidence does not authorize car; car's closure/impassable remains vehicle scoped", () => {
  const { input } = context();
  const carInput = { ...input, driver: { driver_id: car, vehicle_type: "car" as const } };
  expect(evaluateRoadEntry(carInput).status).toBe("pending_approval");
  input.knowledge.condition = "impassable"; expect(evaluateRoadEntry(carInput).status).toBe("pending_approval");
  expect(evaluateRoadEntry(input).status).toBe("blocked");
});
test.each([NaN, Infinity, -1])("invalid clock %s is blocked", atMinute => {
  expect(evaluateRoadEntry({ ...context().input, atMinute }).status).toBe("blocked");
});
test("simulator expiry normalization cannot revive a captured evidence approval", () => {
  const { run, plan, input } = context(); input.authority.approvals = [approval(plan)];
  const driver = run.branches.floodops!.operations.drivers[0]!;
  const policy = createPlanningPolicy(run, input.authority, { [moto]: input.actionIds }, highOnly);
  expect(checkEntry(run, "floodops", driver, input.segmentId, 21 * 60_000, policy)).toEqual({ allowed: false, reason: "EVIDENCE_EXPIRED" });
});
test("road inputs and caller-owned approval lists are never mutated", () => {
  const { input } = context(), before = JSON.stringify(input); evaluateRoadEntry(input); expect(JSON.stringify(input)).toBe(before);
});
test("no evidence is ordinary unknown rather than high-confidence geometry", () => {
  const input = { ...context().input, knowledge: null as SegmentKnowledge | null };
  expect(evaluateRoadEntry(input)).toMatchObject({ status: "pending_approval", uncertain: true });
});
