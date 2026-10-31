# SourcesMedia independent domain foundations — SourceEvidence

Code ready for integration review for this exact partial work item. This report does not publish sources-ready, phase05 completion, or a new gate.

## Startup and authority
- Sole SourcesMedia writer; own worktree `/Users/vominhlong/seahackathon-worktrees/05-sources-media`, branch `feat/floodops-sources-media`.
- Exact launch `c77d7296fd0b384b1e5f0c9df1bece6a1a8bf142`; BASE `fdb1104cdc7e02aa1da284f405eed56bb010447a`. Lead/parent resumed that exact launch before code.
- Pinned policy at `aea042b5fdb5100e826672111f326d3a03847ee7`, hash `b0aa40dfbdf06eb631670ec8db0108b87e0a41912de59624af84cff9c4d49b1a` verified. Contract index at `3ec303eae32f899edef0909527ca72195fdbff9f`, hash `69cb1d52e620d0bad6e4732c7d73f5e72b58281bf443265cd6fa79cc1e7aa40e` verified.
- All371 indexed artifacts verified as raw bytes at source/index/launch and working tree; base and contracts-ready/simulation-ready/workspace-bootstrap/plan-published commits verified ancestors. Correct clean launch and real worktree checked before mutation.
- Authorized amendment restricts writes to three pure domain directories, two API test directories and this exact report. All25 source/test/doc files pass canonical role and partial-scope matchers; no central/protected/other-owner edit. Every code file is below200 lines. No symlinks, secret/env files or portable-domain runtime/network imports were added.
- Frozen install --ignore-scripts passed with Bun1.4.0,1011 packages; manifest/lock unchanged. Requested sol/ultra/fast runtime metadata is not exposed here and remains unverified.
- Local implementation/tests/signed C then report-only R authorized. No push/deploy/provider/model/account/resource/key/device action authorized or performed; no server started.

## Source and implemented behavior
Source C: `f4806fcec4810fc32c096721a4c59ae5ed58064e`, signed with the existing SSH identity; `git verify-commit` passed. History and configuration preserved.

- Strict common source envelopes validate frozen fixture/source/role and provenance bindings, availability, explicit T0/time ordering, dimension-preserving units and geography. Unknown datum is retained; no rainfall/tide/river-to-street-depth/passability inference. Configured fixture adapters cover weather/tide/river/traffic/camera/driver/community; there is no live connector or arbitrary URL fetch.
- Frozen profile/parameter validation supplies confidence, TTL, location tolerance and reopening authority. Missing/unsupported config fails explicitly. WGS84 mapping uses a deterministic spherical polyline calculation, explicit server tolerance, ambiguity and vehicle checks; no GPS-spoofing or calibrated-survey claim.
- Current evidence is accepted, available, matching segment/vehicle/current epoch and original capture TTL, with exact expiry exclusion. Conflicting current conditions remain unresolved regardless of provider/confidence/recency. Selection without conflict uses high, latest capture, then ID. Closures survive contrary reports and source outage; only scoped/effective/received configured reopening linked to the exact closure lifts one.
- Reconciliation returns all pair projections and derived conflict flags, including expiry. Manual resolution supersedes explicit IDs with audit reason and recomputes all vehicle scopes. Proposals never commit, Execute or award.
- Strict report input binds original participant separately from selected simulated entity; driver/contributor bindings and explicit dispatcher simulation permission are checked. Quick driver works without model; text remains normalizing. Citizen stays pending_review/normalizing, with explicit invalid/expired/future/location/duplicate reasons.
- Submission proposal retains capture epochs for private storage; review must preserve the original authenticated submitter and capture snapshot while checking current reviewer authorization/CAS externally. Fresh manual review can follow an unrelated newer revision; stale async normalization remains a runtime-fenced concern.
- Acceptance derives capture-based TTL/confidence and returns accepted observations/report with award_id:null for atomic ReviewRewards composition. New observations split by vehicle with supplied server-generated IDs, so a bike conflict does not poison a car scope; differing vehicle epochs are supported. Exact redelivery adds no observation or award, including after conflict. Retained capture epochs prevent stale-incident acceptance.

