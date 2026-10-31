import { createApp } from "../../src/app/index";
import { createSessionObject } from "../../src/session-runtime/index";
import type { PlatformBindings, RuntimeRegistry } from "../../src/shared/index";
import { loadSessionScenario, simulationPersistence } from "../../src/index";
import { createPlanningRuntime } from "../../src/features/planning/index";
import { createSimulationRuntime } from "../../src/features/simulation/index";
import { testProvider } from "./test-provider";
const planning = createPlanningRuntime({ persistence: simulationPersistence, provider: testProvider, model: "declared-test-commander" });
const missing = createPlanningRuntime({ persistence: simulationPersistence });
const simulation = createSimulationRuntime({ persistence: simulationPersistence, committedPolicy: planning.committedPolicy });
function registry(feature: typeof planning): RuntimeRegistry {
  return { commands: { ...simulation.registry.commands, ...feature.registry.commands },
    views: { ...simulation.registry.views, ...feature.registry.views },
    onLeaseExpired: (snapshot, lease, now) => feature.registry.onLeaseExpired!(
      { ...snapshot, values: simulation.registry.onLeaseExpired!(snapshot, lease, now) }, lease, now) };
}
const Registered = createSessionObject(registry(planning)), Missing = createSessionObject(registry(missing));
export class SessionDO extends Registered {}
export class MissingSessionDO extends Missing {}
const app = createApp([planning.router, simulation.router], { loadScenario: loadSessionScenario, clientAddress: () => "127.0.0.1" });
const unavailable = createApp([missing.router, simulation.router], { loadScenario: loadSessionScenario, clientAddress: () => "127.0.0.1" });
interface TestEnv extends PlatformBindings { MISSING_SESSIONS: PlatformBindings["SESSIONS"] }
export default { fetch(request: Request, env: TestEnv, ctx: ExecutionContext) {
  const url = new URL(request.url);
  if (url.pathname.startsWith("/missing/")) {
    url.pathname = url.pathname.slice("/missing".length);
    return unavailable.fetch(new Request(url, request), { ...env, SESSIONS: env.MISSING_SESSIONS }, ctx);
  }
  return app.fetch(request, env, ctx);
} };
