# ExpoMobile SourceEvidence — screen foundations

Status: **code-ready-for-integration for the exact partial slice**. No full mobile/backend/UI/device/model/release gate is claimed.

- Worktree: `/Users/vominhlong/seahackathon-worktrees/10-expo-mobile`
- Branch: `feat/floodops-expo-mobile`
- Source commit C: `b5e8075206b04530145b2530b235614e0f6d9b7b` (signed; `git verify-commit` reports Good git signature).
- Base: `112d539da6cf36b2b08ff3499b5eb93416a73bb4`; observed launch: `c2216f9610cb7fb6a71279e4357a70896f86fa3c`.
- Receipt: `plans/20261030-2249-floodops-web-mobile-implementation/worktree-execution/launch/expo-mobile/expo-mobile-screen-foundations-v1.json`.
- Contract index: `results-client-partials-v1-index.json` at base; byte-safe verification passed433 raw-byte artifacts at source/index/launch/working tree plus4 required gate ancestors. BASE→launch is7 coordination metadata paths.
- Runtime: Bun1.4.0; own-worktree frozen install `bun install --frozen-lockfile --ignore-scripts` passed1011 installed packages. No lifecycle scripts or manifest/lock edits.
- Actual model/effort/service-tier fields were not exposed to this worker and are unverified; requested parent configuration is not presented as observed runtime evidence.

## Behavior and review

34 source files implement native role workspaces, presentational feature screens/forms, fixed-permission C1 adapters and injected credential/photo/draft ports. Assignment/ETA/points stay server-derived. Operational commands require online/current capability; no command queue exists. Revision mutations and uncertain/stale outcomes require authoritative refresh. Native photo selection/permission denial preserves draft input; no hardware adapter is fabricated. Reset fences in-flight submissions, old query/advice tickets and confirmation scope. Report/advice/current plan pointer bindings also guard same-revision supersession. Approve, Execute, manual review and advisory image score are separate actions.

The native preview is prominently marked “Fixture preview — not connected to live backend”; source never imports preview/test data. Native SVG geometry includes vehicle-specific text/length alternatives. These are real RN feature modules exercised by Jest/RNTL, not device binaries or backend evidence.

Independent read-only reviews covered UI contracts, native safety/correctness, testing/debugging and docs/ownership/delivery. Seven review findings were fixed and regression-tested. Final code review score9.6/10, no remaining critical/high findings within the partial scope. Delivery precheck passed: no central/release/config writes, no generated/staged secrets, code files<200lines. Central plan/phase sync remains Lead-owned.

## Actual checks and limits

- Strict mobile typecheck passed. Full scoped source/preview/test ESLint passed with zero warnings; final changed-components/regression-tests lint also passed.
- Native Jest/RNTL final actual execution: **8 suites,34 tests passed,0 snapshots**,21.739s, exit0.
- The final command appended two intended test paths after array-valued `--modulePaths`; Jest parsed them as module paths and ran all8 suites. The recorded count is the actual full mobile run, not a claimed two-suite selection.
- Default `bun run --cwd apps/mobile test` first hit this host's Watchman socket permission error and produced no usable test count. `--watchman=false` alone exposed mobile-local `@babel/runtime` helper resolution for transformed workspace modules. The explicit own-worktree module path fixed resolution. No source/config change or mocking was used to bypass either failure.
- Public native/C1 synthetic-transport smoke passed. The fixture/data hashes below bind its static input; no random seed or external backend was used.
- Signed source verification passed; staged whitespace check passed. Tool transcript output is summarized here; no independent native/device/model log artifact exists.

### Input/config hashes

```json
{
  "apps/mobile/package.json": "3d925952874f5e230dbe18542505dccea4141c80b17b674ff4f5105a312a817e",
  "apps/mobile/tsconfig.json": "b3ec13e568cb35bf70a2b238ed549cf3cb0abcf445beb1491ba403b5eea3ac1e",
  "bun.lock": "7e631db6bb17bc1cc58640b4d759455bd00ff4d9c2ae442928c1624a8b6c13dd",
  "apps/mobile/preview/fixture-data.ts": "20dc0588a35f5809938f1c366a766c08eb844b65161bd15352f966090b4a4dac",
  "apps/mobile/test/dispatch-fixture.ts": "2b03fced384ef110befef4582af3f2cbdc2e4c6d5af9dfe54c16f1045ad8412c"
}
```

## SourceEvidence

