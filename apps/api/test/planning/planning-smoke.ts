import { advanceRun } from "@floodops/simulation";
import { createPlanningPolicy, evaluateCandidate } from "../../../../packages/domain/src/planning/index.ts";
import { authority, car, food, highOnly, hash, makePlan, makeRoute, runFixture, standard, stopsFor } from "./planning-context.ts";
const run = runFixture(true), plan = makePlan(), action = plan.actions[0]!;
action.kind = "change_hub"; action.targets.order_id = standard; action.targets.driver_id = car; action.targets.hub_id = "hub_beta01";
const route = makeRoute(run, car); route.stops = [...stopsFor(run, food), ...stopsFor(run, standard, "hub_beta01")];
route.assignment_overrides = [{ order_id: standard, driver_id: car, pickup_hub_id: "hub_beta01" }];
const input = { run, plan, routes: [route], selectedGroupIds: plan.groups.map(group => group.group_id),
  authority: authority(run, plan), currentPolicy: highOnly, deferLimitMinute: 3, hash };
const original = JSON.stringify(run), result = evaluateCandidate(input);
if (result.status !== "ready" || !result.projection || !result.compiled) throw new Error("Candidate smoke not Ready.");
const projected = advanceRun(result.projection.candidateRun, 20,
  createPlanningPolicy(result.projection.candidateRun, input.authority, result.compiled.actionIdsByDriver, input.currentPolicy)).run;
const order = projected.branches.floodops!.operations.orders.find(order => order.order_id === standard)!;
const pickup = projected.log.find(log => log.branch === "floodops" && log.kind === "pickup" && log.orderId === standard);
if (!pickup || order.pickup_hub_id !== "hub_beta01" || order.delivered_at_minute === null
  || JSON.stringify(run) !== original) throw new Error("Projected pickup/non-mutation smoke failed.");
const superseded = evaluateCandidate({ ...input, authority: { ...input.authority,
  current: { ...input.authority.current, latest_requested_job_id: "job_superseded1" } } });
if (superseded.status !== "needs_replan" || superseded.projection !== null) throw new Error("Superseded job guard failed.");
console.log(JSON.stringify({ datasetKind: run.scenario.manifest.datasetKind, bundleHash: run.scenario.bundleHash,
  seedHash: run.scenario.manifest.config.seed_hash, configHash: run.scenario.manifest.config.config_hash,
  graphHash: run.scenario.manifest.graph.graph_hash, status: result.status, isProjected: result.is_projected,
  route: result.routes[0]!.segment_ids, routeId: result.routes[0]!.route_id,
  projectedPickupMinute: pickup.atMinute, projectedCompletionMinute: order.delivered_at_minute,
  projectedPickupHub: order.pickup_hub_id, committedDriverStill: run.branches.floodops!.operations.orders.find(o => o.order_id === standard)!.driver_id,
  sameRevisionSupersededJob: superseded.status, inputUnchanged: JSON.stringify(run) === original,
  qualification: "Pure candidate/runner smoke; no durable Execute, model, device or calibration gate." }, null, 2));
