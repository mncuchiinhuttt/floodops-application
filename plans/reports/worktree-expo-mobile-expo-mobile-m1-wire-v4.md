# ExpoMobile SourceEvidence — M1 wire v4 / rapid runnable demo

Status: **code-ready-for-integration** for preserved functional native scaffold; no installed-device/full-business/model gate claimed.

Source C `b6c22090be63584371cef317c6dcd608c892dfa8`; signed checkpoint761c706 preserved WIP, signed merge477242c adopted exactlaunch `05ed04bc5655e51e8a25b64eb5685f4a64ae1d5f` withoutreset/stash/rebase; finaldocs/sourceC signed. Base `cf2acdd2f845ea14641544424981760248b4d960`, contract hash `4c0567b8dbb3b5b9fce91bfcf3b1abc82db0dafe20619b4d152b03d0232ca335`, policy `b0aa40dfbdf06eb631670ec8db0108b87e0a41912de59624af84cff9c4d49b1a`. Native-v3 Rb711b4f is now a launch ancestor, fixing the prior report-scope blocker. Current launch→C delta is21 owned mobile files; the historical v3 report is not a new change.

## Functional native delivery

Reused actual ExpoRouter/ReactNative/SecureStore/FileSystem/photo/TanStack/foregroundSSE runtime. M1 report feedback displays exact reward state/reason, immutable receipt policy, review ID/time; no fabricated zero-point awards. Manual Reject supports needs_clarification, Accept needs a pending report plus explicit observed condition and stays independent of photoAI/reward configuration. Deterministic planner request uses existing auth/CAS/idempotency, shows algorithm/config/search limit and typed failures; newer same-revision jobs fence prior proposals. Assignment/ETA remains committed-server data after Execute. Malformed mutation responses fence another command until authoritative refresh/inspection and preserve private draft input. Fixtures/tests now match exact M1 fields; photoAI job fields remain unchanged. No polish or new product features.

## Evidence and current usable runtime

39 distinct related tests passed before the freshmerge (37+2new, see commands below); checked those source/test/fixture bytes unchanged afterward. Fresh strict types pass; scoped lint passes. New shared contracts/client/package manifests are unchanged versus the already tested M1 snapshot. Real production native API adapter gets health200/catalog200 from Lead8760, no new actors/grants. Actual SDK58 native bundle aftermerge: `11494923` bytes, SHA256 `6699470fe883ab0b208d4320691e609d70889b726eb62dc0e904cdc80408d26f`; served HTTP200 with API8760 and final reward/planner/error code present. CLI emitted a manifest-assets resolution warning on deliberate localhost shutdown; phone icons/fonts are not verified. JS/Metro is not physical-device proof.

After the latest explicit user request, "mở expo rồi tui connect vào bằng đt", local WiFi LAN startup was authorized. Old localhost Metro exited0; old owned API exited130; ports checked free. Current owned Metro exec75121 remains running at **exp://192.168.225.123:8082**, terminal QR available; separate owned API exec29137 remains running bound specifically to **192.168.225.123:8790** using own isolated apps/mobile/.wrangler/phone-lan-demo. Temporary8791 server was stopped/exit130 before switch. Public LAN health/catalog200 and LAN manifest200 verified from Mac. Lead5170/8760 were not stopped or changed. QR PNG is apps/mobile/.expo/phone-lan-proof/expo-go-qr.png; open_in_codex returnedqueued for this hiddenthread, and QR also rendered in tool output. No public tunnel, firewall/account/key/install/provider action.

**Phone backend is still blocked:** strict app.config + shared APIclient only permit HTTPS/loopback HTTP. Current Expo manifest therefore retains http://127.0.0.1:8760/api/v1, which is phone-local on a phone. Need Lead's exact public development-only LAN-origin option before setting the app to http://192.168.225.123:8790/api/v1. No guard bypass or misleading backend-connected claim. SameWiFi + actual SDK58 Go/device connection remain operator prerequisites. Nothing observed here proves a phone installed/ran the app.

Current running command (from apps/mobile; backend on phone pending the option above):

```sh
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.225.123 EXPO_PUBLIC_FLOODOPS_API_BASE_URL=http://127.0.0.1:8760/api/v1 EXPO_NO_TELEMETRY=1 EXPO_OFFLINE=1 node node_modules/expo/bin/cli start --go --lan --port 8082
```

