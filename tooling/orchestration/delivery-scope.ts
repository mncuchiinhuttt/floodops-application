interface PartialWorkItem {
  role_id: string; work_item_id: string; include_prefixes: string[]; include_files: string[];
}
interface Amendment { work_items?: PartialWorkItem[] }

export function assertPartialScope(paths: string[], role: string, item: string, report: string, amendment: Amendment): void {
  if (!amendment.work_items) return;
  const scopes = amendment.work_items.filter(scope => scope.role_id === role && scope.work_item_id === item);
  if (scopes.length !== 1) throw new Error("Partial work item missing or ambiguous.");
  const scope = scopes[0]!;
  for (const path of paths) {
    if (path !== report && !scope.include_files.includes(path) && !scope.include_prefixes.some(prefix => path.startsWith(prefix))) {
      throw new Error(`Outside partial work item: ${path}`);
    }
  }
}
