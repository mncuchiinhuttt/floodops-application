import { DependencyGroupSchema, PlanActionSchema } from "@floodops/contracts";
import type { DependencyGroup, PlanAction } from "@floodops/contracts";
import { OperationError } from "@floodops/domain/operations";
import type { Readiness } from "./planning-types.ts";

function fail(message: string): never { throw new OperationError("INVALID_DEPENDENCY", message); }
function unique(values: readonly string[]): boolean { return new Set(values).size === values.length; }
function assertDag(edges: ReadonlyMap<string, readonly string[]>): void {
  const active = new Set<string>(), done = new Set<string>();
  function visit(id: string): void {
    if (!edges.has(id)) fail("Missing dependency reference.");
    if (active.has(id)) fail("Dependency cycle.");
    if (done.has(id)) return;
    active.add(id); for (const dep of edges.get(id)!) visit(dep);
    active.delete(id); done.add(id);
  }
  for (const id of edges.keys()) visit(id);
}
export interface GroupSelection { requested: string[]; closure: string[]; eligible: string[]; excluded: string[]; actionIds: string[] }
export function selectDependencyGroups(actions: readonly PlanAction[], groups: readonly DependencyGroup[],
  requested: readonly string[], readiness: Readonly<Record<string, Readiness>>): GroupSelection {
  actions.forEach(action => PlanActionSchema.parse(action)); groups.forEach(group => DependencyGroupSchema.parse(group));
  if (!unique(actions.map(a => a.action_id)) || !unique(groups.map(g => g.group_id)) || !unique(requested)) fail("Duplicate IDs.");
  const actionMap = new Map(actions.map(a => [a.action_id, a])), groupMap = new Map(groups.map(g => [g.group_id, g]));
  const owners = new Map<string, string>();
  for (const group of groups) for (const id of group.action_ids) {
    if (owners.has(id) || actionMap.get(id)?.dependency_group_id !== group.group_id) fail("Missing/multiply owned action.");
    owners.set(id, group.group_id);
  }
  if (actions.some(action => !owners.has(action.action_id))) fail("Ungrouped action.");
  assertDag(new Map(actions.map(a => [a.action_id, a.depends_on_action_ids])));
  const edges = new Map(groups.map(g => [g.group_id, [...g.depends_on_group_ids]]));
  // An action dependency is mandatory even when the model omitted the redundant group edge.
  for (const action of actions) for (const dep of action.depends_on_action_ids) {
    const target = owners.get(dep)!;
    if (target !== action.dependency_group_id) edges.get(action.dependency_group_id)!.push(target);
  }
  assertDag(edges);
  const closure = new Set<string>();
  function include(id: string): void {
    if (!groupMap.has(id)) fail("Unknown selected group.");
    if (closure.has(id)) return;
    closure.add(id); for (const dep of edges.get(id)!) include(dep);
  }
  requested.forEach(include);
  const eligible = new Map<string, boolean>();
  function ready(id: string): boolean {
    if (eligible.has(id)) return eligible.get(id)!;
    const result = groupMap.get(id)!.action_ids.every(actionId => readiness[actionId] === "ready")
      && edges.get(id)!.every(ready);
    eligible.set(id, result); return result;
  }
  const sorted = [...closure].sort(), allowed = sorted.filter(ready);
  return { requested: [...requested], closure: sorted, eligible: allowed, excluded: sorted.filter(id => !eligible.get(id)),
    actionIds: allowed.flatMap(id => groupMap.get(id)!.action_ids).sort() };
}
