# ExpoMobile SourceEvidence — native runtime continuation v2

Status: **code-ready-for-integration for the authorized runtime/correction slice**. No full mobile/backend/business/device/model/release gate is claimed.

- Worktree `/Users/vominhlong/seahackathon-worktrees/10-expo-mobile`; branch `feat/floodops-expo-mobile`.
- Source commit C: `27e3ba8147536104cf11abd9d1fdbc5aa4a21c32`, signed and verified Good git signature.
- Observed launch `2364a58e271a738790fe2a70fd47f67ad0befb52`; code base `223a58654210e934dfb1eda1092be33a7fdc30fe`.
- Receipt: `worktree-execution/launch/expo-mobile/expo-mobile-runtime-continuation-v2.json`; amendment `backend-repairs-client-runtime-v1` within the active plan.
- Pinned policy hash `b0aa40dfbdf06eb631670ec8db0108b87e0a41912de59624af84cff9c4d49b1a`; contract index hash `bda263b1d21bfa26994d857da94f97b8974a3cfee08059e805e889f765202527`.
- Preflight verified654 raw-byte artifacts at source/index/launch plus all7 declared required gate entries (ui-libraries-ready is repeated in the receipt), metadata-only base→launch and clean existing history. Exact launch fast-forwarded from prior signed delivery; no reset/stash/rebase.
- Bun1.4.0 frozen install --ignore-scripts passed67 new installed packages. Central package/lock/config/EAS/policy/contracts/gates unchanged by worker. Wrangler/Expo used the authorized Node26.8.1 tool exception; API runtime is actual Workerd.
- Actual model/effort/service-tier metadata is not exposed to this worker; parent-requested settings are not claimed as observed runtime evidence.

## Implemented behavior and review

48 owned files connect the actual Expo Router app to native create/claim/secure rejoin and capability workspaces using the shared C1 API. SecureStore fails closed; serialized epoch-guarded writes prevent old joins restoring access after Leave. Live current-context getters, immediate client invalidation and immutable scope cancellation fence principal/Reset/background changes. FileSystem drafts/images are principal/session/generation scoped, immutable and privately retained across interrupted saves. Cross-principal relink is denied synchronously; same-owner old-session captures require explicit review and send. ImagePicker selection and actual JPEG/PNG bytes feed typed reserve/binary upload/completion; only normalized ready IDs enter reports. Authenticated normalized private photos render from principal-scoped local cache.

Read-only TanStack query keys contain principal/session/generation, with no operational mutation registration/persistence/outbox. Foreground SSE/cursor consumes shared client events and uses a polling fallback; reconnect requires identity validation before commands become current. Actual server failures remain visible. Plan UI supports explicitly selected independently eligible dependency closure, current plan/job/revision and hard guards, while the server retains atomic safety authority. Advice binds local observable report input plus server session/report/job/digest/ticket, hides changed input immediately, preserves unrelated revision progress and never turns a null/error result into score0. Manual decisions remain independent.

Independent UI/API audit, native safety review, test/debug verification and docs/ownership review completed. The review found and corrected credential resurrection, post-Leave callback, same-session photo principal, relevant-event advice, cached pointer and immutable cancellation races; regression evidence is in the tests. Final runtime scope review9.6/10 with no remaining critical/high findings. All source files<200lines; largest production file103lines. No direct DOM/web/navigation-package imports or production preview/test imports.

## Actual verification and recovered failures

- Final standard Jest package command: **14 suites /98 tests passed**,0 snapshots,4.31s, exit0. Strict mobile types and full scoped mobile lint passed with0warnings. Central Jest module path/watchman fixes now work without CLI overrides.
- Initial full native run was96/97 with a single5second first description-render timeout, not an assertion failure. Isolated advice suite then passed13/13 in1.593s without timeout changes. After exports quiesced, the frozen aggregate98/98 passed. This history is retained; no test/config weakened.
- Real local Workerd session HTTP passed through NativeSessionService. Its SecurePort is an explicit test adapter, not device Keychain proof. The pinned server has no catalog route:404 remains displayed, while explicit known scenario ID/version is server-validated. Creation/identity/rejoin/invitation/claim/role403 are actual HTTP; snapshot503 CONFIG_INCOMPLETE is preserved. Scenario input is the canonical disclosed synthetic manifest used by this exact local config, Calibration incomplete.
- Initial Wrangler forced under Bun returned503 text explaining unsupported undici forwarding. The owned server was stopped and restarted with the repository-authorized Node exception; actual Workerd then passed. No backend source or contract was changed to bypass it.
- Native iOS/Android final offline exports passed from actual expo-router/entry:2302 and2297modules respectively. Warm transform949ms/729ms. They are debug JS exports with --no-bytecode, not installable binaries, device or screen-reader evidence.
- Actual Metro launched in CI/localhost8082; status200 with exact body `packager-status:running`. The first CLI attempt redundantly combined --offline with --localhost and was rejected before startup; the successful command uses EXPO_OFFLINE=1 plus --localhost. A prior path-only Python patch attempted from apps/mobile instead of repo root wrote nothing and was reapplied correctly before final source freeze.
- Whitespace check and signed C verification passed. Generated bundles/state are ignored local artifacts, not committed source. Both owned local servers were stopped; no other process was touched.

