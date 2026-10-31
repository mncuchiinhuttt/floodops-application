# SimulationData scoped conflict correction — SourceEvidence

## Startup acknowledgement
- Work item simulation-data-scope-conflict-v3; implementation correction, sole writer at /Users/vominhlong/seahackathon-worktrees/03-simulation-data on feat/floodops-simulation-data.
- Previous clean signed delivery f327ea3120d00042da62a1a700a784c4aedb594e verified and preserved. Fast-forward merged exact launch123c68b053dab6b4deaa86a7e280c8ed1ebce43a.
- BASE3cebe9e8d8b4fd4fd11cd319b1549952c119caa5; BASE→launch is five Lead launch metadata files only.
- Pinned policy aea042b5fdb5100e826672111f326d3a03847ee7 / b0aa40dfbdf06eb631670ec8db0108b87e0a41912de59624af84cff9c4d49b1a verified.
- Contract index source-platform-ready-v1-index at BASE, SHA256710364ea3b11b6491d60ca256ff3c9c41719c6663ce6e3280bb811e401d9d21b; all425 raw artifact hashes verified at declared commits and launch.
- Required contracts-ready, simulation-ready, workspace-bootstrap, plan-published and platform-ready commits verified ancestors of launch; receipt authorized under full-source-platform-continuation-v1.
- Allowed writes only packages/simulation/src/scenario/validate-knowledge.ts, packages/simulation/README.md, simulation/test/scenario and simulation/test/movement subtrees, and this exact report. Protected central files and all SourcesMedia/domain/fixture implementation excluded.
- Frozen install --ignore-scripts passed (157 packages installed); Bun1.4.0. Actual model/effort/service tier fields unexposed and unverified; requested sol/ultra/fast preserved.
- No remote push/deployment/account/resource/provider/model/device grant or action. No server required. Scoped signed C→report-only R commits authorized.
- Planned checks: actual public deriveKnowledgeSnapshot→loadScenario/applyKnowledgeTransition regressions across motorbike/car/truck, full simulator/fixture unit slice, strict typecheck, focused lint and full scenario CLI smoke. Preserve SourcesMedia fail-closed SOURCE_SCOPE_INCOMPATIBLE guard until its owner receives fresh integrated continuation.
- D04/model/device/application/security/release qualifications remain unchanged; known Expo Zod3/deepmerge advisories are not waived.

## Outcome and source
- Final source C: `07088f2ef5c3a4c140cca5606c6ad9a4e7a2aee8`, signed and verified. Code ready for integration review; no gate self-published.
- Six owned source/doc/test files changed; report R adds only this seventh file. No central/contract/domain/source/fixture data or consumer files edited.
- The production change removes only aggregate `Observation.has_conflict` as the known-state veto. Current observations are still selected from all accepted, fresh evidence matching segment, vehicle and epoch. Their actual conditions determine consistency.
- A shared normal bike/car observation may have global flag true because bike-only evidence contradicts it. Bike remains unresolved; car's normal scope stays known. The aggregate bit is preserved, never rewritten to hide conflict.
- Contradictory current matching conditions remain invalid for known even when flags are false or references omit contrary evidence. Current refs, preferred evidence, TTL/confidence/profile, epoch/vehicle and authoritative closure/reopening checks are unchanged.

