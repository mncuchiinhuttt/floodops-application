import { parseSchema } from "@floodops/contracts";
import { applyKnowledgeTransition } from "@floodops/simulation";
import { fail } from "../../shared/index";
import type { ReducerDefinition } from "../../shared/index";
import { idle, runtimeRun } from "../planning/runtime-context";
import { planningValues, readPlanningState } from "../planning/runtime-state";
import { planningKnowledge } from "../planning/source-context";
import type { ResolvedPlanningOptions } from "../planning/runtime-types";
export const INCIDENT_TRIGGER = "planning.incident.trigger";
export function triggerIncident<State>(options: ResolvedPlanningOptions<State>): ReducerDefinition {
  return { permission: "restrictions:apply", operational: true, validate: raw => parseSchema("TriggerIncidentInput", raw),
    reduce(context, raw) {
      idle(context); const input = parseSchema("TriggerIncidentInput", raw), run = runtimeRun(context, options);
      const fixture = run.scenario.manifest.config.incident_fixtures.find(f => f.fixture_incident_id === input.fixture_incident_id && f.cause === input.cause);
      if (!fixture) fail(422, "UNKNOWN_ENTITY");
      const events = fixture.road_event_ids.map(id => run.scenario.manifest.events.find(e => e.id === id));
      if (events.some(e => !e || !e.knowledge || e.atMinute > run.nowMs / 60000)) fail(409, "STATE_CONFLICT");
      const state = readPlanningState(context.snapshot), incident = parseSchema("Incident", { incident_id: "incident_" + crypto.randomUUID(),
        cause: input.cause, fixture_event_ids: fixture.road_event_ids, sim_minute: run.nowMs / 60000,
        affected_segment_ids: [...new Set(events.map(e => e!.knowledge!.segment_id))], label: fixture.label });
      const after = applyKnowledgeTransition(run, planningKnowledge(run).segments, { sourceSnapshot: run.sourceSnapshot, reasonId: incident.incident_id });
      state.incidents.push(incident);
      return { data: incident, values: options.persistence.write(planningValues(context.snapshot, state), after),
        events: [{ type: "state_changed", resource_ids: [incident.incident_id] }] };
    } };
}
