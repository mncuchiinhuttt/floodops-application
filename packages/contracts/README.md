# Shared wire contracts

Phase 01 implementation in progress. The canonical definition is under `definition/`;
runtime Zod schemas, DTOs, operation contracts and provider tool registrations are
generated from it. Design snapshots and examples must remain in sync.

IntegrationLead request (baseline does not yet include these dependencies):

- `@floodops/contracts`: a reviewed, pinned Zod 4.x dependency; ESM export `.` to
  `./src/index.ts`; `typecheck` script using the package tsconfig.
- `@floodops/api-client`: dependency `@floodops/contracts: workspace:*`; ESM export
  `.` to `./src/index.ts`; `typecheck` script using the package tsconfig.
- Focused checks can use direct Bun commands; no root script change is necessary.

Only IntegrationLead edits package manifests, package-root tsconfig and lockfile.
Workers install with Bun 1.4.0, `--frozen-lockfile --ignore-scripts`, after receiving
the controlled new baseline and receipt. No sibling dependencies are reused.