## Input/config and generated local artifact hashes

```json
{
  "source_config_sha256": {
    "apps/mobile/package.json": "7e9bf31e4b5c6c7e1e19185fa2d506bd6f0c0488749ddabb0b6646a1ad59e5b7",
    "apps/mobile/tsconfig.json": "fd4bbeccaac8b57b525c486b082e0f7327bf03db6458393fa87c1d3f71ff38a9",
    "apps/mobile/app.config.ts": "6011b02c743ffae24499aed231904bc59235c59e8e7dcb3eba6f32af7fbeaf8c",
    "apps/mobile/metro.config.cjs": "4e8892054b013a388f4467af42360cc4c19ec36c384c8929d723b1329f0b491b",
    "bun.lock": "51e78190af81387909c19c65adfce6da02b8567778f70a26f78dcce98ee5c1ab",
    "data/scenarios/functional-v1/manifest.json": "3c14fcd1b67057028997e4d6ca8de6b9bafeaba710adee6b0448ec40e42cb66f"
  },
  "generated_local_exports": {
    "apps/mobile/dist/native-ios/metadata.json": {
      "bytes": 1589,
      "sha256": "3d6bdf28935350cf556197421fd849d1cb912add29e23be358165f6c490d8f34"
    },
    "apps/mobile/dist/native-ios/_expo/static/js/ios/entry-451e965949aa152c8f2cc04a94e09d91.js": {
      "bytes": 3702100,
      "sha256": "1df149a3b96084f8fcdbb001d52c75b6970a04e32bc1c439f7a6b27fac6744ee"
    },
    "apps/mobile/dist/native-android/metadata.json": {
      "bytes": 1786,
      "sha256": "c4772f5b9607984703bd1de021c1d811f80ef53ef0efc99c0e13ef46cf07aeef"
    },
    "apps/mobile/dist/native-android/_expo/static/js/android/entry-a55ad4682a9db6837e896e730ae6b871.js": {
      "bytes": 3695164,
      "sha256": "1ffc4e3bafa661235f7b31158fd803f6eeff4d981113f5125c1e01ceea877545"
    }
  }
}
```

## SourceEvidence