## Actual regression evidence
- **122 tests passed,0 failed,5,583 assertions across13 files**: all55 existing simulator/fixture tests plus67 new correction tests.
- Loader matrix covers every nonempty shared/contrary scope combination across motorbike/car/truck (19 combinations), with both vehicle-array orders (38 cases). Outside an observation's vehicle scope remains unknown rather than inheriting evidence.
- Public runtime pipeline covers all seven contrary subsets of a shared three-vehicle observation, both orders (14 cases). Committed operations, route cursors, active service, positions, frozen scenario and time remain unchanged; intentional reroute-only invalidation is verified separately.
- Additional cases cover all-consistent evidence with global flag true; actual contradiction with false flags/omitted references; expiry exactly at boundary; future/pending/rejected/superseded/other-segment/other-epoch observations; unsupported known/conflict/confidence/expiry for every vehicle; closure precedence and forged reopen rejection.
- Actual movement test loads a derived shared-edge scenario: bike conflict blocks entry while consistent car traverses that same edge. This exercises real route/entry guards, not DTO comparison alone.
- Public Source deriveKnowledgeSnapshot is called directly. No private source implementation copied or imported; SourcesMedia reconcileEvidence compatibility guard is unchanged and intentionally tested to fail closed.
- Pre-fix focused public-runtime regression reproduced the exact `Known state lacks consistent current evidence` failure. After the guard fix, twelve new whole-branch assertions initially failed because existing reroute-only invalidation correctly sets needsReroute; assertions now preserve committed-state invariants and explicitly verify that intended flag. No production transition was changed for those assertions.
- Independent bounded reviewer cleared the production change and reran the67 new cases:67pass/604assertions. No remaining findings in this correction review.
- Strict package/test typecheck and scoped lint passed. All new/modified code files are below200 lines; exact amendment scope, realpaths and canonical ownership matcher passed.
- Staged whitespace check initially found one trailing blank line; it was removed and the check passed before the signed source commit. No signing/auth failure or approval denial occurred.

Commands (CWD `/Users/vominhlong/seahackathon-worktrees/03-simulation-data`):

- `bun install --frozen-lockfile --ignore-scripts` — pass.
- `bun test packages/simulation/test packages/test-fixtures/test` — pass.
- `bun --bun run tsc -p packages/simulation/tsconfig.json` — pass.
- `bun --bun run tsc --noEmit --strict --noUncheckedIndexedAccess --moduleResolution Bundler --allowImportingTsExtensions --module ESNext --target ES2022 --skipLibCheck --types bun packages/simulation/test/*/*.ts` — pass.
- `bun --bun run eslint packages/simulation/src packages/simulation/test packages/test-fixtures/test --max-warnings=0` — pass.
- `git diff --cached --check` — pass.
- `git verify-commit 07088f2ef5c3a4c140cca5606c6ad9a4e7a2aee8` — pass.

## Actual scoped smoke at exact source C
```json
{
  "segment": "seg_edge27",
  "states": {
    "motorbike": "unresolved_conflict",
    "car": "known",
    "truck": "known"
  },
  "sharedAggregateFlag": true,
  "consumerGuard": "SOURCE_SCOPE_INCOMPATIBLE",
  "simMinute": 0.1,
  "originalStates": {
    "motorbike": "known",
    "car": "known",
    "truck": "known"
  },
  "committedAssignments": [
    {
      "order": "ord_order1",
      "driver": "drv_moto01",
      "eta": null
    },
    {
      "order": "ord_order2",
      "driver": "drv_auto01",
      "eta": null
    },
    {
      "order": "ord_order3",
      "driver": null,
      "eta": null
    }
  ]
}
```

The original full CLI smoke was also executed at exact C. Its frozen bundle remains
`42d25cad85adb3e11939b8496469f0b2ba7891003ae89d0be5049dd54fb7ec46`; route `seg_edge35,seg_edge33,seg_edge34`, projected/observed
completion5.75, static/FloodOps total-late2/1 and delay21/8 atH20, zero executed violations.
These remain synthetic functional counts, not real efficacy/D04 evidence.

## Unchanged inputs and corrected producer fingerprint
| Path | SHA-256 |
| --- | --- |
| `packages/simulation/src/scenario/validate-knowledge.ts` | `b933d58dd01fbadf27b2956c12b7894ed02415851eb6b3239c81ebeee746b29e` |
| `packages/domain/src/knowledge/reconcile-evidence.ts` | `19e873e53434325f935984affb7a578fe8bd706ba3b3a2eea5a1d51e4604926a` |
| `AGENTS.md` | `b0aa40dfbdf06eb631670ec8db0108b87e0a41912de59624af84cff9c4d49b1a` |
| `bun.lock` | `7e631db6bb17bc1cc58640b4d759455bd00ff4d9c2ae442928c1624a8b6c13dd` |
| `data/scenarios/functional-v1/manifest.json` | `3c14fcd1b67057028997e4d6ca8de6b9bafeaba710adee6b0448ec40e42cb66f` |

