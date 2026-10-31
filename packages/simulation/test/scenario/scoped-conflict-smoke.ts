import { deriveKnowledgeSnapshot, reconcileEvidence } from "@floodops/domain/knowledge";
import { advanceRun, applyKnowledgeTransition, createRun, loadScenario, sealScenarioDraft } from "@floodops/simulation";
import { hash, highOnly } from "./test-context.ts";
import { evidenceContext, scopedManifest, sharedId, vehicles } from "./scoped-evidence-context.ts";

const original = scopedManifest(vehicles, []);
const run = advanceRun(createRun(loadScenario(sealScenarioDraft(original, hash), hash), "run_scoped_smoke"), 0.1, highOnly).run;
const incoming = scopedManifest(vehicles, ["motorbike"]), context = evidenceContext(incoming, 0.1);
const knowledge = deriveKnowledgeSnapshot(run.knowledge, context);
const next = applyKnowledgeTransition(run, knowledge, { sourceSnapshot: incoming.sourceSnapshot, reasonId: "rpt_scoped_smoke" });
const states = Object.fromEntries(next.knowledge.filter(item => item.segment_id === "seg_edge27").map(item => [item.vehicle_type, item.state]));
let consumerGuard: string | null = null;
try { reconcileEvidence(run.knowledge, context); }
catch (error) { if (!(error instanceof Error)) throw error; consumerGuard = error.message; }
if (states.motorbike !== "unresolved_conflict" || states.car !== "known" || states.truck !== "known"
  || consumerGuard !== "SOURCE_SCOPE_INCOMPATIBLE" || run.nowMs !== next.nowMs) throw new Error("Scoped conflict smoke failed.");
console.log(JSON.stringify({ segment: "seg_edge27", states, sharedAggregateFlag: next.sourceSnapshot.observations.find(item => item.observation_id === sharedId)!.has_conflict,
  consumerGuard, simMinute: next.nowMs / 60000, originalStates: Object.fromEntries(run.knowledge.filter(item => item.segment_id === "seg_edge27").map(item => [item.vehicle_type, item.state])),
  committedAssignments: next.branches.floodops!.operations.orders.map(order => ({ order: order.order_id, driver: order.driver_id, eta: order.eta_minute })) }, null, 2));
