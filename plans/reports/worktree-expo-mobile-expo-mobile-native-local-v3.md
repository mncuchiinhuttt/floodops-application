# ExpoMobile SourceEvidence — native local v3

Status: **code-ready-for-integration**, functional native scaffold/backend connection scope only. No native device/full business/release gate is claimed.

- Source C `b4738af58323407a149f2fdc8397ae65c2f55c74`, signed and verified Good git signature; worktree `/Users/vominhlong/seahackathon-worktrees/10-expo-mobile`, branch `feat/floodops-expo-mobile`.
- Base `56b1c0fb9f9d61f3a62ac3adc766e7565fec2e09`; observed launch `011c46d970105cd2840c0d0f6412c941223f3a56`; exact native-v3 receipt/amendment `native-priority-local-v1` verified.
- Raw-byte batch preflight passed966 indexed artifacts at source/index/launch (2898hash checks),6gate ancestors, pinned policy/index and metadata-only launch. Previous delivery fast-forwarded preserving history; Bun frozen install --ignore-scripts checked1102installs/1261packages with no dependency changes.
- Policy SHA256 `b0aa40dfbdf06eb631670ec8db0108b87e0a41912de59624af84cff9c4d49b1a`; frozen compatible contract SHA256 `10e11e6e1c6bc4c834ab15a52bc9af82677ac12bffaef28981d03429a10c2b46`. No pending M1v0.5 wire was adopted.
- Actual model/effort/service tier fields are not exposed to this worker; not independently verified.

## Functional fixes and actual behavior

Reused the existing React Native/Expo Router runtime; no rewrite or visual polish. New captures derive ISO time from the authorized configuration T0 + simulation minute, preserving restored capture metadata. Successful typed report receipts now display server ID/status/reason and survive their own revision refresh; duplicate Send is blocked until explicit new report. A saved private draft is loaded before fresh defaults are created, preventing fast configuration reads from hiding an in-flight restored capture. Filesystem queries are independent of server invalidation and stay available offline, with same-owner/session namespace and existing Reset/privacy guards.

The existing production reserve/binary PUT/normalization pipeline was extracted into a portable typed helper and reused by the native ImagePicker/FileSystem adapter. Real Workerd HTTP exercised that exact helper with the approved synthetic PNG, then submitted/read the citizen report. Driver quick reporting also exercised real HTTP. Both returned201 with needs_clarification/NEEDS_CLARIFICATION, accurately shown rather than changed into accepted. Field workspaces can read real own reports separately while missing assignment/points projections remain explicitly unavailable.

Focused tests:5suites36tests passed, then affected3suites4tests passed with the new restore regression (3 overlap). No snapshots. Final strict mobile types and full scoped mobile lint pass. A test query-client cleanup initially left the process open after passing assertions; the harness now unmounts before clearing the client and exits0 without assertion/timeout changes. Read-only review found the restore race, verified its correction and reports no remaining blocking correctness findings in the narrow v3 scope.

## Real startup and device constraints

Actual local API on127.0.0.1:8790 passed canonical-v2 catalog/create/claim/identity/configuration/graph/report/own-report scopes. Native Go-targeted Metro onlocalhost8082 served manifest SDK58.0.0 and the final Android JS bundle with capture/restore source present. A CLI manifest-assets resolution warning appeared when the packager was deliberately stopped; icons/fonts on a phone were not verified. Both owned local servers were stopped. Generated Expo metadata was preserved under ignored `.expo/native-v3-proof/generated`, not committed.

Read-only availability checks: xcode-select points to CommandLineTools; xcrun cannot find simctl; xcodebuild says full Xcode is required. Full Xcode/CoreSimulator/default runtimes were absent. Android adb/emulator/sdkmanager/gradle, SDK roots and Android Studio were absent. No actual phone/Go app was accessed. No SDK/software download, prebuild/native signing/build/EAS/store, account/login, LAN/tunnel/network permission or device action occurred.

