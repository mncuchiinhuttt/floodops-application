import type { Plan } from "@floodops/contracts";
/** Selection is a UI guard; the server recomputes the combined candidate and atomic gate. */
export function groupClosure(plan: Plan, roots: readonly string[]): string[] | null {
  const groups = new Map(plan.groups.map(group => [group.group_id, group]));
  if (groups.size !== plan.groups.length || new Set(roots).size !== roots.length) return null;
  const visited = new Set<string>(), visiting = new Set<string>();
  function visit(id: string): boolean {
    if (visited.has(id)) return true;
    const group = groups.get(id);
    if (!group || visiting.has(id)) return false;
    visiting.add(id);
    for (const actionId of group.action_ids) {
      const matches = plan.actions.filter(action => action.action_id === actionId);
      const action = matches[0];
      if (matches.length !== 1 || !action || action.dependency_group_id !== id || action.status !== "ready" ||
        action.rule_results.some(rule => rule.outcome === "blocked" || rule.outcome === "needs_replan")) return false;
    }
    for (const dependency of group.depends_on_group_ids) if (!visit(dependency)) return false;
    visiting.delete(id); visited.add(id); return true;
  }
  for (const root of roots) if (!visit(root)) return null;
  return plan.groups.filter(group => visited.has(group.group_id)).map(group => group.group_id);
}