```json
{
  "work_item_id": "expo-mobile-runtime-continuation-v2",
  "role_id": "expo-mobile",
  "base_sha": "223a58654210e934dfb1eda1092be33a7fdc30fe",
  "observed_launch_sha": "2364a58e271a738790fe2a70fd47f67ad0befb52",
  "status": "code-ready-for-integration",
  "contract_sha256": "bda263b1d21bfa26994d857da94f97b8974a3cfee08059e805e889f765202527",
  "changed_paths": [
    "apps/mobile/README.md",
    "apps/mobile/app.config.ts",
    "apps/mobile/app/_layout.tsx",
    "apps/mobile/app/index.tsx",
    "apps/mobile/app/sessions/[sessionId]/[workspace].tsx",
    "apps/mobile/app/sessions/[sessionId]/_layout.tsx",
    "apps/mobile/app/sessions/[sessionId]/index.tsx",
    "apps/mobile/app/sessions/[sessionId]/reports/[reportId].tsx",
    "apps/mobile/metro.config.cjs",
    "apps/mobile/preview/native-fixture-preview.tsx",
    "apps/mobile/src/features/planning/group-selection.ts",
    "apps/mobile/src/features/planning/plan-screen.tsx",
    "apps/mobile/src/features/reports/data/file-draft-store.ts",
    "apps/mobile/src/features/reports/data/native-photo-port.ts",
    "apps/mobile/src/features/reports/image-review-state.ts",
    "apps/mobile/src/features/reports/manual-review-form.tsx",
    "apps/mobile/src/features/reports/report-draft.ts",
    "apps/mobile/src/features/reports/report-form.tsx",
    "apps/mobile/src/features/reports/report-input-key.ts",
    "apps/mobile/src/features/reports/review-screen.tsx",
    "apps/mobile/src/features/reports/runtime/private-report-photo.tsx",
    "apps/mobile/src/features/reports/runtime/report-editor.tsx",
    "apps/mobile/src/features/reports/runtime/review-runtime.tsx",
    "apps/mobile/src/features/reports/runtime/use-report-advice.ts",
    "apps/mobile/src/features/session/runtime/join-screen.tsx",
    "apps/mobile/src/features/session/runtime/native-runtime.tsx",
    "apps/mobile/src/features/session/runtime/session-service.ts",
    "apps/mobile/src/features/session/runtime/session-surfaces.tsx",
    "apps/mobile/src/shared/native-client.ts",
    "apps/mobile/src/shared/native/availability.ts",
    "apps/mobile/src/shared/native/credential-vault.ts",
    "apps/mobile/src/shared/native/random-key.ts",
    "apps/mobile/src/shared/native/runtime-resource.tsx",
    "apps/mobile/src/shared/native/secure-store.ts",
    "apps/mobile/src/shared/native/use-native-command.ts",
    "apps/mobile/src/shared/native/use-native-query.ts",
    "apps/mobile/test/adapter-fixtures.ts",
    "apps/mobile/test/advice-input-regressions.test.tsx",
    "apps/mobile/test/file-draft-adapter.test.ts",
    "apps/mobile/test/file-system-test-adapter.ts",
    "apps/mobile/test/group-selection-regressions.test.tsx",
    "apps/mobile/test/native-adapters.test.ts",
    "apps/mobile/test/native-client.test.ts",
    "apps/mobile/test/photo-adapter.test.ts",
    "apps/mobile/test/principal-draft-regressions.test.tsx",
    "apps/mobile/test/query-advice.test.ts",
    "apps/mobile/test/review-plan.test.tsx",
    "apps/mobile/test/session-http-smoke.ts"
  ],
  "checks": [
    {
      "command": "bun run --cwd apps/mobile typecheck",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/10-expo-mobile",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-expo-mobile-expo-mobile-runtime-continuation-v2.md"
    },
    {
      "command": "bun run --cwd apps/mobile test",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/10-expo-mobile",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-expo-mobile-expo-mobile-runtime-continuation-v2.md"
    },
    {
      "command": "bun --bun run eslint apps/mobile/src apps/mobile/app apps/mobile/preview apps/mobile/test apps/mobile/app.config.ts apps/mobile/metro.config.cjs --max-warnings=0",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/10-expo-mobile",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-expo-mobile-expo-mobile-runtime-continuation-v2.md"
    },
    {
      "command": "bun apps/mobile/test/session-http-smoke.ts",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/10-expo-mobile",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-expo-mobile-expo-mobile-runtime-continuation-v2.md"
    },
    {
      "command": "EXPO_NO_TELEMETRY=1 EXPO_OFFLINE=1 node node_modules/expo/bin/cli export --platform ios --no-bytecode --max-workers 2 --output-dir dist/native-ios",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/10-expo-mobile/apps/mobile",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-expo-mobile-expo-mobile-runtime-continuation-v2.md"
    },
    {
      "command": "EXPO_NO_TELEMETRY=1 EXPO_OFFLINE=1 node node_modules/expo/bin/cli export --platform android --no-bytecode --max-workers 2 --output-dir dist/native-android",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/10-expo-mobile/apps/mobile",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-expo-mobile-expo-mobile-runtime-continuation-v2.md"
    },
    {
      "command": "EXPO_NO_TELEMETRY=1 EXPO_OFFLINE=1 CI=1 node node_modules/expo/bin/cli start --localhost --port 8082 --max-workers 2",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/10-expo-mobile/apps/mobile",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-expo-mobile-expo-mobile-runtime-continuation-v2.md"
    },
    {
      "command": "git verify-commit 27e3ba8147536104cf11abd9d1fdbc5aa4a21c32",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/10-expo-mobile",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-expo-mobile-expo-mobile-runtime-continuation-v2.md"
    }
  ],
  "smoke": [
    {
      "scenario": "Final frozen native Jest/RNTL and platform adapter regressions",
      "observed_result": "14 suites /98 tests passed;0 snapshots;4.31s; standard package command, no CLI overrides or timeout changes. Principal mounted rendering, secure persistence/cancellation, private restart/interruptions, normalized upload fences, independent group closures and advice input/tickets covered.",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-expo-mobile-expo-mobile-runtime-continuation-v2.md"
    },
    {
      "scenario": "Real local Node-hosted Workerd HTTP via NativeSessionService and disclosed synthetic SecurePort",
      "observed_result": "Catalog404 observed; explicit canonical synthetic scenario -> native create201 -> persistence/identity200/rejoin -> invitation201/claim201 -> viewer403. Unfinished snapshot503 CONFIG_INCOMPLETE. No credentials printed.",
      "result": "pass",
      "evidence_path": "apps/mobile/test/session-http-smoke.ts"
    },
    {
      "scenario": "Actual Expo Router native JS exports and Metro loopback launch",
      "observed_result": "Final iOS2302modules/Android2297modules exported successfully without bytecode; local Metro8082/status returned200 packager-status:running. Generated artifact hashes recorded below. Both owned servers stopped. No native binary/prebuild/device action.",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-expo-mobile-expo-mobile-runtime-continuation-v2.md"
    },
    {
      "scenario": "Installed native binary / hardware / screen-reader / full business E2E / live model",
      "observed_result": "Unavailable and not claimed; native JS bundles and test-only platform ports do not establish these gates.",
      "result": "unavailable",
      "evidence_path": null
    }
  ],
  "public_exports": [
    "app/_layout.tsx + app/index.tsx + app/sessions/[sessionId]/*: actual Expo Router application entry/routes",
    "src/features/session/runtime/native-runtime.tsx: NativeRuntimeProvider/useNativeRuntime, live context/foreground/cache lifecycle",
    "src/features/session/runtime/session-service.ts: NativeSessionService create/claim/identity/restore/storeReplacement/cancelPending",
    "src/features/session/runtime/session-surfaces.tsx: SessionSurface capability-bound actual API readers/commands",
    "src/shared/native/credential-vault.ts: CredentialVault/SecurePort/CredentialUnavailable; secure-store.ts: createSecureVault",
    "src/shared/native/{availability,random-key,use-native-query,runtime-resource,use-native-command}: native platform/query/command adapters",
    "src/features/reports/data/file-draft-store.ts: createFileDraftPort/retainedDrafts/validateNamespace",
    "src/features/reports/data/native-photo-port.ts: createNativePhotoPort/imageContentType",
    "src/features/reports/runtime/{report-editor,review-runtime,use-report-advice,private-report-photo}: actual filesystem/upload/authorized review routes",
    "src/features/planning/group-selection.ts: groupClosure; PlanScreen explicit selection and current-pointer guards",
    "src/features/reports/report-input-key.ts: reportInputKey (local equality key, not server digest); advice reducer requiredSequence/ticket guard",
    "src/shared/native-client.ts: stable current-context getter, acknowledgeRefresh and immutable scope cancellation"
  ],
  "integration_requests": [
    "Lead merge exact signed delivery; sync central phase/plan/gate ledger only after own review. Do not mark full mobile/backend/device-ready from this runtime slice.",
    "Complete and register real Sources/Planner/Review/Results business routers/views in their authorized owner work. At this pinned server catalog discovery is404 NOT_FOUND; snapshot is503 CONFIG_INCOMPLETE. Native UI exposes these real failures and accepts explicit server-validated scenario input without fixture fallback.",
    "After backend gates publish a fresh continuation and exercise real report->review->status/points plus native Execute->web/driver committed outcomes.",
    "Native hardware/device installation, SecureStore/FileSystem/ImagePicker behavior, approved USB/device access, VoiceOver/TalkBack and release/advisory evidence still require separate authorization and proof. No package/contract/UI export change requested by this delivery.",
    "Cross-participant Reset owner continuity is absent from canonical identity. Do not infer it from same role/bound entity; privately retained old-principal drafts remain inaccessible until verified owner continuity or rejoining that principal."
  ],
  "blocked_prerequisites": [
    "Full business API composition and predecessor acceptance remain pending; observed catalog404 and snapshot503 are preserved, not bypassed.",
    "Actual iOS/Android binary/device/hardware/screen-reader/cross-client business E2E/model/calibration evidence unavailable in this authorized local runtime slice.",
    "Known central dependency advisory and release gates are not waived; no remote/build/device/store grant exists."
  ],
  "out_of_scope_changes": [],
  "unrequested_remote_actions": false,
  "source_sha": "27e3ba8147536104cf11abd9d1fdbc5aa4a21c32",
  "policy_sha256": "b0aa40dfbdf06eb631670ec8db0108b87e0a41912de59624af84cff9c4d49b1a"
}
```

No env/credentials/state/node_modules were copied. No out-of-scope edits, remote push, main promotion, deployment, prebuild/EAS/native signing, device/store, provider/paid/model/Images, account/resource/key action occurred. Git signing was preserved for the required own-branch source/evidence commits. Only the later exact report is written after C; its enclosing delivery identity is supplied out of band.
