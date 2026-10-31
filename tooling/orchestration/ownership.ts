export interface OwnershipRole {
  id: string;
  include_files: string[];
  include_prefixes: string[];
  exclude_prefixes: string[];
  report_prefix: string;
  report_suffix: string;
}

export interface OwnershipManifest {
  ownership_policy: { protected_files: string[] };
  roles: OwnershipRole[];
}

export function assertRepoPath(path: string): string {
  const hasControl = [...path].some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127);
  if (!path || path.startsWith("/") || /^[a-z]:/i.test(path) || path.includes("\\") || hasControl) {
    throw new Error("Expected a safe repository-relative POSIX file path.");
  }
  if (path.split("/").some(part => !part || part === "." || part === "..")) {
    throw new Error("Path traversal, empty components and directory paths are forbidden.");
  }
  return path;
}

export function ownersForPath(path: string, manifest: OwnershipManifest, workItemId: string): string[] {
  assertRepoPath(path);
  if (manifest.ownership_policy.protected_files.includes(path)) return ["integration-lead"];
  return manifest.roles.filter(role => {
    const source = role.include_files.includes(path)
      || role.include_prefixes.some(prefix => path.startsWith(prefix));
    const report = path === `${role.report_prefix}${workItemId}${role.report_suffix}`;
    return (source || report) && !role.exclude_prefixes.some(prefix => path.startsWith(prefix));
  }).map(role => role.id);
}

export function assertOwnedPaths(paths: string[], roleId: string, workItemId: string, manifest: OwnershipManifest): void {
  if (!manifest.roles.some(role => role.id === roleId)) throw new Error(`Unknown role: ${roleId}`);
  for (const path of paths) {
    const owners = ownersForPath(path, manifest, workItemId);
    if (owners.length !== 1 || owners[0] !== roleId) {
      throw new Error(`Ownership denied for ${path}: ${owners.join(", ") || "unassigned"}.`);
    }
  }
}

export function changedPathsFromNameStatus(output: string): string[] {
  const fields = output.split("\0");
  if (fields.at(-1) !== "") throw new Error("Expected complete NUL-terminated git name-status output.");
  fields.pop();
  const paths: string[] = [];
  for (let index = 0; index < fields.length;) {
    const status = fields[index++];
    const count = status && /^[RC]\d{1,3}$/.test(status) ? 2 : 1;
    if (!status || !/^(?:[AMDT]|[RC]\d{1,3})$/.test(status)) throw new Error("Unexpected git diff status.");
    for (let side = 0; side < count; side++) {
      const path = fields[index++];
      if (path === undefined) throw new Error("Truncated git diff path record.");
      paths.push(assertRepoPath(path));
    }
  }
  return [...new Set(paths)];
}
