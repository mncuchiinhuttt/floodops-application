# M1 HTTP probe verification

Baseline b686741d5b5273526f5eb5657a290c4df6fde746; synthetic functional-v2. Skill ck:test used typed real-loopback workflow and explicit blocked-stage reporting rather than counting mounted routes as E2E. No application/role source changed.

- `bun --bun run tsc -p tooling/runtime/tsconfig.json`: pass after correcting the new probe's typed review/reset envelope assumptions.
- `bun --bun run eslint tooling/runtime/m1-local-smoke.ts --max-warnings=0`: pass.
- Actual local Wrangler, local Images/private R2/SQLite DO, metrics disabled,127.0.0.1:8760 and isolated `.wrangler/state/m1-local-probe`; stopped own server after checks.
- `bun tooling/runtime/m1-local-smoke.ts --source-only`: exit0; catalog200/create201/upload+normalization201/free-report201/cleanup pass.
- `bun tooling/runtime/m1-local-smoke.ts`: exit1; same real successful stages then manual-review404 NOT_FOUND; cleanup pass. Remaining stages were not executed or claimed. Review needs canonical SourceReviewPort, platform hooks, then v0.5 reward semantics and Lead composition.
- No coverage percentage claimed, no browser run in this slice. No live model/device/participant parity/session expiry/calibration or production evidence.

Web inspection: ReportSubmitRoute offers fixture choices only; no real browser upload/normalization control exists. This can be implemented independently on frozen existing media APIs, with scoped Reset/abort/auth/idempotency protection, before changed reward/planning DTO cutover. Minimal graph geometry rendering is similarly independent; dispatcher snapshot/planning controls still wait composed backend. Results existing observed metrics/clock views are reachable; no new Results runtime task should claim advancement/E2E until genuine committed policy and new M1 contract adoption. Existing Results core is retained, not rewritten or coupled to obsolete model evaluation.
