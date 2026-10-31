import { expect, it } from "vitest";
import { parseSchema, type Results } from "@floodops/contracts";
import {
  advanceTo, approvePending, create, createPlan, mutate, read, readyGroups, resetOwner, submitAndAccept, type Owner
} from "./acceptance-http-fixtures";
const COMBINED_INCIDENT_MINUTE = 2.75;


async function incidentRun(owner: Owner, recordKpis = false): Promise<Results> {
  await advanceTo(owner, COMBINED_INCIDENT_MINUTE);
  const seedResponse = await read(owner, "/configuration"); expect(seedResponse.status).toBe(200);
  const seed = parseSchema("ScenarioConfigResponse", await seedResponse.json()).data!;
  const originalOps = parseSchema("OperationsResponse", await (await read(owner, "/operations")).json()).data!;
  const criticalSeed = originalOps.branches.find(branch => branch.branch_id === "floodops")!.orders.find(order => order.order_id === "ord_order1")!;
  expect(criticalSeed.tier).toBe("critical");

  const incidentResponse = await mutate(owner, "/incidents", { cause: "combined", fixture_incident_id: "inc_combined1" }, 201);
  const incident = parseSchema("IncidentResponse", await incidentResponse.json()).data!;
  const impact = parseSchema("ImpactResponse", await (await read(owner, "/impact")).json()).data!;
  expect(impact.incident_ids).toContain(incident.incident_id);
  expect(impact.affected_orders.length).toBeGreaterThan(0);

  const incidentMeta = parseSchema("SessionMetaResponse", await (await read(owner, "")).json()).data!;
  const planning = await createPlan(owner, "manual");
  expect(planning.job.input_revision).toBe(incidentMeta.revision);
  expect(planning.plan.actions.length).toBeGreaterThan(0);
  expect(planning.plan.actions.some(action => action.kind === "defer" && action.targets.order_id === "ord_order1")).toBe(false);
  expect(parseSchema("OperationsResponse", await (await read(owner, "/operations")).json()).data!.branches).toEqual(originalOps.branches);

  const pending = planning.plan.actions.filter(action => action.status === "pending_approval");
  if (pending.length) {
    const pendingIds = pending.map(action => action.action_id);
    const pendingGroups = planning.plan.groups.filter(group => group.action_ids.some(id => pendingIds.includes(id)))
      .map(group => group.group_id);
    expect(pendingGroups.length).toBeGreaterThan(0);
    const denied = await mutate(owner, `/plans/${planning.plan.plan_id}/executions`, { group_ids: pendingGroups });
    expect(denied.status).not.toBe(201);
    expect(parseSchema("OperationsResponse", await (await read(owner, "/operations")).json()).data!.branches).toEqual(originalOps.branches);
  }
  const approved = await approvePending(owner, planning.plan);
  expect(parseSchema("OperationsResponse", await (await read(owner, "/operations")).json()).data!.branches).toEqual(originalOps.branches);
  const groups = readyGroups(approved); expect(groups.length).toBeGreaterThan(0);
  const dryRun = parseSchema("DryRunResultResponse", await (await mutate(owner, `/plans/${approved.plan_id}/dry-runs`, { group_ids: groups }, 200)).json()).data!;
  expect(dryRun.feasible).toBe(true);
  const executionResponse = await mutate(owner, `/plans/${approved.plan_id}/executions`, { group_ids: groups }, 201);
  const execution = parseSchema("ExecutionResponse", await executionResponse.json()).data!;
  expect(execution.plan_id).toBe(approved.plan_id);
  const afterExecute = parseSchema("OperationsResponse", await (await read(owner, "/operations")).json()).data!;
  const criticalAfter = afterExecute.branches.find(branch => branch.branch_id === "floodops")!.orders.find(order => order.order_id === "ord_order1")!;
  expect(criticalAfter.tier).toBe(criticalSeed.tier);
  expect(criticalAfter.original_sla_minute).toBe(criticalSeed.original_sla_minute);

  const clock = await advanceTo(owner, seed.horizon_minute);
  expect(clock.now_minute).toBe(seed.horizon_minute);
  const results = parseSchema("ResultsResponse", await (await read(owner, "/results")).json()).data!;
  expect(results).toMatchObject({ scenario_id: seed.scenario.scenario_id, scenario_version: seed.scenario.version,
    config_hash: seed.config_hash, horizon_minute: seed.horizon_minute, observed_until_minute: seed.horizon_minute,
    calibration_status: "incomplete" });
  const baseline = results.branches.find(branch => branch.branch_id === "static")!;
  const floodops = results.branches.find(branch => branch.branch_id === "floodops")!;
  expect(baseline.metrics.executed_violations).toBe(0);
  expect(floodops.metrics.executed_violations).toBe(0);
  if (recordKpis) console.info("K1_K2_FUNCTIONAL_V2_API_RESULTS", JSON.stringify({ scenario_id: results.scenario_id,
    scenario_version: results.scenario_version, seed_hash: seed.seed_hash, config_hash: results.config_hash,
    incident_minute: COMBINED_INCIDENT_MINUTE, horizon_minute: results.horizon_minute,
    baseline: { critical_late: baseline.metrics.critical_late, total_late: baseline.metrics.total_late },
    floodops: { critical_late: floodops.metrics.critical_late, total_late: floodops.metrics.total_late },
    late_reduction_ratio: results.late_reduction_ratio }));
  return results;
}

