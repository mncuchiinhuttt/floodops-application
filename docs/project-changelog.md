# Project changelog

Summaries below are derived from `git log --format='%h %ad %s' --date=short integration/floodops-application`. The 235 commits on that ref are all dated 2026-10-31; subjects are grouped by conventional type rather than repeated individually. `merge` and Git-generated merge subjects are listed separately because they record integration, not a feature type.

## 2026-10-31

### `feat` (50 commits)

- Added the shared contracts/client foundation, deterministic graph and simulator, durable session runtime, source/media pipeline, review/knowledge/reward features, bounded deterministic planner, clock/results/evaluation routes, and connected web/native applications.
- Added same-origin production Worker/static-asset configuration and an overridable smoke-test URL. The production demo is live at [the `workers.dev` endpoint](https://floodops-api.vominhlongbentre.workers.dev); deployment context and limits are recorded in the [root README](../README.md). Representative commits: `0f2155c`, `6490f86`.

### `fix` (21 commits)

- Corrected session Reset stream closure, capability/session fencing, source/review compatibility, simulation evidence scope, and security/CORS response handling.
- Added `Cache-Control: no-transform` alongside no-store so Cloudflare edge transformation does not weaken strong ETags used by `If-Match` (`ce6f745`). See [session platform header evidence](../plans/reports/worktree-session-platform-session-platform-phase-04-v3.md).

### `test` (7 commits)

- Added typed loopback/API workflow probes, route/composition coverage checks, and source/runtime regression tests. These are scoped evidence; they are not a full M1, calibration, model, native-device, or release acceptance claim. Examples: `185ed0c`, `09b0a53`, `6e89de5`.

### `build` (9 commits)

- Established the Bun workspace and pinned compatible client/runtime dependencies; added local synthetic Worker configuration. Examples: `aea042b`, `df65203`.

### `chore` (24 commits)

- Published reviewed gates, worktree ownership/launch receipts, dependency checkpoints and bounded integration metadata.

### `docs` (83 commits)

- Reconciled the PRD and M1 cutover, recorded owner source evidence and integration blockers, and published local/production run guidance. Commit `ded1802` records the 2026-10-31 production demo deployment and the Workers Free CPU limit; this is consistent with the live URL and limitations in the [README](../README.md).

### `merge` and Git merge commits (41 commits total)

- Integrated reviewed contracts, shared libraries, simulation, session platform, source/media, planning, review/rewards, results, web and native slices while preserving evidence and correction history. Representative `merge(...)` commits: `3883639`, `851b2ed`, `2283680`, `cd8522c`.

## Evidence boundary

This is a summary of commit subjects and repository delivery evidence, not an exhaustive history of user or agent chat. Deployment statements are limited to the committed README/deployment record; the known Workers Free plan CPU limitation means a live deployment is not equivalent to every workflow being available in production.