Loopback-only command for Mac local verification is the same with --localhost and without REACT_NATIVE_PACKAGER_HOSTNAME. No dependency install is needed to run the supplied Metro runtime. No new invitation/session/provider calls were made by this continuation. Previously recorded session/media probes are historical and were not rerun against the shared Lead server. Device, actual photo-model, full66/business/calibration/release gates are not claimed. Exact model/service tier is not exposed to this worker for independent attestation.

## SourceEvidence

```json
{
  "work_item_id": "expo-mobile-m1-wire-v4",
  "role_id": "expo-mobile",
  "base_sha": "cf2acdd2f845ea14641544424981760248b4d960",
  "observed_launch_sha": "05ed04bc5655e51e8a25b64eb5685f4a64ae1d5f",
  "status": "code-ready-for-integration",
  "contract_sha256": "4c0567b8dbb3b5b9fce91bfcf3b1abc82db0dafe20619b4d152b03d0232ca335",
  "changed_paths": [
    "apps/mobile/README.md",
    "apps/mobile/preview/fixture-data.ts",
    "apps/mobile/src/features/planning/plan-screen.tsx",
    "apps/mobile/src/features/planning/planning-job-status.tsx",
    "apps/mobile/src/features/reports/manual-review-form.tsx",
    "apps/mobile/src/features/reports/own-report-list.tsx",
    "apps/mobile/src/features/reports/report-form.tsx",
    "apps/mobile/src/features/reports/report-reward-feedback.tsx",
    "apps/mobile/src/features/reports/review-screen.tsx",
    "apps/mobile/src/features/reports/runtime/review-runtime.tsx",
    "apps/mobile/src/features/rewards/contributor-screen.tsx",
    "apps/mobile/src/features/session/runtime/session-surfaces.tsx",
    "apps/mobile/src/shared/client-failure.ts",
    "apps/mobile/src/shared/native-client.ts",
    "apps/mobile/test/m1-feedback.test.tsx",
    "apps/mobile/test/m1-http-probe.ts",
    "apps/mobile/test/media-http-smoke.ts",
    "apps/mobile/test/native-client.test.ts",
    "apps/mobile/test/report-submit-receipt.test.tsx",
    "apps/mobile/test/review-plan.test.tsx",
    "apps/mobile/test/session-http-smoke.ts"
  ],
  "checks": [
    {
      "command": "python3 /tmp/expo-rapid-preflight.py",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/10-expo-mobile",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-expo-mobile-expo-mobile-m1-wire-v4.md"
    },
    {
      "command": "bun run --cwd apps/mobile test --runTestsByPath test/m1-feedback.test.tsx test/review-plan.test.tsx test/native-client.test.ts test/report-submit-receipt.test.tsx test/workspaces.test.tsx test/group-selection-regressions.test.tsx test/private-draft-restore.test.tsx",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/10-expo-mobile",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-expo-mobile-expo-mobile-m1-wire-v4.md"
    },
    {
      "command": "bun run --cwd apps/mobile test --runTestsByPath test/m1-feedback.test.tsx --testNamePattern='deterministic PLANNER_TIMEOUT|a newer same-revision'",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/10-expo-mobile",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-expo-mobile-expo-mobile-m1-wire-v4.md"
    },
    {
      "command": "bun run --cwd apps/mobile typecheck",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/10-expo-mobile",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-expo-mobile-expo-mobile-m1-wire-v4.md"
    },
    {
      "command": "bun --bun run eslint apps/mobile/src apps/mobile/app apps/mobile/preview apps/mobile/test apps/mobile/app.config.ts apps/mobile/metro.config.cjs --max-warnings=0",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/10-expo-mobile",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-expo-mobile-expo-mobile-m1-wire-v4.md"
    },
    {
      "command": "bun /tmp/expo-rapid-catalog.ts",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/10-expo-mobile",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-expo-mobile-expo-mobile-m1-wire-v4.md"
    },
    {
      "command": "EXPO_PUBLIC_FLOODOPS_API_BASE_URL=http://127.0.0.1:8760/api/v1 EXPO_NO_TELEMETRY=1 EXPO_OFFLINE=1 node node_modules/expo/bin/cli start --go --localhost --port 8082",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/10-expo-mobile/apps/mobile",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-expo-mobile-expo-mobile-m1-wire-v4.md"
    },
    {
      "command": "git diff --exit-code 761c706 HEAD -- apps/mobile/src apps/mobile/test apps/mobile/preview",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/10-expo-mobile",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-expo-mobile-expo-mobile-m1-wire-v4.md"
    },
    {
      "command": "git diff --check",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/10-expo-mobile",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-expo-mobile-expo-mobile-m1-wire-v4.md"
    }
  ],
  "smoke": [
    {
      "scenario": "Native API adapter to connected Lead backend",
      "observed_result": "getHealth200/listScenarios200 with pinned functional-v2 catalog; unauthenticated GET only; no session/invitation/access-grant mutation. Lead-owned8760/5170 untouched.",
      "result": "pass",
      "evidence_path": "Worker tool output; /tmp/expo-rapid-catalog.ts"
    },
    {
      "scenario": "Actual native Go startup/bundle after freshmerge",
      "observed_result": "{\"status\": 200, \"sdkVersion\": \"58.0.0\", \"apiBaseUrl\": \"http://127.0.0.1:8760/api/v1\", \"bundleBytes\": 11494923, \"bundleSha256\": \"6699470fe883ab0b208d4320691e609d70889b726eb62dc0e904cdc80408d26f\", \"proof\": \"actual Go-targeted Android native JS served; M1 feedback/planner/error code present; no device proof\"}",
      "result": "pass",
      "evidence_path": "apps/mobile/.expo/rapid-demo-proof/summary.json (ignored local build evidence)"
    },
    {
      "scenario": "Authorized local-WiFi phone connection servers/QR",
      "observed_result": "Expo Go LAN exp://192.168.225.123:8082 is running with terminalQR; separate WiFi-bound API192.168.225.123:8790 health/catalog200. QR PNG generated/open queued in Codex. API config in current app remains loopback8760 pending explicit shared-client LAN-development support; this is NOT a completed phone/backend flow.",
      "result": "pass",
      "evidence_path": "apps/mobile/.expo/phone-lan-proof/summary.json and expo-go-qr.png (ignored)"
    }
  ],
  "public_exports": [],
  "integration_requests": [
    "Merge exact signed source C and directreportR through normal verifier; no central dependency/schema change requested for completed M1 scaffold.",
    "PHONE BACKEND UNBLOCK: Lead/ContractsClient owns packages/api-client/src/http/request.ts validateBaseUrl and ClientOptions: current HTTP gate accepts127.0.0.1 only. Need explicit development-only opt-in for authorized exact private LAN origin http://192.168.225.123:8790, preserving default HTTPS/loopback validation and auth/privacy; return exact public option/API and authorized baseline. Then ExpoMobile can consume that public option and allow the same explicit origin in owned apps/mobile/app.config.ts. Do not use transport rewriting or disable guards to evade policy."
  ],
  "blocked_prerequisites": [
    "Actual phone/backend flow pending native app-config + shared-client explicit LAN development origin support. Metro is scannable now but current manifest API URL is127.0.0.1:8760, which points to the phone on a phone. LAN API8790 is ready; no fake connected-backend claim.",
    "No phone/device connection observed or independently verified. Operator needs ExpoGo supporting SDK58 on sameWiFi; installed-binary/hardware/accessibility proof remains unavailable. CLT-only Mac still lacks Xcode/simctl/AndroidSDK/adb; no installation/EAS/signing/permission/tunnel change performed.",
    "Authenticated fullchain is Lead-reported and not rerun by this continuation, which forbids new invitations/access grants. Prior c30 Source report422 evidence is historical, not a claim current integrated backend still fails. Driverpending-manual fix is parent-owned pending integration."
  ],
  "out_of_scope_changes": [],
  "unrequested_remote_actions": false,
  "source_sha": "b6c22090be63584371cef317c6dcd608c892dfa8",
  "policy_sha256": "b0aa40dfbdf06eb631670ec8db0108b87e0a41912de59624af84cff9c4d49b1a"
}
```

Only this exact SourceEvidence report is committed after C. The enclosing delivery R is supplied out of band; no central/config/manifest/lock/shared-schema/API-owner edits, credential/env/state/node_modules copy, remote push/main/deploy or paid call occurred. Generated CLI metadata was preserved under ignored .expo paths and is not committed.