it("T01 composes combined incident, impact, approved Execute, horizon advance and comparable API results", async () => {
  const owner = await create();
  const results = await incidentRun(owner, true);
  expect(results.branches.map(branch => branch.branch_id)).toContain("static");
  expect(results.branches.map(branch => branch.branch_id)).toContain("floodops");
});

it("T04 rejects the approved proposal after its accepted evidence expires, without partial execution", async () => {
  const owner = await create();
  const accepted = await submitAndAccept(owner);
  const initialPlan = await createPlan(owner, "accepted_report", [accepted.report.report_id]);
  const beforeApproval = parseSchema("OperationsResponse", await (await read(owner, "/operations")).json()).data!;
  const approved = await approvePending(owner, initialPlan.plan);
  expect(parseSchema("OperationsResponse", await (await read(owner, "/operations")).json()).data).toEqual(beforeApproval);
  const groups = approved.groups.map(group => group.group_id); expect(groups.length).toBeGreaterThan(0);
  await advanceTo(owner, 4);
  const knowledge = parseSchema("KnowledgeResponse", await (await read(owner, "/knowledge")).json()).data!;
  const acceptedIds = accepted.report.observation_ids;
  expect(acceptedIds.length).toBeGreaterThan(0);
  expect(accepted.observations.every(observation => acceptedIds.includes(observation.observation_id)
    && observation.expires_sim_minute === 3)).toBe(true);
  expect(knowledge.observations.some(observation => acceptedIds.includes(observation.observation_id))).toBe(false);
  const bike = knowledge.segments.find(item => item.segment_id === "seg_edge27" && item.vehicle_type === "motorbike")!;
  expect(bike.observation_ids.some(id => acceptedIds.includes(id))).toBe(false);
  const stale = parseSchema("PlanResponse", await (await read(owner, `/plans/${approved.plan_id}`)).json()).data!;
  expect(stale.status).toBe("needs_replan");
  const revision = parseSchema("SessionMetaResponse", await (await read(owner, "")).json()).data!.revision;
  const beforeExecute = parseSchema("OperationsResponse", await (await read(owner, "/operations")).json()).data!;
  const rejected = await mutate(owner, `/plans/${approved.plan_id}/executions`, { group_ids: groups });
  expect(rejected.status).not.toBe(201);
  const current = parseSchema("SessionMetaResponse", await (await read(owner, "")).json()).data!;
  expect(current.revision).toBe(revision);
  expect(parseSchema("OperationsResponse", await (await read(owner, "/operations")).json()).data).toEqual(beforeExecute);
});

it("T10 resets two frozen functional-v2 sessions and repeats identical incident, plan and horizon results", async () => {
  const firstOriginal = await create();
  await advanceTo(firstOriginal, COMBINED_INCIDENT_MINUTE);
  await mutate(firstOriginal, "/incidents", { cause: "combined", fixture_incident_id: "inc_combined1" }, 201);
  const first = await resetOwner(firstOriginal);
  expect((await read(firstOriginal, "")).status).toBe(410);
  const firstResults = await incidentRun(first);

  const secondOriginal = await create();
  await advanceTo(secondOriginal, COMBINED_INCIDENT_MINUTE);
  await mutate(secondOriginal, "/incidents", { cause: "combined", fixture_incident_id: "inc_combined1" }, 201);
  const second = await resetOwner(secondOriginal);
  expect((await read(secondOriginal, "")).status).toBe(410);
  const secondResults = await incidentRun(second);
  const comparable = (result: Results) => ({ scenario_id: result.scenario_id, scenario_version: result.scenario_version,
    config_hash: result.config_hash, horizon_minute: result.horizon_minute, observed_until_minute: result.observed_until_minute,
    calibration_status: result.calibration_status, late_reduction_ratio: result.late_reduction_ratio,
    branches: result.branches.map(branch => ({ branch_id: branch.branch_id, metrics: branch.metrics })) });
  expect(comparable(secondResults)).toEqual(comparable(firstResults));
});

