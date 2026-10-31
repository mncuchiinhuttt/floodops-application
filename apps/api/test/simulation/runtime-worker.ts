import { createApp } from "../../src/app/index";
import { createSessionObject } from "../../src/session-runtime/index";
import { loadSessionScenario, simulationPersistence } from "../../src/index";
import { createSimulationRuntime } from "../../src/features/simulation/index";
import { createResultsRouter, createResultsView, RESULTS_VIEW } from "../../src/features/results/index";

// Explicit deterministic public-simulator policy for tests only, not the production business composition.
const feature = createSimulationRuntime({ persistence: simulationPersistence, maxBoundaries: 1, maxChunks: 128,
  committedPolicy: (context) => context.snapshot.values.test_missing_policy ? undefined : ({
    authorizeEntry: ({ knowledge }) => ({ allowed: knowledge?.state === "known" && knowledge.confidence_band === "high", reason: "POL-02" })
  }) });
const RegisteredSessionDO = createSessionObject({ ...feature.registry,
  views: { ...feature.registry.views, [RESULTS_VIEW]: createResultsView(simulationPersistence) } });
export class SessionDO extends RegisteredSessionDO {}
export default createApp([feature.router, createResultsRouter()], { loadScenario: loadSessionScenario, clientAddress: () => "127.0.0.1" });