The consumer guard hash, policy, lock and frozen data match launch. Only Lead may update the central producer index/launch receipts.
C1 remains66operations/194schemas/8Commander tools; no wire amendment or dependency/export change.

## Integration requests
1. IntegrationLead: verify/merge exact report delivery R and publish the corrected producer artifact fingerprint/qualified gate before any affected consumer adopts it. No wire/API/schema/export-map changes are needed.
2. IntegrationLead: preserve SourcesMedia WIP at a safe checkpoint, then issue a fresh baseline/receipt containing this producer. SourcesMedia alone may remove/adapt SOURCE_SCOPE_INCOMPATIBLE and replace its intentional legacy fail-closed regression with full cross-scope acceptance proof under that continuation.
3. SourcesMedia: rerun legacy shared-observation report acceptance/conflict resolution and current split-per-vehicle paths through the integrated producer. Keep closure/epoch/expiry/vehicle/approval authority unchanged; a global conflict bit is aggregate metadata, not current per-vehicle truth.

## Limitations
- The separately owned reconcileEvidence SOURCE_SCOPE_INCOMPATIBLE guard deliberately remains active; full legacy consumer acceptance and sources-ready wait Lead integration plus a fresh SourcesMedia continuation. No consumer guard or consumer test was edited.
- D04 real source/licence/independent holdout/tolerances, real model/device/application/security/release evidence remain unavailable or owned by later gates. Functional tests and source projection proof do not claim those gates.
- Existing high ExpoCLI Zod3/low deepmerge advisories remain release blockers; no dependency waiver or forced change. Actual requested sol/ultra/fast metadata remains unexposed and unverified.

No owned correction action remains denied, pending permission or uncertain. Consumer continuation is pending Lead integration and reauthorization; this is not an auto-review rejection. No push/main/integration merge/deploy/account/resource/key/provider/model/Images/EAS/device action occurred. The only baseline mutation was the exact authorized fast-forward launch merge, plus frozen script-disabled install and owned local code/checks/signed commits. No secrets or out-of-scope writes were introduced.