All20 versioned native dependencies match Expo58 bundled-native-module versions; no current dependency inherently requires a custom dev client. Official references confirm bundled [SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/), [FileSystem](https://docs.expo.dev/versions/latest/sdk/filesystem/), [ImagePicker](https://docs.expo.dev/versions/latest/sdk/imagepicker/) and [Reanimated](https://docs.expo.dev/versions/latest/sdk/reanimated/). Source does not enable SecureStore biometric requireAuthentication. Matching Expo Go58 must actually exist on the phone; [SDK compatibility/distribution](https://docs.expo.dev/troubleshooting/expo-go-version-mismatch/) and [physical-iOS same-account requirement](https://docs.expo.dev/troubleshooting/expo-go-sign-in-required/) prevent assuming an arbitrary existing iPhone store installation will work. Android’s matching build is selected at [expo.dev/go](https://expo.dev/go). No custom app binary is forced by these MVP modules, but native config-plugin changes still need own-binary evidence.

Verified minimal local Go command from apps/mobile:

```sh
EXPO_NO_TELEMETRY=1 EXPO_OFFLINE=1 node node_modules/expo/bin/cli start --go --localhost --port 8082
```

API URL: `http://127.0.0.1:8790/api/v1`. Phone localhost is not the Mac. Physical use therefore still needs matching Go58 plus separately authorized USB mapping or phone-reachable Metro/HTTPS API; no such connection was enabled here. JS serving and test-only platform ports are not device proof.

## Bound inputs and local bundle

```json
{
  "inputs": {
    "apps/mobile/package.json": "7e9bf31e4b5c6c7e1e19185fa2d506bd6f0c0488749ddabb0b6646a1ad59e5b7",
    "apps/mobile/app.config.ts": "6011b02c743ffae24499aed231904bc59235c59e8e7dcb3eba6f32af7fbeaf8c",
    "apps/mobile/metro.config.cjs": "4e8892054b013a388f4467af42360cc4c19ec36c384c8929d723b1329f0b491b",
    "data/scenarios/functional-v2/manifest.json": "64719ca3cb494d393598aa81e297d1951cd916920328996e56de149907e0be3b",
    "data/scenarios/functional-v2/synthetic-report.png": "1ae5d1b406a5aea5bd6c91a126710100063ad0a96883866c6ced960c3fd027a6"
  },
  "go_manifest": {
    "status": 200,
    "sdkVersion": "58.0.0",
    "apiBaseUrl": "http://127.0.0.1:8790/api/v1",
    "bundleBytes": 11347417,
    "bundleSha256": "0eef47deeba9a6fd74a8f9ffb5cf8e9fb7e816a3f0304bd29ec3acdc54b2f6b0",
    "proof": "actual Go-targeted native JS served; no installed app/device proof"
  }
}
```

## SourceEvidence

```json
{
  "work_item_id": "expo-mobile-native-local-v3",
  "role_id": "expo-mobile",
  "base_sha": "56b1c0fb9f9d61f3a62ac3adc766e7565fec2e09",
  "observed_launch_sha": "011c46d970105cd2840c0d0f6412c941223f3a56",
  "status": "code-ready-for-integration",
  "contract_sha256": "10e11e6e1c6bc4c834ab15a52bc9af82677ac12bffaef28981d03429a10c2b46",
  "changed_paths": [
    "apps/mobile/README.md",
    "apps/mobile/src/features/reports/capture-time.ts",
    "apps/mobile/src/features/reports/data/media-upload.ts",
    "apps/mobile/src/features/reports/data/native-photo-port.ts",
    "apps/mobile/src/features/reports/data/use-private-draft.ts",
    "apps/mobile/src/features/reports/own-reports-screen.tsx",
    "apps/mobile/src/features/reports/report-form.tsx",
    "apps/mobile/src/features/reports/runtime/report-editor.tsx",
    "apps/mobile/src/features/session/runtime/session-surfaces.tsx",
    "apps/mobile/test/capture-time.test.ts",
    "apps/mobile/test/media-http-smoke.ts",
    "apps/mobile/test/private-draft-restore.test.tsx",
    "apps/mobile/test/report-submit-receipt.test.tsx",
    "apps/mobile/test/session-http-smoke.ts",
    "apps/mobile/test/workspaces.test.tsx"
  ],
  "checks": [
    {
      "command": "bun run --cwd apps/mobile typecheck",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/10-expo-mobile",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-expo-mobile-expo-mobile-native-local-v3.md"
    },
    {
      "command": "bun --bun run eslint apps/mobile/src apps/mobile/app apps/mobile/preview apps/mobile/test apps/mobile/app.config.ts apps/mobile/metro.config.cjs --max-warnings=0",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/10-expo-mobile",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-expo-mobile-expo-mobile-native-local-v3.md"
    },
    {
      "command": "bun run --cwd apps/mobile test --runTestsByPath test/capture-time.test.ts test/report-submit-receipt.test.tsx test/report-form.test.tsx test/photo-adapter.test.ts test/workspaces.test.tsx",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/10-expo-mobile",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-expo-mobile-expo-mobile-native-local-v3.md"
    },
    {
      "command": "bun run --cwd apps/mobile test --runTestsByPath test/private-draft-restore.test.tsx test/report-submit-receipt.test.tsx test/capture-time.test.ts",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/10-expo-mobile",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-expo-mobile-expo-mobile-native-local-v3.md"
    },
    {
      "command": "bun apps/mobile/test/session-http-smoke.ts",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/10-expo-mobile",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-expo-mobile-expo-mobile-native-local-v3.md"
    },
    {
      "command": "bun apps/mobile/test/media-http-smoke.ts",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/10-expo-mobile",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-expo-mobile-expo-mobile-native-local-v3.md"
    },
    {
      "command": "EXPO_NO_TELEMETRY=1 EXPO_OFFLINE=1 CI=1 node node_modules/expo/bin/cli start --go --localhost --port 8082 --max-workers 2",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/10-expo-mobile/apps/mobile",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-expo-mobile-expo-mobile-native-local-v3.md"
    },
    {
      "command": "git verify-commit b4738af58323407a149f2fdc8397ae65c2f55c74",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/10-expo-mobile",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-expo-mobile-expo-mobile-native-local-v3.md"
    }
  ],
  "smoke": [
    {
      "scenario": "Focused native capture, submit receipt, private restore, photo pipeline and own-report render regression",
      "observed_result": "5suites36tests passed; later affected3suites4tests passed including the new deferred-restore regression (3 overlap); no snapshots. Strict types and full mobile scoped lint pass. No exhaustive polish/full-repo checks.",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-expo-mobile-expo-mobile-native-local-v3.md"
    },
    {
      "scenario": "Actual local Workerd canonical-v2 native session and quick report",
      "observed_result": "catalog200, create201, identity/rejoin200, driver invitation/claim201, configuration/graph200, report201, own-reports200, driver snapshot403. Report status needs_clarification with NEEDS_CLARIFICATION. Manual review404 not mounted remains explicit.",
      "result": "pass",
      "evidence_path": "apps/mobile/test/session-http-smoke.ts"
    },
    {
      "scenario": "Actual production image-upload helper against local Worker",
      "observed_result": "reserve201 -> binary PUT200 -> normalized ready201 -> citizen report201 -> own-reports200 using permitted canonical-v2 synthetic PNG. Report needs_clarification; no fake acceptance/model result. Test SecurePort and disk fixture bytes are not phone hardware proof.",
      "result": "pass",
      "evidence_path": "apps/mobile/test/media-http-smoke.ts"
    },
    {
      "scenario": "Actual Expo Go-targeted native JS startup on loopback",
      "observed_result": "Go manifest200 SDK58.0.0; Android bundle served with final capture/private-restore source,11347417bytes, SHA256 0eef47deeba9a6fd74a8f9ffb5cf8e9fb7e816a3f0304bd29ec3acdc54b2f6b0. No LAN/tunnel or phone opened.",
      "result": "pass",
      "evidence_path": "apps/mobile/.expo/native-v3-proof/manifest-summary.json"
    },
    {
      "scenario": "Installed simulator/phone native run",
      "observed_result": "Unavailable: no full Xcode/simctl/iOS runtime or Android SDK/adb/emulator found. Existing phone Expo Go SDK/version and connection path are unverified. No install/prebuild/build/EAS/signing/account/network-permission action attempted.",
      "result": "unavailable",
      "evidence_path": "plans/reports/worktree-expo-mobile-expo-mobile-native-local-v3.md"
    }
  ],
  "public_exports": [
    "src/features/reports/capture-time.ts: captureTime authorized T0+simulation-minute defaults",
    "src/features/reports/data/media-upload.ts: uploadReportImage/currentMediaContext/imageContentType; same typed production pipeline used by native file adapter and actual HTTP smoke",
    "src/features/reports/data/use-private-draft.ts: usePrivateDraft/privateDraftKey; filesystem-only cache independent from server event invalidation",
    "src/features/reports/own-reports-screen.tsx: OwnReportsScreen actual authorized own reports when assignment/points projection is unavailable",
    "ReportForm optional createNewDraft and typed Report receipt; duplicate-send guard and existing principal/session/generation fences preserved"
  ],
  "integration_requests": [
    "Merge exact signed delivery and update central ledger; functional scaffold only, no visual polish requested.",
    "Continue native M1 adoption only after Contracts/Lead publish a fresh v0.5 receipt; this delivery stays on pinned compatible session/media/graph/report wire.",
    "Manual review is404; points/planner/assignment projections must remain unavailable until their actual owner composition. Submitted reports currently need clarification; native code displays actual status/reason rather than inventing acceptance.",
    "Fastest phone path is matching SDK58 Expo Go (Android avoids physical-iOS distribution/sign-in constraints) plus an explicitly authorized reachable Metro/API path. Current Mac localhost addresses are not phone localhost; no LAN/tunnel permissions were enabled.",
    "Physical iOS requires matching Go SDK/distribution and same Expo account in Go and CLI per official docs; no login was attempted. Config-plugin permission text/scheme/standalone proof still needs an own binary."
  ],
  "blocked_prerequisites": [
    "No installed native simulator/toolchain found; no actual phone connection/SDK58 Go runtime or authorized USB/LAN/backend HTTPS route verified. Device action is pending prerequisite/authorization, not denied or uncertain.",
    "Backend manual review/planner/reward/assignment acceptance and contract-M1 cutover remain pending their owners. No provider/model/calibration or release gate is claimed."
  ],
  "out_of_scope_changes": [],
  "unrequested_remote_actions": false,
  "source_sha": "b4738af58323407a149f2fdc8397ae65c2f55c74",
  "policy_sha256": "b0aa40dfbdf06eb631670ec8db0108b87e0a41912de59624af84cff9c4d49b1a"
}
```

No central/package/lock/EAS/API/shared contract/UI/policy/gate edits, env/state/node_modules copies, secrets in reports, remote push/main/deploy, paid/provider/model/account/resource/key action occurred. Only the exact report is committed after C; enclosing delivery R is supplied out of band.
