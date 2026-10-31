import { parseSchema } from "@floodops/contracts";
import type { Plan, PlanningJob, Route } from "@floodops/contracts";
import { sourceState } from "@floodops/domain/reporting";
import { scopedKnowledge, currentKnowledge, coverage } from "../../src/features/knowledge/index";
import { scenarioCatalog, simulationPersistence } from "../../src/index";
import type { RuntimeRegistry, TransitionContext } from "../../src/shared/index";
import { fail } from "../../src/shared/index";
import type { WorkspaceProjectionPorts } from "../../src/features/results/index";

/** Actual public producer facades. Fault branches exercise dependency unavailability only. */
export function workspacePorts(planning: RuntimeRegistry, simulation: RuntimeRegistry): WorkspaceProjectionPorts<Omit<import("@floodops/simulation").SimulationRun, "scenario">> {
  const sources = { scenarioCatalog, simulationPersistence };
  const view = (registry: RuntimeRegistry, name: string, context: TransitionContext) => {
    const facade = registry.views?.[name]; if (!facade) fail(503, "CONFIG_INCOMPLETE"); return facade.project(context);
  };
  return { persistence: simulationPersistence,
    clock: context => parseSchema("SimulationClock", view(simulation, "simulation.clock", context)),
    knowledge: context => scopedKnowledge(sources, context),
    operations: context => parseSchema("Operations", view(planning, "planning.operations", context)),
    impact: context => parseSchema("Impact", view(planning, "planning.impact", context)),
    planning: context => view(planning, "planning.state", context) as { plans: Plan[]; jobs: PlanningJob[] },
    routes: context => {
      const result = (view(planning, "planning.routes", context) as Route[]).map(route => parseSchema("Route", route));
      if (context.snapshot.values.test_workspace_fault === "routes_missing") return [];
      return context.snapshot.values.test_workspace_fault === "routes_duplicate" ? [...result, ...result] : result;
    },
    reports: context => Object.values(sourceState(context.snapshot.values).reports).map(({ generation, report }) => ({ generation, report })),
    coverage: context => coverage(currentKnowledge(sources, context.snapshot)) };
}