## Machine-readable SourceEvidence
```json
{
  "work_item_id": "simulation-data-scope-conflict-v3",
  "role_id": "simulation-data",
  "base_sha": "3cebe9e8d8b4fd4fd11cd319b1549952c119caa5",
  "observed_launch_sha": "123c68b053dab6b4deaa86a7e280c8ed1ebce43a",
  "status": "code-ready-for-integration",
  "contract_sha256": "710364ea3b11b6491d60ca256ff3c9c41719c6663ce6e3280bb811e401d9d21b",
  "changed_paths": [
    "packages/simulation/README.md",
    "packages/simulation/src/scenario/validate-knowledge.ts",
    "packages/simulation/test/movement/scoped-conflict-pipeline.test.ts",
    "packages/simulation/test/scenario/scoped-conflict-smoke.ts",
    "packages/simulation/test/scenario/scoped-conflict.test.ts",
    "packages/simulation/test/scenario/scoped-evidence-context.ts",
    "plans/reports/worktree-simulation-data-simulation-data-scope-conflict-v3.md"
  ],
  "checks": [
    {
      "command": "bun install --frozen-lockfile --ignore-scripts",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/03-simulation-data",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-simulation-data-simulation-data-scope-conflict-v3.md"
    },
    {
      "command": "bun test packages/simulation/test packages/test-fixtures/test",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/03-simulation-data",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-simulation-data-simulation-data-scope-conflict-v3.md"
    },
    {
      "command": "bun --bun run tsc -p packages/simulation/tsconfig.json",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/03-simulation-data",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-simulation-data-simulation-data-scope-conflict-v3.md"
    },
    {
      "command": "bun --bun run tsc --noEmit --strict --noUncheckedIndexedAccess --moduleResolution Bundler --allowImportingTsExtensions --module ESNext --target ES2022 --skipLibCheck --types bun packages/simulation/test/*/*.ts",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/03-simulation-data",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-simulation-data-simulation-data-scope-conflict-v3.md"
    },
    {
      "command": "bun --bun run eslint packages/simulation/src packages/simulation/test packages/test-fixtures/test --max-warnings=0",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/03-simulation-data",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-simulation-data-simulation-data-scope-conflict-v3.md"
    },
    {
      "command": "git diff --cached --check",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/03-simulation-data",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-simulation-data-simulation-data-scope-conflict-v3.md"
    },
    {
      "command": "git verify-commit 07088f2ef5c3a4c140cca5606c6ad9a4e7a2aee8",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/03-simulation-data",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-simulation-data-simulation-data-scope-conflict-v3.md"
    }
  ],
  "smoke": [
    {
      "scenario": "bun packages/simulation/test/scenario/scoped-conflict-smoke.ts",
      "observed_result": "Actual deriveKnowledgeSnapshot\u2192loadScenario\u2192applyKnowledgeTransition keeps bike unresolved_conflict and car/truck known for a shared normal observation plus bike-only contrary evidence; shared has_conflict remains true. Consumer SOURCE_SCOPE_INCOMPATIBLE still fires. No automatic committed assignment/ETA/clock change.",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-simulation-data-simulation-data-scope-conflict-v3.md"
    },
    {
      "scenario": "bun packages/simulation/test/scenario/scenario-smoke.ts",
      "observed_result": "Existing full deterministic CLI remains passing: route35/33/34 projection5.75 equals actual delivery5.75; all branches share H20; zero executed violations; calibration incomplete.",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-simulation-data-simulation-data-scope-conflict-v3.md"
    }
  ],
  "public_exports": [
    "No public signature/export/schema changes. loadScenario and applyKnowledgeTransition now accept consistent scoped projections produced by the existing public @floodops/domain/knowledge deriveKnowledgeSnapshot despite unrelated aggregate has_conflict metadata. Actual matching contradiction, unsupported/fake known projection and closure guards remain fail-closed."
  ],
  "integration_requests": [
    "IntegrationLead: verify/merge exact report delivery R and publish the corrected producer artifact fingerprint/qualified gate before any affected consumer adopts it. No wire/API/schema/export-map changes are needed.",
    "IntegrationLead: preserve SourcesMedia WIP at a safe checkpoint, then issue a fresh baseline/receipt containing this producer. SourcesMedia alone may remove/adapt SOURCE_SCOPE_INCOMPATIBLE and replace its intentional legacy fail-closed regression with full cross-scope acceptance proof under that continuation.",
    "SourcesMedia: rerun legacy shared-observation report acceptance/conflict resolution and current split-per-vehicle paths through the integrated producer. Keep closure/epoch/expiry/vehicle/approval authority unchanged; a global conflict bit is aggregate metadata, not current per-vehicle truth."
  ],
  "blocked_prerequisites": [
    "The separately owned reconcileEvidence SOURCE_SCOPE_INCOMPATIBLE guard deliberately remains active; full legacy consumer acceptance and sources-ready wait Lead integration plus a fresh SourcesMedia continuation. No consumer guard or consumer test was edited.",
    "D04 real source/licence/independent holdout/tolerances, real model/device/application/security/release evidence remain unavailable or owned by later gates. Functional tests and source projection proof do not claim those gates.",
    "Existing high ExpoCLI Zod3/low deepmerge advisories remain release blockers; no dependency waiver or forced change. Actual requested sol/ultra/fast metadata remains unexposed and unverified."
  ],
  "out_of_scope_changes": [],
  "unrequested_remote_actions": false,
  "source_sha": "07088f2ef5c3a4c140cca5606c6ad9a4e7a2aee8",
  "policy_sha256": "b0aa40dfbdf06eb631670ec8db0108b87e0a41912de59624af84cff9c4d49b1a"
}
```
