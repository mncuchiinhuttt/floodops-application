import { advanceRun, checkEntry, projectCurrent } from "@floodops/simulation";
import type { SimulationPolicy } from "@floodops/simulation";
import { createCurrentPolicy, createPlanningPolicy, evaluateCandidate } from "@floodops/domain/planning";
import { approval, authority, critical, highOnly, hash, makePlan, makeRoute, moto, runFixture } from "./planning-context.ts";
const run = runFixture(), plan = makePlan(), route = makeRoute(run);
for (const k of run.knowledge) if (k.vehicle_type === "motorbike") {
  k.state = "ordinary_unknown"; k.condition = "unknown"; k.confidence_band = null;
  k.expires_sim_minute = null; k.observation_ids = [];
}
const auth = authority(run, plan); auth.approvals = [approval(plan)];
const original = JSON.stringify(run), proposal = createPlanningPolicy(run, auth, { [moto]: [plan.actions[0]!.action_id] }, highOnly);
const driver = run.branches.floodops!.operations.drivers[0]!;
const branchDecisions = Object.fromEntries((["floodops", "static", "reroute_only"] as const).map(branch =>
  [branch, checkEntry(run, branch, driver, "seg_edge17", 0, proposal)]));
const advanced = advanceRun(run, 0.5, proposal).run;
const entries = advanced.log.filter(e => e.kind === "entry" && e.driverId === moto).map(e => ({ branch: e.branch, segment: e.segmentId, at: e.atMinute }));
if (!branchDecisions.floodops!.allowed || branchDecisions.static!.allowed || branchDecisions.reroute_only!.allowed
  || entries.length !== 1 || entries[0]!.branch !== "floodops") throw new Error("Proposal authority crossed branch.");
const port: SimulationPolicy = { authorizeEntry: context => ({
  allowed: (context.knowledge?.state === "known" && context.knowledge.confidence_band === "high")
    || (context.branch === "floodops" && context.driver.driver_id === moto && ["seg_edge17", "seg_edge21"].includes(context.segmentId)),
  reason: "EXPLICIT_COMMITTED_GRANT" }) };
const currentPolicy = createCurrentPolicy(run, port), before = projectCurrent(run, currentPolicy);
route.stops = [];
const input = { run, plan, routes: [route], authority: auth, currentPolicy, selectedGroupIds: [plan.groups[0]!.group_id], deferLimitMinute: 3, hash };
const outcomes = [false, true].map(approved => {
  auth.approvals = approved ? [approval(plan)] : [];
  const result = evaluateCandidate(input);
  if (result.status !== "blocked" || !result.issues.some(issue => issue.rule_id === "POL-05")) throw new Error("Critical loss escaped POL05.");
  return { approved, status: result.status, rule: "POL-05" };
});
if (before.etas[critical] !== 4.75 || JSON.stringify(run) !== original) throw new Error("Current projection/input changed.");
console.log(JSON.stringify({ datasetKind: run.scenario.manifest.datasetKind, bundleHash: run.scenario.bundleHash,
  branchDecisions, actualProjectedEntries: entries, currentCriticalEta: before.etas[critical],
  currentCriticalUnreachable: before.objective.critical_unreachable, proposalOutcomes: outcomes,
  inputUnchanged: true, qualification: "Pure public simulator authority smoke; no durable Execute/model/device proof." }, null, 2));
