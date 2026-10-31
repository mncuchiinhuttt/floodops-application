import { parseSchema } from "@floodops/contracts";
import { normalizeInput } from "@floodops/domain/sources";
import { reconcileEvidence } from "@floodops/domain/knowledge";
import { sourceState } from "@floodops/domain/reporting";
import { applyKnowledgeTransition } from "@floodops/simulation";
import type { RuntimeRegistry, TransitionContext } from "../../shared/index";
import { fail } from "../../shared/index";
import { scenarioOf, sourceEnvironment } from "../scenario/index";
import { adaptSourceRegistry } from "../scenario/index";
import type { SourcesPorts } from "../scenario/index";
import { scopedKnowledge } from "../knowledge/index";
function replay(ports: SourcesPorts, restrictionOnly: boolean, context: TransitionContext, value: unknown) {
  const input = parseSchema("ReplayInput", value), environment = sourceEnvironment(ports, context.snapshot);
  const event = environment.inputEvents.find(item => item.fixture_event_id === input.fixture_event_id);
  if (!event || (restrictionOnly && event.role !== "restriction")) fail(404, "NOT_FOUND");
  const state = sourceState(context.snapshot.values);
  if (state.replayedFixtureIds.includes(input.fixture_event_id)) fail(409, "STATE_CONFLICT");
  if (event.sim_minute > environment.nowSimMinute) fail(409, "STATE_CONFLICT");
  const normalized = normalizeInput(event, environment);
  const run = ports.simulationPersistence.read(context.snapshot.values);
  const pairs = run.knowledge.map(pair => {
    if (event.role !== "restriction") return pair;
    const restriction = environment.restrictions.find(item => item.restriction_id === event.restriction_id);
    if (!restriction || restriction.segment_id !== pair.segment_id || !restriction.vehicle_types.includes(pair.vehicle_type)) return pair;
    const changed = restriction.kind === "closure" ? !pair.restriction_ids.includes(restriction.restriction_id) : pair.state === "authoritative_closed";
    return changed ? { ...pair, knowledge_epoch: pair.knowledge_epoch + 1 } : pair;
  });
  const reconciled = reconcileEvidence(pairs, environment);
  const next = applyKnowledgeTransition(run, reconciled.knowledge, { sourceSnapshot: { ...run.sourceSnapshot, observations: reconciled.observations }, reasonId: event.input_event_id });
  for (const pair of pairs) if (run.knowledge.some(old => old.segment_id === pair.segment_id && old.vehicle_type === pair.vehicle_type && old.knowledge_epoch !== pair.knowledge_epoch))
    state.epochHistory.push({ segment_id: pair.segment_id, vehicle_type: pair.vehicle_type, knowledge_epoch: pair.knowledge_epoch, atMinute: context.snapshot.meta.sim_minute });
  state.replayedFixtureIds.push(input.fixture_event_id);
  const values = ports.simulationPersistence.write({ ...context.snapshot.values, sourcesMedia: state }, next);
  return { values, data: restrictionOnly ? environment.restrictions.find(item => item.restriction_id === event.restriction_id)! : normalized.event,
    events: [{ type: "state_changed" as const, resource_ids: [event.input_event_id] }] };
}
export function createSourcesRegistry(ports: SourcesPorts): RuntimeRegistry {
  return adaptSourceRegistry({ commands: {
    "source-replay": { permission: "sources:replay", operational: true, validate: value => parseSchema("ReplayInput", value), reduce: (context, input) => replay(ports, false, context, input) },
    "source-restriction": { permission: "restrictions:apply", operational: true, validate: value => parseSchema("ReplayInput", value), reduce: (context, input) => replay(ports, true, context, input) }
  }, views: {
    "source-graph": { permission: "scenario:read", roles: ["dispatcher", "driver", "contributor", "viewer"], project: ({ snapshot }) => scenarioOf(ports, snapshot).manifest.graph },
    "source-config": { permission: "scenario:read", roles: ["dispatcher", "driver", "contributor", "viewer"], project: ({ snapshot }) => scenarioOf(ports, snapshot).manifest.config },
    "source-list": { permission: "scenario:read", roles: ["dispatcher", "driver", "contributor", "viewer"], project: ({ snapshot }) => sourceEnvironment(ports, snapshot).sources },
    "source-events": { permission: "scenario:read", roles: ["dispatcher", "viewer"], project: ({ snapshot }) => sourceEnvironment(ports, snapshot).inputEvents.filter(item => item.sim_minute <= snapshot.meta.sim_minute).map(item => normalizeInput(item, sourceEnvironment(ports, snapshot)).event) },
    "source-knowledge": { permission: "scenario:read", roles: ["dispatcher", "driver", "viewer"], project: context => scopedKnowledge(ports, context) },
    "source-observations": { permission: "knowledge:read", roles: ["dispatcher", "driver"], project: context => scopedKnowledge(ports, context) },
    "source-restrictions": { permission: "scenario:read", roles: ["dispatcher", "driver", "viewer"], project: context => scopedKnowledge(ports, context) }
  } });
}
