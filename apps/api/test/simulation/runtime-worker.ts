import { createApp } from "../../src/app/index";
import { createSessionObject } from "../../src/session-runtime/index";
import { loadSessionScenario, simulationPersistence } from "../../src/index";
import { createSimulationRuntime } from "../../src/features/simulation/index";
import { workspacePorts } from "./workspace-ports";
import { createPlanningRuntime } from "../../src/features/planning/index";
import { createWorkspaceViews, createResultsRouter, createResultsView, RESULTS_VIEW } from "../../src/features/results/index";

// Explicit deterministic public-simulator policy for tests only, not the production business composition.
const planning = createPlanningRuntime({ persistence: simulationPersistence });
const feature = createSimulationRuntime({ persistence: simulationPersistence, maxBoundaries: 1, maxChunks: 128,
  afterAdvance(input) {
    const { values, context, run } = input, mode = context.snapshot.values.test_hook;
    if (run.nowMs / 60000 !== context.snapshot.meta.sim_minute || JSON.stringify(context.snapshot.values) !== JSON.stringify(values)) throw new Error("Incoherent advance context");
    if (mode === "throw") throw new Error("Synthetic reconciliation failure");
    if (mode === "promise") return Promise.resolve(values) as unknown as Record<string, unknown>;
    if (mode === "rewrite") return { ...values, simulation: {} };
    if (mode === "drop") { const { runtime_contract: omitted, ...other } = values; void omitted; return other; }
    if (mode === "undefined") return { ...values, nullable_namespace: undefined };
    if (mode === "mutate") context.snapshot.meta.revision++;
    return { ...values, test_reconciled: { revision: context.snapshot.meta.revision, minute: context.snapshot.meta.sim_minute,
      calls: Number((values.test_reconciled as { calls: number } | undefined)?.calls ?? 0) + 1 } };
  },
  committedPolicy: (context) => context.snapshot.values.test_missing_policy ? undefined : ({
    authorizeEntry: ({ knowledge }) => ({ allowed: knowledge?.state === "known" && knowledge.confidence_band === "high", reason: "POL-02" })
  }) });
const ports = workspacePorts(planning.registry, feature.registry);
const workspace = createWorkspaceViews(ports), incomplete = createWorkspaceViews({ ...ports, impact: undefined });
const RegisteredSessionDO = createSessionObject({ ...feature.registry,
  views: { ...feature.registry.views, ...workspace,
    snapshot: { ...workspace.snapshot!, project: context => (context.snapshot.values.test_workspace_fault === "missing_impact" ? incomplete : workspace).snapshot!.project(context) },
    [RESULTS_VIEW]: createResultsView(simulationPersistence) } });
export class SessionDO extends RegisteredSessionDO {}
export default createApp([feature.router, createResultsRouter()], { loadScenario: loadSessionScenario, clientAddress: () => "127.0.0.1" });
