# Code standards

These standards summarize [AGENTS.md](../AGENTS.md), the active architecture specifications and the checked-in TypeScript/workspace configuration. The examples describe current repository conventions; they are not a claim that every feature or milestone is complete.

## Source layout and naming

- Keep new source files below 200 lines. Split by real responsibility, not only to hit a line count; do not weaken cohesive tests to satisfy the source-file limit.
- Use kebab-case for new file names unless a framework/tool requires a conventional name such as `index.ts`, `router.tsx` or `app.config.ts`.
- Organize behavior by feature. Keep route/screen adapters thin; call a feature facade/runtime, shared contracts/API client and pure domain logic in that order. Do not create a global grab-bag of business `services` or `utils`.
- Import another feature through its public entrypoint. Avoid app-to-app imports, circular feature dependencies, deep imports of private implementation and duplicated schemas/rules.
- Web and native share public contracts and semantic tokens; native must use native primitives and must not import DOM, Radix or web UI packages.

## TypeScript and domain boundaries

- The shared TypeScript configuration enables `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `verbatimModuleSyntax`, `isolatedModules` and `noEmit`. Keep those checks intact; do not widen types or silence errors to get a green build.
- Validate external/wire values with canonical `@floodops/contracts` schemas and typed adapters. Prefer explicit parsing and narrow ports; do not use inline cast-plus-member access such as `(value as Type).field` or add local `isRecord` guards.
- Keep `packages/domain` and `packages/simulation` portable and deterministic: no React/Hono/Cloudflare/OpenAI imports, hidden clock/network access, or implicit random state. Inject time, IDs, transport and persistence at boundaries.
- The Worker owns authorization, policy, revisions and committed state. UI projections/previews remain distinct from committed results; clients do not optimistically commit assignment, ETA, points, safety state or Execute.

## Security and failure behavior

- Participant authority is capability-based and server-derived; request bodies, URL IDs and visible role selectors do not grant access. Preserve CSRF/Origin checks for web cookies, bearer authorization for native, schema validation, CAS/ETag and idempotency rules.
- Keep provider keys server-only. Treat user text, reports, images, EXIF, external source data and model output as untrusted. Models can propose advice only; deterministic policy and the transaction boundary enforce effects.
- Media stays private and session-owned. Never serve raw staging as a normalized image or add arbitrary URL fetching. Missing data/provider/storage should remain an explicit typed unavailable/error state, not a fabricated result or fallback.
- Do not add mocks, stubs or no-ops in place of assigned behavior. Tests may isolate platform adapters, but label them and do not claim they prove live backend, provider, device or calibration behavior.

## Tests and checks

- Prefer behavior-focused boundary, error, race and safety-invariant tests. Do not assert source text/wiring or incidental UI copy as a substitute for exercising behavior; never delete/weaken consumer-visible safety tests to make a suite pass.
- Pure package suites use Bun tests (for example `bun test packages/simulation/test packages/test-fixtures/test`). Worker/DO integration uses Vitest with the Cloudflare Workerd runtime. Web and native package README files document their scoped typecheck, lint, tests and build commands.
- The root scripts are `bun run typecheck`, `bun run lint`, `bun run test` and `bun run check`; lint uses `--max-warnings=0`. A package or schema check is not an application E2E, real-model, native-device or release result.
- Record the exact command, working directory, source/config/seed when relevant, pass/fail/unavailable result and evidence path. Do not report a planned or unrun command as passing.

## Dependencies, commits and reviews

- IntegrationLead owns central manifests, `bun.lock`, workspace configuration and central API/Wrangler wiring. Request reviewed dependency changes instead of editing those files from a feature slice; keep versions pinned and respect peer/licence/advisory checks.
- Use conventional commit subjects (`feat:`, `fix:`, `test:`, `docs:`, `build:` or `chore:` as appropriate). Stage only explicit owned paths; do not include unrelated worktree changes or AI attribution.
- Preserve unexpected user/sibling changes. Do not use destructive cleanup, reset/rebase/force-push, weaken security gates, or claim a gate from a source branch before the integrated evidence is recorded.

## References

- [Repository policy](../AGENTS.md)
- [Architecture and feature boundaries](../plans/20261030-2249-floodops-web-mobile-implementation/specs/architecture.md)
- [API security conventions](../plans/20261030-2249-floodops-web-mobile-implementation/specs/api-conventions-security.md)
- [Testing strategy](../plans/20261030-2249-floodops-web-mobile-implementation/specs/testing-strategy.md)
- [Bun toolchain decision](architecture/bun-toolchain.md)
- [Root workspace scripts and strict TypeScript config](../package.json) · [TypeScript settings](../tsconfig.base.json)