it("T15 links manually accepted motorbike evidence to replan, ETA change, approval, Execute and event trace", async () => {
  const owner = await create();
  await advanceTo(owner, COMBINED_INCIDENT_MINUTE);
  const incidentResponse = await mutate(owner, "/incidents", { cause: "combined", fixture_incident_id: "inc_combined1" }, 201);
  const incident = parseSchema("IncidentResponse", await incidentResponse.json()).data!;
  const impact = parseSchema("ImpactResponse", await (await read(owner, "/impact")).json()).data!;
  expect(impact.incident_ids).toContain(incident.incident_id);
  const initial = await createPlan(owner, "manual");
  const initialApproved = await approvePending(owner, initial.plan);
  const initialGroups = readyGroups(initialApproved); expect(initialGroups.length).toBeGreaterThan(0);
  const firstDryRun = parseSchema("DryRunResultResponse", await (await mutate(owner, `/plans/${initialApproved.plan_id}/dry-runs`,
    { group_ids: initialGroups }, 200)).json()).data!;
  const firstExecute = await mutate(owner, `/plans/${initialApproved.plan_id}/executions`, { group_ids: initialGroups }, 201);
  expect(parseSchema("ExecutionResponse", await firstExecute.json()).data!.plan_id).toBe(initialApproved.plan_id);

  const beforeKnowledge = parseSchema("KnowledgeResponse", await (await read(owner, "/knowledge")).json()).data!;
  const beforeBike = beforeKnowledge.segments.find(item => item.segment_id === "seg_edge27" && item.vehicle_type === "motorbike")!;
  const beforeCar = beforeKnowledge.segments.find(item => item.segment_id === "seg_edge27" && item.vehicle_type === "car")!;
  const accepted = await submitAndAccept(owner, COMBINED_INCIDENT_MINUTE);
  const afterKnowledge = parseSchema("KnowledgeResponse", await (await read(owner, "/knowledge")).json()).data!;
  const afterBike = afterKnowledge.segments.find(item => item.segment_id === "seg_edge27" && item.vehicle_type === "motorbike")!;
  const afterCar = afterKnowledge.segments.find(item => item.segment_id === "seg_edge27" && item.vehicle_type === "car")!;
  expect(afterBike).not.toEqual(beforeBike);
  expect(accepted.observations.every(item => item.vehicle_types.join() === "motorbike")).toBe(true);
  expect(accepted.observations.every(item => afterBike.observation_ids.includes(item.observation_id))).toBe(true);
  expect(afterCar).toEqual(beforeCar);
  const reviewMeta = parseSchema("SessionMetaResponse", await (await read(owner, "")).json()).data!;

  const replanned = await createPlan(owner, "accepted_report", [accepted.report.report_id]);
  expect(replanned.job.input_revision).toBe(reviewMeta.revision);
  expect(replanned.plan.plan_id).not.toBe(initial.plan.plan_id);
  expect(accepted.observations.every(observation => observation.evidence_ids.includes(accepted.report.report_id))).toBe(true);
  const beforeExecute = parseSchema("OperationsResponse", await (await read(owner, "/operations")).json()).data!;
  const newApproved = await approvePending(owner, replanned.plan);
  expect(parseSchema("OperationsResponse", await (await read(owner, "/operations")).json()).data).toEqual(beforeExecute);
  const newGroups = readyGroups(newApproved); expect(newGroups.length).toBeGreaterThan(0);
  const secondDryRun = parseSchema("DryRunResultResponse", await (await mutate(owner, `/plans/${newApproved.plan_id}/dry-runs`,
    { group_ids: newGroups }, 200)).json()).data!;
  const oldOrders = firstDryRun.projected_branches.find(branch => branch.branch_id === "floodops")!.orders;
  const newOrders = secondDryRun.projected_branches.find(branch => branch.branch_id === "floodops")!.orders;
  const changedEtas = oldOrders.flatMap(old => {
    const next = newOrders.find(order => order.order_id === old.order_id);
    return next && next.eta_minute !== old.eta_minute ? [{ order_id: old.order_id, before: old.eta_minute, after: next.eta_minute }] : [];
  });

  const executionResponse = await mutate(owner, `/plans/${newApproved.plan_id}/executions`, { group_ids: newGroups }, 201);
  const execution = parseSchema("ExecutionResponse", await executionResponse.json()).data!;
  const executedPlan = parseSchema("PlanResponse", await (await read(owner, `/plans/${newApproved.plan_id}`)).json()).data!;
  expect(executedPlan.status).toBe("executed");
  expect(executedPlan.actions.some(action => action.status === "executed")).toBe(true);
  const events = parseSchema("EventPageResponse", await (await read(owner, "/events?after=0&limit=500")).json()).data;
  expect(events.events.some(event => event.type === "proposal_changed"
    && event.resource_ids.includes(newApproved.plan_id) && event.resource_ids.includes(execution.execution_id))).toBe(true);
  expect(changedEtas, JSON.stringify({ before: oldOrders.map(order => [order.order_id, order.eta_minute]),
    after: newOrders.map(order => [order.order_id, order.eta_minute]) })).not.toHaveLength(0);
});