```json
{
  "work_item_id": "expo-mobile-screen-foundations-v1",
  "role_id": "expo-mobile",
  "base_sha": "112d539da6cf36b2b08ff3499b5eb93416a73bb4",
  "observed_launch_sha": "c2216f9610cb7fb6a71279e4357a70896f86fa3c",
  "status": "code-ready-for-integration",
  "contract_sha256": "bf181e09bb24b462d22ca867a61ff42559d59a3b72d55c20222e08a6f234a688",
  "changed_paths": [
    "apps/mobile/README.md",
    "apps/mobile/preview/fixture-data.ts",
    "apps/mobile/preview/native-fixture-preview.tsx",
    "apps/mobile/src/features/driver/driver-screen.tsx",
    "apps/mobile/src/features/operations-map/operations-map.tsx",
    "apps/mobile/src/features/operations-map/overview-screen.tsx",
    "apps/mobile/src/features/planning/plan-screen.tsx",
    "apps/mobile/src/features/reports/image-review-card.tsx",
    "apps/mobile/src/features/reports/image-review-state.ts",
    "apps/mobile/src/features/reports/manual-review-form.tsx",
    "apps/mobile/src/features/reports/own-report-list.tsx",
    "apps/mobile/src/features/reports/report-draft.ts",
    "apps/mobile/src/features/reports/report-form.tsx",
    "apps/mobile/src/features/reports/review-screen.tsx",
    "apps/mobile/src/features/results/results-screen.tsx",
    "apps/mobile/src/features/rewards/contributor-screen.tsx",
    "apps/mobile/src/features/session/workspace-screen.tsx",
    "apps/mobile/src/features/simulation/timeline-screen.tsx",
    "apps/mobile/src/features/sources/sources-screen.tsx",
    "apps/mobile/src/shared/client-failure.ts",
    "apps/mobile/src/shared/native-client.ts",
    "apps/mobile/src/shared/query-state.ts",
    "apps/mobile/src/shared/screen-frame.tsx",
    "apps/mobile/src/shared/session-context.ts",
    "apps/mobile/test/client-failure.test.ts",
    "apps/mobile/test/client-transport-smoke.ts",
    "apps/mobile/test/dispatch-fixture.ts",
    "apps/mobile/test/dispatch-surfaces.test.tsx",
    "apps/mobile/test/native-client.test.ts",
    "apps/mobile/test/query-advice.test.ts",
    "apps/mobile/test/report-form.test.tsx",
    "apps/mobile/test/review-plan.test.tsx",
    "apps/mobile/test/timeline-results.test.tsx",
    "apps/mobile/test/workspaces.test.tsx"
  ],
  "checks": [
    {
      "command": "bun run --cwd apps/mobile typecheck",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/10-expo-mobile",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-expo-mobile-expo-mobile-screen-foundations-v1.md"
    },
    {
      "command": "bun --bun run eslint apps/mobile/src apps/mobile/preview apps/mobile/test --max-warnings=0",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/10-expo-mobile",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-expo-mobile-expo-mobile-screen-foundations-v1.md"
    },
    {
      "command": "bun apps/mobile/test/client-transport-smoke.ts",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/10-expo-mobile",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-expo-mobile-expo-mobile-screen-foundations-v1.md"
    },
    {
      "command": "bun run --cwd apps/mobile test --watchman=false --modulePaths=/Users/vominhlong/seahackathon-worktrees/10-expo-mobile/apps/mobile/node_modules test/report-form.test.tsx test/review-plan.test.tsx",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/10-expo-mobile",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-expo-mobile-expo-mobile-screen-foundations-v1.md"
    },
    {
      "command": "bun --bun run eslint apps/mobile/src/features/reports/report-form.tsx apps/mobile/src/features/reports/manual-review-form.tsx apps/mobile/test/report-form.test.tsx apps/mobile/test/review-plan.test.tsx --max-warnings=0",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/10-expo-mobile",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-expo-mobile-expo-mobile-screen-foundations-v1.md"
    },
    {
      "command": "git diff --cached --check",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/10-expo-mobile",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-expo-mobile-expo-mobile-screen-foundations-v1.md"
    },
    {
      "command": "git verify-commit b5e8075206b04530145b2530b235614e0f6d9b7b",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/10-expo-mobile",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-expo-mobile-expo-mobile-screen-foundations-v1.md"
    }
  ],
  "smoke": [
    {
      "scenario": "Native React Native public feature render/interaction under supplied Expo/Jest/RNTL preset",
      "observed_result": "8 suites / 34 tests passed; zero snapshots; final run21.739s. Driver null ETA and own scope; contributor own status/points; report edit/denial/offline/relink/late Reset; manual review independent of AI; same-revision advice fences; separate Approve/Execute; map/list/source/clock/results surfaces exercised.",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-expo-mobile-expo-mobile-screen-foundations-v1.md"
    },
    {
      "scenario": "Public ApiClient native credential injection -> C1 request/response -> own dashboard -> cancellation using a disclosed synthetic transport",
      "observed_result": "PASS: public native client -> C1 request/response validation -> scoped dashboard -> cancellation; synthetic transport only. Six preview fixtures also parsed through canonical schemas.",
      "result": "pass",
      "evidence_path": "apps/mobile/test/client-transport-smoke.ts"
    },
    {
      "scenario": "Actual native binary/device/backend/model path",
      "observed_result": "Unavailable in this authorized partial; no binary, device, backend E2E or live model call attempted.",
      "result": "unavailable",
      "evidence_path": null
    }
  ],
  "public_exports": [
    "src/shared/session-context.ts: MobileContext, accessReason, commandReason, sameSession, workspaceLinks",
    "src/shared/native-client.ts: NativeCredentialPort, createNativeApi, NativeSessionClient, NativeAccessError",
    "src/shared/query-state.ts: QueryState, initialQuery, reduceQuery",
    "src/shared/client-failure.ts: clientFailure",
    "src/features/session/workspace-screen.tsx: WorkspaceScreen",
    "src/features/driver/driver-screen.tsx: DriverScreen",
    "src/features/rewards/contributor-screen.tsx: ContributorScreen",
    "src/features/reports/report-draft.ts: PhotoPort, DraftPort, ReportDraft, newReportDraft, buildReportInput, draftNeedsRelink, relinkDraft",
    "src/features/reports/report-form.tsx: ReportForm",
    "src/features/reports/image-review-state.ts: AdviceBinding, AdviceView, initialAdvice, beginAdvice, adviceEvent, receiveAdvice",
    "src/features/reports/review-screen.tsx: ReviewScreen; manual-review-form.tsx: ManualReviewForm; image-review-card.tsx: ImageReviewCard",
    "src/features/planning/plan-screen.tsx: PlanScreen",
    "src/features/operations-map/overview-screen.tsx: OverviewScreen; operations-map.tsx: OperationsMap",
    "src/features/sources/sources-screen.tsx: SourcesScreen",
    "src/features/results/results-screen.tsx: ResultsScreen",
    "src/features/simulation/timeline-screen.tsx: TimelineScreen",
    "preview/native-fixture-preview.tsx: NativeFixturePreview (fixture-only; never imported by production)"
  ],
  "integration_requests": [
    "Lead review/merge exact delivery and sync central phase/plan/ledger; do not mark full mobile-ready from this partial.",
    "Lead central Jest configuration should include the mobile-local node_modules module path for transformed workspace Babel helpers; current CLI overrides pass without config changes. This host also requires watchman=false.",
    "Fresh continuation for reviewed Expo Router/app bootstrap, SecureStore credential adapter, photo/file persistence, Metro/runtime/deep links/foreground SSE and actual binary/device wiring.",
    "Consumers must supply current authorized identity/session metadata, plan/job pointer, advice fetch ticket/job/input binding and clockSession. Recreate NativeSessionClient after authoritative refresh; invalidate on Reset/rejoin.",
    "No public contract/UI export or dependency version additions requested by this delivered slice."
  ],
  "blocked_prerequisites": [
    "Full platform/sources/planner/review/backend/ui-libraries predecessor gates are explicitly deferred by amendment.",
    "Actual iOS/Android binary, device installation, screen-reader and cross-client backend E2E evidence pending future authorization/integration.",
    "Real SecureStore/photo/storage adapters and foreground native streaming wiring not implemented in this partial.",
    "D04 calibration, live model evidence and central dependency advisory/release blockers remain unresolved outside this slice."
  ],
  "out_of_scope_changes": [],
  "unrequested_remote_actions": false,
  "source_sha": "b5e8075206b04530145b2530b235614e0f6d9b7b",
  "policy_sha256": "b0aa40dfbdf06eb631670ec8db0108b87e0a41912de59624af84cff9c4d49b1a"
}
```

No out-of-scope writes, credential/env copying, remote push, deployment, prebuild/device action, paid/provider/model/Images call, account/resource/key creation or main promotion occurred. Source C is the parent of the later report-only commit; the enclosing report commit identity is intentionally supplied out of band.