## Actual validation and limitations
- Final focused suite: **51 pass,0 fail,175 assertions across4 files**. Independent read-only reviewer reran the same51 tests successfully. Tests cover strict extra authority fields, unit/datum/time/mapping, configured adapters, freshness/epoch/vehicle, reopening, closure preservation, identity, pending media, duplicate/redelivery, conflict expiry and real multi-vehicle Simulation integration.
- Strict domain and explicit owned-test typechecks passed; scoped ESLint passed; staged whitespace and canonical ownership/partial-scope checks passed. Bounded tester/reviewer/finalization helpers made no edits. Concrete review findings were fixed with behavior regressions.
- Executable smoke ran again at exact source C through public fixture/Simulation entrypoints, with actual pure implementation and injected deterministic entry policy.
- Bun1.4.0 emitted a directory-mismatch diagnostic for --tsconfig-override; focused tests/smoke still exited0 and produced observed results. The scoped test config resolves only the canonical public fixture entrypoint; Lead must add the undeclared API test dependency for default resolution.
- Earlier checks failed before that scoped resolver: missing @floodops/test-fixtures. An initial misplaced Bun preload flag invoked the root test script inadvertently:34passed,3failed (two unresolved-module errors plus the known unrelated bootstrap nosniff-header assertion). No platform/root test was edited or waived. Correctly scoped final checks pass; this is not a full platform/security/E2E gate.
- Legacy preexisting observations spanning vehicles cannot currently represent conflict in only one scope through the frozen Simulation global has_conflict validation. This slice fails that case explicitly with SOURCE_SCOPE_INCOMPATIBLE; new accepted reports split observations to avoid it. Producer correction request is pending SimulationData/Lead and no out-of-scope repair was attempted.
- Media readiness/duplicate information is a trusted injected server assertion, not a byte-processing implementation. The actual API/auth/session fences, R2/Images/normalized-image/digest/async jobs and full sources-ready require a later receipt. Calibration remains incomplete; synthetic media is a procedural PNG, not real photographic or vision-quality evidence.
- A local Codex status-message attempt to the parent cloud thread returned thread-not-found; no status message was delivered by that tool. Platform final notification and this committed report provide the handoff.

## Exact executable smoke result
```json
{
  "dataset": "functional_fixture",
  "calibration": "incomplete",
  "bundle_hash": "42d25cad85adb3e11939b8496469f0b2ba7891003ae89d0be5049dd54fb7ec46",
  "seed_hash": "a5ed2d18708f37f1021225af64236140b32f43d19e902558b2f4bb9ebbdc56c9",
  "config_hash": "2dfe0b778bab983d5621e07e249203e1fbb3db6f849369e560d7abacd9127f38",
  "graph_hash": "a5bf0eb6d7e57bc3f80fd11571cf21d19d870da91d56cac34b62191859f2c86c",
  "initial_status": "pending_review",
  "proposed_status": "accepted",
  "committed_by_proposal": false,
  "captured_epochs": [{"segment_id":"seg_edge27","vehicle_type":"motorbike","knowledge_epoch":1}],
  "award_id": null,
  "branch_operations_unchanged": true,
  "known_bike": {"segment_id":"seg_edge27","vehicle_type":"motorbike","knowledge_epoch":1,"condition":"normal","confidence_band":"low","state":"known","observation_ids":["obs_bike001","obs_sourcessmoke1"],"restriction_ids":[],"expires_sim_minute":6},
  "car_state": "ordinary_unknown",
  "closed_pairs": 6
}
```

## Pending owner actions
- Lead: export @floodops/domain/sources -> ./src/sources/index.ts, /knowledge -> ./src/knowledge/index.ts, /reporting -> ./src/reporting/index.ts in packages/domain/package.json; update protected aggregate only if needed.
- Lead: add @floodops/test-fixtures workspace:* to apps/api devDependencies and frozen lock; current scoped test config aliases only its existing public entrypoint. Default Bun tests cannot resolve the undeclared package without the scoped override.
- Lead -> SimulationData: correct validateKnowledgeProjection to derive conflicts by segment/vehicle/epoch instead of globally rejecting every has_conflict observation for known other-vehicle scopes. New report observations here split per vehicle; preexisting shared mixed-scope inputs currently fail SOURCE_SCOPE_INCOMPATIBLE explicitly.
- Full phase05 continuation requires a new authorized receipt on actual platform-ready: API routes/media/R2/Images/normalized-image+digest/async normalization remain deferred, not covered by this partial delivery.

