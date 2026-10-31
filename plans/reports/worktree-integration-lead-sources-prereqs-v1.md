# IntegrationLead — upstream audit and SourcesMedia prerequisites

Source C: `479ef8cfc7bb6ce18701ea622b273f2551e2faae`.
Worktree/branch: `/Users/vominhlong/seahackathon-worktrees/00-integration`, `integration/floodops-application`.
Baseline before this independent Lead task: `c17ef2531904f2d94b39e074677cdd212db7d0cc`.

## Delivered

- `tooling/orchestration/producer-gates.ts` and CLI `verify-producer-gates.ts`: read committed gate records only, check exact candidate/code commits, Lead/status identity, declared producer ancestry and optional public-index hash. Missing/pending/unmerged/malformed records remain blocked. This is coordination evidence, not authority or feature/security acceptance.
- `producer-gates.test.ts`: seven real isolated-Git test cases, including unmerged producer, missing evidence, wrong writer/status, bad SHA/pin and malformed arguments. Existing delivery/ownership tests remain intact.
- `worktree-execution/checkpoints/dependency-audit-reachability-v1.json`: exact locked versions/origins, advisory IDs, upstream availability, limitations, mitigations and unresolved release blockers. No package/lock change or unsafe major upgrade this turn.
- `worktree-execution/launch/sources-media/sources-media-phase-05-v1.draft.json` and `launch/fast-packets/sources-media-phase-05-v1.draft.md`: deliberately non-authorized preparation only. Base/launch/combined producer index remain null. No SourcesMedia worktree/agent started.

## Actual focused checks

All commands ran in the integration worktree with Bun1.4.0.

- `bun test tooling/orchestration`: PASS, 27 tests / 55 assertions, including seven new producer-gate tests.
- `bun --bun run tsc --noEmit -p tooling/tsconfig.json`: PASS.
- `bun --bun run eslint tooling/orchestration --max-warnings=0`: PASS.
- `bun tooling/orchestration/verify-producer-gates.ts c17ef2531904f2d94b39e074677cdd212db7d0cc contracts-ready simulation-ready platform-ready`: expected exit2; contracts-ready passed, both later producer records missing/blocked. It creates no evidence or gate.
- `bun audit --json`: exit1, two unresolved advisories. This is NOT an audit/security pass.
- Registry checks: deepmerge dist-tag latest4.3.1; zod@3 latest3.25.76; @expo/cli58.1.17 requires ^3.25.76. No compatible upstream fix found. No audit ignore, package-cache patch, fork or forced major migration added.
- Initial un-escalated `bun why` diagnostic encountered sandbox EPERM; the permitted escalated read succeeded. No remaining permission blocker or uncertain mutation.

## Audit disposition

[GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5): affected Expo CLI Zod3.25.76, high; patched v4.6.6 is not a compatible substitution for Expo's declared v3 range. Application contracts use fixed4.6.7 and Workers test plugin fixed4.6.6. Dependency origin is not proof that all future browser/native bundles exclude a vulnerable package; inspect exact build outputs at QA.

[GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4): deepmerge4.3.1 via Expo config/Jest, low; upstream advisory lists no patched version. Keep toolchain config/projects trusted and reviewed, do not merge uploaded report/media/model data into tool config, and do not run credential-bearing untrusted builds. This does not waive the finding.

Glob's earlier moderate advisory remains absent after the existing version-scoped14.0.3 override; legacy7 API is retained. SecureCoder extension was unavailable and its skill explicitly required skipping that scanner; primary metadata/lock paths/real audit were used without claiming equivalent scanner coverage.

Both unresolved findings remain QA/release blockers. Current bounded internal implementation proceeds under existing grants; no deployment/model/device or production permission was created.

## SourcesMedia activation barrier

Await exact full SimulationData and SessionPlatform C/R deliveries through parent. Review/merge/recheck and publish actual simulation-ready/platform-ready evidence, freeze C1+producer public ports into a new combined consumer index, then issue a separate valid receipt and metadata-only launch. Draft schema rejection is intentional; do not supply it to an implementation worker as authority.

Existing Hono/contracts/Workers test stack is sufficient to begin the later dependency review; no new external library is justified now. After producer seams freeze, Lead conditionally wires API domain/simulation/fixture workspace links, reviewed export paths and local REPORT_MEDIA/SCENARIO_ASSETS/IMAGES bindings. Never assume sharp/native support or Images entitlement. A mocked transform does not prove safe decode/EXIF strip; unavailable transforms cannot serve raw fallback.

The draft lists actual Hono/DO/R2 authorization, streaming byte caps, JPEG/PNG validation/normalization, scoped normalized digest, quota/idempotency, generation/reset/orphan cleanup and source-evidence boundaries to test. ReviewRewards subtrees/vision/reward/Execute remain outside SourcesMedia.

No active worker source, launch receipt, gate, model config, branch or worktree was changed. Parent retains all fast launch/messaging. Ready to review the next exact submitted deliveries; SourcesMedia activation remains pending producer evidence, not denied authorization.