## Machine-readable SourceEvidence
```json
{
  "work_item_id": "sources-media-domain-foundations-v1",
  "role_id": "sources-media",
  "base_sha": "fdb1104cdc7e02aa1da284f405eed56bb010447a",
  "observed_launch_sha": "c77d7296fd0b384b1e5f0c9df1bece6a1a8bf142",
  "source_sha": "f4806fcec4810fc32c096721a4c59ae5ed58064e",
  "status": "code-ready-for-integration",
  "contract_sha256": "69cb1d52e620d0bad6e4732c7d73f5e72b58281bf443265cd6fa79cc1e7aa40e",
  "policy_sha256": "b0aa40dfbdf06eb631670ec8db0108b87e0a41912de59624af84cff9c4d49b1a",
  "changed_paths": [
    "apps/api/test/observations/current-knowledge.test.ts",
    "apps/api/test/observations/pipeline.test.ts",
    "apps/api/test/observations/report-proposals.test.ts",
    "apps/api/test/sources/normalization.test.ts",
    "apps/api/test/sources/source-pipeline-smoke.ts",
    "apps/api/test/sources/test-context.ts",
    "apps/api/test/sources/test-tsconfig.json",
    "packages/domain/src/knowledge/current-evidence.ts",
    "packages/domain/src/knowledge/derive-current-knowledge.ts",
    "packages/domain/src/knowledge/index.ts",
    "packages/domain/src/knowledge/propose-conflict-resolution.ts",
    "packages/domain/src/knowledge/propose-observation-acceptance.ts",
    "packages/domain/src/knowledge/reconcile-evidence.ts",
    "packages/domain/src/reporting/index.ts",
    "packages/domain/src/reporting/report-identity.ts",
    "packages/domain/src/reporting/report-types.ts",
    "packages/domain/src/reporting/report-validation.ts",
    "packages/domain/src/reporting/submit-report.ts",
    "packages/domain/src/sources/README.md",
    "packages/domain/src/sources/index.ts",
    "packages/domain/src/sources/location.ts",
    "packages/domain/src/sources/normalize-input.ts",
    "packages/domain/src/sources/source-policy.ts",
    "packages/domain/src/sources/source-time.ts",
    "packages/domain/src/sources/source-types.ts",
    "plans/reports/worktree-sources-media-sources-media-domain-foundations-v1.md"
  ],
  "checks": [
    {
      "command": "bun install --frozen-lockfile --ignore-scripts",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/05-sources-media",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-sources-media-sources-media-domain-foundations-v1.md"
    },
    {
      "command": "bun test --tsconfig-override apps/api/test/sources/test-tsconfig.json ./apps/api/test/sources ./apps/api/test/observations",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/05-sources-media",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-sources-media-sources-media-domain-foundations-v1.md"
    },
    {
      "command": "bun --bun run tsc --noEmit -p packages/domain/tsconfig.json",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/05-sources-media",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-sources-media-sources-media-domain-foundations-v1.md"
    },
    {
      "command": "bun --bun run tsc --noEmit -p apps/api/test/sources/test-tsconfig.json",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/05-sources-media",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-sources-media-sources-media-domain-foundations-v1.md"
    },
    {
      "command": "bun --bun run eslint packages/domain/src/sources packages/domain/src/knowledge packages/domain/src/reporting apps/api/test/sources apps/api/test/observations --max-warnings=0",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/05-sources-media",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-sources-media-sources-media-domain-foundations-v1.md"
    },
    {
      "command": "bun --tsconfig-override apps/api/test/sources/test-tsconfig.json apps/api/test/sources/source-pipeline-smoke.ts",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/05-sources-media",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-sources-media-sources-media-domain-foundations-v1.md"
    },
    {
      "command": "git diff --cached --check",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/05-sources-media",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-sources-media-sources-media-domain-foundations-v1.md"
    },
    {
      "command": "git verify-commit f4806fcec4810fc32c096721a4c59ae5ed58064e",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/05-sources-media",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-sources-media-sources-media-domain-foundations-v1.md"
    }
  ],
  "smoke": [
    {
      "scenario": "Canonical frozen synthetic source/report/proposal through actual public Simulation port",
      "observed_result": "Pending before review; proposed accepted report committed:false and award:null; six active closed pairs remain closed, car E27 unknown, bike E27 low/expiry6; frozen hashes and branch operations unchanged.",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-sources-media-sources-media-domain-foundations-v1.md"
    }
  ],
  "public_exports": [
    "packages/domain/src/sources/index.ts: normalizeInput, normalizeMeasurement, resolveReportLocation, distanceToPolyline, simTimestamp, assertMappedTime, sourceFor, profileFor, validateRegistry, SourceDomainError and environment types",
    "packages/domain/src/knowledge/index.ts: deriveCurrentKnowledge, deriveKnowledgeSnapshot, reconcileEvidence, proposeObservationAcceptance, proposeConflictResolution, KnowledgePair, ObservationAcceptanceContext",
    "packages/domain/src/reporting/index.ts: submitReport, proposeReportSubmission, validateReportEvidence, ReportContext, ReporterBinding"
  ],
  "integration_requests": [
    "Lead: export @floodops/domain/sources -> ./src/sources/index.ts, /knowledge -> ./src/knowledge/index.ts, /reporting -> ./src/reporting/index.ts in packages/domain/package.json; update protected aggregate only if needed.",
    "Lead: add @floodops/test-fixtures workspace:* to apps/api devDependencies and frozen lock; current scoped test config aliases only its existing public entrypoint. Default Bun tests cannot resolve the undeclared package without the scoped override.",
    "Lead -> SimulationData: correct validateKnowledgeProjection to derive conflicts by segment/vehicle/epoch instead of globally rejecting every has_conflict observation for known other-vehicle scopes. New report observations here split per vehicle; preexisting shared mixed-scope inputs currently fail SOURCE_SCOPE_INCOMPATIBLE explicitly.",
    "Full phase05 continuation requires a new authorized receipt on actual platform-ready: API routes/media/R2/Images/normalized-image+digest/async normalization remain deferred, not covered by this partial delivery."
  ],
  "blocked_prerequisites": [
    "Full phase05/platform-ready continuation receipt pending; no HTTP/media/Images/normalized-byte/digest implementation authorized in this slice.",
    "Legacy shared multi-vehicle observation with a conflict in only some scopes awaits SimulationData producer correction; guarded with SOURCE_SCOPE_INCOMPATIBLE.",
    "D04/licence/holdout/calibration, real vision/provider, native/device, security/release evidence unavailable and not claimed."
  ],
  "out_of_scope_changes": [],
  "unrequested_remote_actions": false
}
```
