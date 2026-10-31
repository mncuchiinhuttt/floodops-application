# ContractsClient v3 — source evidence

Status: code-ready-for-integration; IntegrationLead owns the contracts-ready gate.

Source SHA: `8607a6b0b1be10c01c07dd4442a06cb4c5b79ed2`.
Inherited owned WIP checkpoint: `6fc8df9`; preserving-history recovery merge: `a1d7833f9a3afdcda324454cdaae9a98d288924e`. Authorized launch is an ancestor of source.

Implemented the approved 66-operation/194-schema amendment without changing API semantics or the eight Commander tools. Strict schemas enforce all job state/nullability conditions and reject model-derived/authority fields. A separate wire consistency parser checks rubric score/recommendation against the server rubric; it grants no authority and the HTTP client never derives review decisions.

The portable typed client validates request/response/error envelopes, ETag/meta and generation, supports cookie+CSRF/native bearer adapters, bounded GET retries, captured-key explicit command resends, 410/412 recovery and request cancellation. SSE supports UTF-8/chunk/line boundaries, comments/multiline frames, duplicate suppression, filtered cursor pages, gap catch-up, bounded reconnect and role-authorized snapshot refresh. All source modules are below 200 lines.

Canonical source SHA256: `6b0159736ac039e6aafba4a474d14a85e7d0071e16ae56943524aeb7a77deb81`.
Generated public surface SHA256: `7bbd9877286db2263cb8d62e7d27a4a353b8e2fa1bef6c6311781f997e7bcd0e`.
No PRD/schema semantic change from the authorized launch; only JSON numeric formatting normalized in the examples snapshot.

## Verification

All commands below ran in `/Users/vominhlong/seahackathon-worktrees/01-contracts-client` with Bun 1.4.0. Tests/smoke use synthetic fixtures; the canonical-source hash binds those fixtures. No live model calls, device runs, external network, port allocation, deployment or resource creation occurred.

- `bun test packages/contracts/test packages/api-client/test` — 75 pass / 0 fail / 959 assertions; 46 contract + 6 tool examples, 40 lifecycle combinations, 243 rubric/match combinations, HTTP and SSE regressions.
- `bun packages/contracts/scripts/generate.ts --check` — 194 schemas / 66 operations / eight tools; no generated drift.
- `bun run --cwd packages/contracts typecheck` — exit 0.
- `bun run --cwd packages/api-client typecheck` — exit 0.
- `bun --bun run tsc --noEmit --target ES2022 --module ESNext --moduleResolution Bundler --strict --noUncheckedIndexedAccess --verbatimModuleSyntax --resolveJsonModule --skipLibCheck --lib ES2022,DOM --types bun packages/contracts/scripts/generate.ts packages/contracts/scripts/operation-codegen.ts packages/contracts/scripts/schema-codegen.ts packages/contracts/test/contracts.test.ts packages/contracts/test/image-review.test.ts packages/api-client/scripts/smoke.ts packages/api-client/test/http.test.ts packages/api-client/test/fixtures.ts packages/api-client/test/sse-parser.test.ts packages/api-client/test/watch-events.test.ts` — exit 0; includes generator/tests/CLI with Bun types.
- `bun --bun run eslint packages/contracts packages/api-client --max-warnings=0` — exit 0.
- `bun build packages/contracts/src/index.ts packages/api-client/src/index.ts --target browser --splitting --outdir /tmp/floodops-contracts-client-v3-browser` — 389 modules; both portable entrypoints bundle successfully; not a browser interaction test.
- `bun test tooling/import-boundaries.test.ts` — 3 pass / 0 fail.
- `git diff --check` — exit 0.
- `ownership matcher assertOwnedPaths on git diff --name-status -z 1c5ab1a4b5763783a8581068407580d8e60330d7 plus untracked files; realpath and <200-line checks` — 313 paths including own report; no protected/other-owner files or symlink escapes; all TypeScript modules <200 lines.
- `semantic comparison of canonical four JSON artifacts to git show 1c5ab1a4b5763783a8581068407580d8e60330d7:<artifact>` — all four deep-equal approved launch inputs; only numeric float/int formatting in plan examples differs.
- `bun packages/api-client/scripts/smoke.ts` — one POST; running/result=null; one visible Unicode SSE event; hidden cursor advances to 3.

Verification config/source hashes:

- `tsconfig.base.json`: `35aaa42da6a2d83e94626be0879ed09c3c72303cc3816bb3d987cc9bdfaae081`.
- `eslint.config.js`: `4a76e11925903b3935e0a37dd4b71452ea7bf127f43f034629fd34fad1f233ba`.
- `packages/contracts/tsconfig.json`: `8c54795909365fbd546bbc77690f49dd668a8fa12839878a7a770b77b37296fb`.
- `packages/api-client/tsconfig.json`: `8c54795909365fbd546bbc77690f49dd668a8fa12839878a7a770b77b37296fb`.
- `packages/contracts/test/contracts.test.ts`: `5a3cb3e766e6431c64933d0ec28b6d1db72568696a43d9176e8041786dbbaf25`.
- `packages/contracts/test/image-review.test.ts`: `7cd8e931b6dbecd915fab42033abf2180ab19ea5fa1ae9af2a18027ab6131aa1`.
- `packages/api-client/test/http.test.ts`: `34abb226ebf9a75a99e8cc7a1c86457eb6b98074e499b9d0c53941ed7fc0e7c9`.
- `packages/api-client/test/sse-parser.test.ts`: `6928750ef99bb2b170d695c4903a4a7dd47766d5ba582f4fca7df6838264f3e7`.
- `packages/api-client/test/watch-events.test.ts`: `fc7cbcca7aed167dd785698ee6bd9d6fbbc18f3a1b333cd6179b192edba73244`.
- `packages/api-client/test/fixtures.ts`: `bd0c8428feae645d35299d68317530936e4a2f880e817908da8451b87ce9f6b2`.
- `packages/api-client/scripts/smoke.ts`: `d5ba36810c10712e65c11a052c54562ae198750183753f97d6d254a4ffe29cde`.

Independent read-only helper also ran 74-test checkpoint, both package typechecks and scoped lint successfully; it found two SSE regressions which were fixed and tested. Final parent run above is 75 tests/959 assertions after the additional operational-CAS case.

## Limitations and handoff

No blocker remains within ContractsClient scope. These are contract/transport checks and an in-process smoke, not proof of live server authorization, ReviewRewards/DO behavior, actual provider dialect/vision quality, browser interaction, Expo streaming or physical iOS/Android behavior. Backend/service/UI owners must exercise those surfaces. D04/calibration is outside this role.

Central manifests, lockfiles, configs, policy, role/receipt/gate metadata and phase status were not edited. No secrets were included; all credentials in tests are synthetic. Signed own-branch checkpoint/merge/source commits preserve the predecessor work. No push, integration/main promotion, deployment or paid/provider/resource/account actions were performed. Actual runtime model/effort/fast tier metadata remains unavailable and unverified.

## SourceEvidence

```json
{
  "work_item_id": "contracts-client-phase-01-v3",
  "role_id": "contracts-client",
  "base_sha": "5934510f1ed03fea4d6bdaba46a3c01cebe225c7",
  "observed_launch_sha": "1c5ab1a4b5763783a8581068407580d8e60330d7",
  "status": "code-ready-for-integration",
  "contract_sha256": "974903fd7c63ff8bff2a19a8761cdcb9b48557700889e06c6cf4a4eb8ce248d7",
  "source_sha": "8607a6b0b1be10c01c07dd4442a06cb4c5b79ed2",
  "policy_sha256": "b0aa40dfbdf06eb631670ec8db0108b87e0a41912de59624af84cff9c4d49b1a",
  "changed_paths": [
    "packages/api-client/README.md",
    "packages/api-client/scripts/smoke.ts",
    "packages/api-client/src/client.ts",
    "packages/api-client/src/commands/idempotency.ts",
    "packages/api-client/src/events/event-cursor.ts",
    "packages/api-client/src/events/sse-parser.ts",
    "packages/api-client/src/events/watch-events.ts",
    "packages/api-client/src/http/auth.ts",
    "packages/api-client/src/http/errors.ts",
    "packages/api-client/src/http/lifecycle.ts",
    "packages/api-client/src/http/request.ts",
    "packages/api-client/src/http/response.ts",
    "packages/api-client/src/http/retry.ts",
    "packages/api-client/src/http/types.ts",
    "packages/api-client/src/index.ts",
    "packages/api-client/test/fixtures.ts",
    "packages/api-client/test/http.test.ts",
    "packages/api-client/test/sse-parser.test.ts",
    "packages/api-client/test/watch-events.test.ts",
    "packages/contracts/README.md",
    "packages/contracts/contract-surface.json",
    "packages/contracts/definition/contract-definition.json",
    "packages/contracts/scripts/definition-types.ts",
    "packages/contracts/scripts/generate.ts",
    "packages/contracts/scripts/operation-codegen.ts",
    "packages/contracts/scripts/schema-codegen.ts",
    "packages/contracts/src/catalog.ts",
    "packages/contracts/src/generated/image-review-model-output.json",
    "packages/contracts/src/generated/operation-types.ts",
    "packages/contracts/src/generated/operations.ts",
    "packages/contracts/src/generated/operations/advance-simulation.ts",
    "packages/contracts/src/generated/operations/apply-restriction-fixture.ts",
    "packages/contracts/src/generated/operations/cancel-planning-job.ts",
    "packages/contracts/src/generated/operations/claim-session.ts",
    "packages/contracts/src/generated/operations/complete-media-upload.ts",
    "packages/contracts/src/generated/operations/create-evaluation-run.ts",
    "packages/contracts/src/generated/operations/create-invitation.ts",
    "packages/contracts/src/generated/operations/create-planning-job.ts",
    "packages/contracts/src/generated/operations/create-report-image-review.ts",
    "packages/contracts/src/generated/operations/create-session.ts",
    "packages/contracts/src/generated/operations/decide-plan-actions.ts",
    "packages/contracts/src/generated/operations/delete-session.ts",
    "packages/contracts/src/generated/operations/dry-run-plan.ts",
    "packages/contracts/src/generated/operations/execute-plan.ts",
    "packages/contracts/src/generated/operations/get-advance-job.ts",
    "packages/contracts/src/generated/operations/get-coverage.ts",
    "packages/contracts/src/generated/operations/get-evaluation-run.ts",
    "packages/contracts/src/generated/operations/get-events.ts",
    "packages/contracts/src/generated/operations/get-execution.ts",
    "packages/contracts/src/generated/operations/get-fixture-asset.ts",
    "packages/contracts/src/generated/operations/get-health.ts",
    "packages/contracts/src/generated/operations/get-identity.ts",
    "packages/contracts/src/generated/operations/get-impact.ts",
    "packages/contracts/src/generated/operations/get-knowledge.ts",
    "packages/contracts/src/generated/operations/get-media.ts",
    "packages/contracts/src/generated/operations/get-operations.ts",
    "packages/contracts/src/generated/operations/get-own-contributor-dashboard.ts",
    "packages/contracts/src/generated/operations/get-own-driver-dashboard.ts",
    "packages/contracts/src/generated/operations/get-plan.ts",
    "packages/contracts/src/generated/operations/get-planning-job.ts",
    "packages/contracts/src/generated/operations/get-report-image-review.ts",
    "packages/contracts/src/generated/operations/get-report.ts",
    "packages/contracts/src/generated/operations/get-results.ts",
    "packages/contracts/src/generated/operations/get-route.ts",
    "packages/contracts/src/generated/operations/get-scenario.ts",
    "packages/contracts/src/generated/operations/get-session-configuration.ts",
    "packages/contracts/src/generated/operations/get-session-graph.ts",
    "packages/contracts/src/generated/operations/get-session-overview.ts",
    "packages/contracts/src/generated/operations/get-session-snapshot.ts",
    "packages/contracts/src/generated/operations/get-session.ts",
    "packages/contracts/src/generated/operations/get-simulation-clock.ts",
    "packages/contracts/src/generated/operations/get-source.ts",
    "packages/contracts/src/generated/operations/list-awards.ts",
    "packages/contracts/src/generated/operations/list-conflicts.ts",
    "packages/contracts/src/generated/operations/list-gaps.ts",
    "packages/contracts/src/generated/operations/list-incidents.ts",
    "packages/contracts/src/generated/operations/list-notification-previews.ts",
    "packages/contracts/src/generated/operations/list-observations.ts",
    "packages/contracts/src/generated/operations/list-participants.ts",
    "packages/contracts/src/generated/operations/list-plans.ts",
    "packages/contracts/src/generated/operations/list-reports.ts",
    "packages/contracts/src/generated/operations/list-restrictions.ts",
    "packages/contracts/src/generated/operations/list-scenarios.ts",
    "packages/contracts/src/generated/operations/list-source-events.ts",
    "packages/contracts/src/generated/operations/list-sources.ts",
    "packages/contracts/src/generated/operations/logout.ts",
    "packages/contracts/src/generated/operations/replay-source-event.ts",
    "packages/contracts/src/generated/operations/reserve-media-upload.ts",
    "packages/contracts/src/generated/operations/reset-session.ts",
    "packages/contracts/src/generated/operations/resolve-conflict.ts",
    "packages/contracts/src/generated/operations/review-report.ts",
    "packages/contracts/src/generated/operations/revoke-participant.ts",
    "packages/contracts/src/generated/operations/stream-events.ts",
    "packages/contracts/src/generated/operations/submit-report.ts",
    "packages/contracts/src/generated/operations/trigger-incident.ts",
    "packages/contracts/src/generated/operations/upload-media-content.ts",
    "packages/contracts/src/generated/parameters.ts",
    "packages/contracts/src/generated/provider-tools.json",
    "packages/contracts/src/generated/schemas.ts",
    "packages/contracts/src/generated/schemas/action-change.ts",
    "packages/contracts/src/generated/schemas/advance-input.ts",
    "packages/contracts/src/generated/schemas/advance-job-response.ts",
    "packages/contracts/src/generated/schemas/advance-job.ts",
    "packages/contracts/src/generated/schemas/affected-order.ts",
    "packages/contracts/src/generated/schemas/api-error.ts",
    "packages/contracts/src/generated/schemas/approval.ts",
    "packages/contracts/src/generated/schemas/award-list-response.ts",
    "packages/contracts/src/generated/schemas/award-list.ts",
    "packages/contracts/src/generated/schemas/award.ts",
    "packages/contracts/src/generated/schemas/branch-id.ts",
    "packages/contracts/src/generated/schemas/branch-result.ts",
    "packages/contracts/src/generated/schemas/calibration-status.ts",
    "packages/contracts/src/generated/schemas/candidate-assignment.ts",
    "packages/contracts/src/generated/schemas/candidate-input.ts",
    "packages/contracts/src/generated/schemas/capability-revocation-response.ts",
    "packages/contracts/src/generated/schemas/capability-revocation.ts",
    "packages/contracts/src/generated/schemas/citizen-report-input.ts",
    "packages/contracts/src/generated/schemas/claim-input.ts",
    "packages/contracts/src/generated/schemas/condition.ts",
    "packages/contracts/src/generated/schemas/confidence.ts",
    "packages/contracts/src/generated/schemas/conflict-list-response.ts",
    "packages/contracts/src/generated/schemas/conflict-list.ts",
    "packages/contracts/src/generated/schemas/conflict-resolution-input.ts",
    "packages/contracts/src/generated/schemas/conflict-resolution-result-response.ts",
    "packages/contracts/src/generated/schemas/conflict-resolution-result.ts",
    "packages/contracts/src/generated/schemas/conflict.ts",
    "packages/contracts/src/generated/schemas/contributor-dashboard-response.ts",
    "packages/contracts/src/generated/schemas/contributor-dashboard.ts",
    "packages/contracts/src/generated/schemas/coordinate.ts",
    "packages/contracts/src/generated/schemas/coverage-response.ts",
    "packages/contracts/src/generated/schemas/coverage.ts",
    "packages/contracts/src/generated/schemas/create-session-input.ts",
    "packages/contracts/src/generated/schemas/credential-delivery.ts",
    "packages/contracts/src/generated/schemas/cursor-frame.ts",
    "packages/contracts/src/generated/schemas/decision-result-response.ts",
    "packages/contracts/src/generated/schemas/decision-result.ts",
    "packages/contracts/src/generated/schemas/delete-result-response.ts",
    "packages/contracts/src/generated/schemas/delete-result.ts",
    "packages/contracts/src/generated/schemas/dependency-group.ts",
    "packages/contracts/src/generated/schemas/driver-dashboard-response.ts",
    "packages/contracts/src/generated/schemas/driver-dashboard.ts",
    "packages/contracts/src/generated/schemas/driver-position.ts",
    "packages/contracts/src/generated/schemas/driver-report-input.ts",
    "packages/contracts/src/generated/schemas/driver.ts",
    "packages/contracts/src/generated/schemas/dry-run-result-response.ts",
    "packages/contracts/src/generated/schemas/dry-run-result.ts",
    "packages/contracts/src/generated/schemas/error-code.ts",
    "packages/contracts/src/generated/schemas/error-detail.ts",
    "packages/contracts/src/generated/schemas/error-response.ts",
    "packages/contracts/src/generated/schemas/evaluation-input.ts",
    "packages/contracts/src/generated/schemas/evaluation-run-response.ts",
    "packages/contracts/src/generated/schemas/evaluation-run.ts",
    "packages/contracts/src/generated/schemas/evaluation-trial.ts",
    "packages/contracts/src/generated/schemas/event-page-response.ts",
    "packages/contracts/src/generated/schemas/event-page.ts",
    "packages/contracts/src/generated/schemas/event.ts",
    "packages/contracts/src/generated/schemas/execution-response.ts",
    "packages/contracts/src/generated/schemas/execution.ts",
    "packages/contracts/src/generated/schemas/feature-flags.ts",
    "packages/contracts/src/generated/schemas/fixture-asset.ts",
    "packages/contracts/src/generated/schemas/gap-list-response.ts",
    "packages/contracts/src/generated/schemas/gap-list.ts",
    "packages/contracts/src/generated/schemas/gap.ts",
    "packages/contracts/src/generated/schemas/graph-node.ts",
    "packages/contracts/src/generated/schemas/graph-response.ts",
    "packages/contracts/src/generated/schemas/graph.ts",
    "packages/contracts/src/generated/schemas/health-response.ts",
    "packages/contracts/src/generated/schemas/health.ts",
    "packages/contracts/src/generated/schemas/hub.ts",
    "packages/contracts/src/generated/schemas/id.ts",
    "packages/contracts/src/generated/schemas/identity-response.ts",
    "packages/contracts/src/generated/schemas/identity.ts",
    "packages/contracts/src/generated/schemas/image-review-advice.ts",
    "packages/contracts/src/generated/schemas/image-review-job-input.ts",
    "packages/contracts/src/generated/schemas/image-review-job-response.ts",
    "packages/contracts/src/generated/schemas/image-review-job.ts",
    "packages/contracts/src/generated/schemas/image-review-model-output.ts",
    "packages/contracts/src/generated/schemas/image-review-quality-ratings.ts",
    "packages/contracts/src/generated/schemas/image-review-state-response.ts",
    "packages/contracts/src/generated/schemas/image-review-state.ts",
    "packages/contracts/src/generated/schemas/impact-response.ts",
    "packages/contracts/src/generated/schemas/impact.ts",
    "packages/contracts/src/generated/schemas/incident-fixture.ts",
    "packages/contracts/src/generated/schemas/incident-list-response.ts",
    "packages/contracts/src/generated/schemas/incident-list.ts",
    "packages/contracts/src/generated/schemas/incident-response.ts",
    "packages/contracts/src/generated/schemas/incident.ts",
    "packages/contracts/src/generated/schemas/input-event-list-response.ts",
    "packages/contracts/src/generated/schemas/input-event-list.ts",
    "packages/contracts/src/generated/schemas/input-event-response.ts",
    "packages/contracts/src/generated/schemas/input-event.ts",
    "packages/contracts/src/generated/schemas/invite-input.ts",
    "packages/contracts/src/generated/schemas/invite-response.ts",
    "packages/contracts/src/generated/schemas/invite.ts",
    "packages/contracts/src/generated/schemas/knowledge-response.ts",
    "packages/contracts/src/generated/schemas/knowledge.ts",
    "packages/contracts/src/generated/schemas/measurement.ts",
    "packages/contracts/src/generated/schemas/media-response.ts",
    "packages/contracts/src/generated/schemas/media-upload-input.ts",
    "packages/contracts/src/generated/schemas/media-upload-response.ts",
    "packages/contracts/src/generated/schemas/media-upload.ts",
    "packages/contracts/src/generated/schemas/media.ts",
    "packages/contracts/src/generated/schemas/meta.ts",
    "packages/contracts/src/generated/schemas/metrics.ts",
    "packages/contracts/src/generated/schemas/notification-list-response.ts",
    "packages/contracts/src/generated/schemas/notification-list.ts",
    "packages/contracts/src/generated/schemas/notification.ts",
    "packages/contracts/src/generated/schemas/objective.ts",
    "packages/contracts/src/generated/schemas/observation-list-response.ts",
    "packages/contracts/src/generated/schemas/observation-list.ts",
    "packages/contracts/src/generated/schemas/observation.ts",
    "packages/contracts/src/generated/schemas/operational-branch.ts",
    "packages/contracts/src/generated/schemas/operations-response.ts",
    "packages/contracts/src/generated/schemas/operations.ts",
    "packages/contracts/src/generated/schemas/order.ts",
    "packages/contracts/src/generated/schemas/page.ts",
    "packages/contracts/src/generated/schemas/parameter.ts",
    "packages/contracts/src/generated/schemas/participant-list-response.ts",
    "packages/contracts/src/generated/schemas/participant-list.ts",
    "packages/contracts/src/generated/schemas/participant.ts",
    "packages/contracts/src/generated/schemas/permission.ts",
    "packages/contracts/src/generated/schemas/plan-action.ts",
    "packages/contracts/src/generated/schemas/plan-decision-input.ts",
    "packages/contracts/src/generated/schemas/plan-diff-entry.ts",
    "packages/contracts/src/generated/schemas/plan-list-response.ts",
    "packages/contracts/src/generated/schemas/plan-list.ts",
    "packages/contracts/src/generated/schemas/plan-response.ts",
    "packages/contracts/src/generated/schemas/plan.ts",
    "packages/contracts/src/generated/schemas/planning-job-input.ts",
    "packages/contracts/src/generated/schemas/planning-job-response.ts",
    "packages/contracts/src/generated/schemas/planning-job.ts",
    "packages/contracts/src/generated/schemas/policy.ts",
    "packages/contracts/src/generated/schemas/polyline.ts",
    "packages/contracts/src/generated/schemas/provenance-label.ts",
    "packages/contracts/src/generated/schemas/provenance.ts",
    "packages/contracts/src/generated/schemas/quantity.ts",
    "packages/contracts/src/generated/schemas/replay-input.ts",
    "packages/contracts/src/generated/schemas/report-list-response.ts",
    "packages/contracts/src/generated/schemas/report-list.ts",
    "packages/contracts/src/generated/schemas/report-reason.ts",
    "packages/contracts/src/generated/schemas/report-response.ts",
    "packages/contracts/src/generated/schemas/report-review-result-response.ts",
    "packages/contracts/src/generated/schemas/report-review-result.ts",
    "packages/contracts/src/generated/schemas/report.ts",
    "packages/contracts/src/generated/schemas/reset-input.ts",
    "packages/contracts/src/generated/schemas/reset-result-response.ts",
    "packages/contracts/src/generated/schemas/reset-result.ts",
    "packages/contracts/src/generated/schemas/restriction-list-response.ts",
    "packages/contracts/src/generated/schemas/restriction-list.ts",
    "packages/contracts/src/generated/schemas/restriction-response.ts",
    "packages/contracts/src/generated/schemas/restriction.ts",
    "packages/contracts/src/generated/schemas/results-response.ts",
    "packages/contracts/src/generated/schemas/results.ts",
    "packages/contracts/src/generated/schemas/review-input.ts",
    "packages/contracts/src/generated/schemas/road-segment.ts",
    "packages/contracts/src/generated/schemas/role.ts",
    "packages/contracts/src/generated/schemas/route-response.ts",
    "packages/contracts/src/generated/schemas/route.ts",
    "packages/contracts/src/generated/schemas/rule-id.ts",
    "packages/contracts/src/generated/schemas/rule-result.ts",
    "packages/contracts/src/generated/schemas/scenario-config-response.ts",
    "packages/contracts/src/generated/schemas/scenario-config.ts",
    "packages/contracts/src/generated/schemas/scenario-summary-list-response.ts",
    "packages/contracts/src/generated/schemas/scenario-summary-list.ts",
    "packages/contracts/src/generated/schemas/scenario-summary.ts",
    "packages/contracts/src/generated/schemas/scope-pair.ts",
    "packages/contracts/src/generated/schemas/segment-knowledge.ts",
    "packages/contracts/src/generated/schemas/session-created-response.ts",
    "packages/contracts/src/generated/schemas/session-created.ts",
    "packages/contracts/src/generated/schemas/session-meta-response.ts",
    "packages/contracts/src/generated/schemas/session-meta.ts",
    "packages/contracts/src/generated/schemas/session-snapshot-response.ts",
    "packages/contracts/src/generated/schemas/session-snapshot.ts",
    "packages/contracts/src/generated/schemas/sim-minute.ts",
    "packages/contracts/src/generated/schemas/simulation-clock-response.ts",
    "packages/contracts/src/generated/schemas/simulation-clock.ts",
    "packages/contracts/src/generated/schemas/source-fixture.ts",
    "packages/contracts/src/generated/schemas/source-list-response.ts",
    "packages/contracts/src/generated/schemas/source-list.ts",
    "packages/contracts/src/generated/schemas/source-policy-profile.ts",
    "packages/contracts/src/generated/schemas/source-response.ts",
    "packages/contracts/src/generated/schemas/source.ts",
    "packages/contracts/src/generated/schemas/stop-reference.ts",
    "packages/contracts/src/generated/schemas/stop.ts",
    "packages/contracts/src/generated/schemas/submit-report-input.ts",
    "packages/contracts/src/generated/schemas/timestamp.ts",
    "packages/contracts/src/generated/schemas/travel-profile.ts",
    "packages/contracts/src/generated/schemas/trigger-incident-input.ts",
    "packages/contracts/src/generated/schemas/turn-restriction.ts",
    "packages/contracts/src/generated/schemas/upload-completion-input.ts",
    "packages/contracts/src/generated/schemas/vehicle-type.ts",
    "packages/contracts/src/generated/schemas/viewer-overview-response.ts",
    "packages/contracts/src/generated/schemas/viewer-overview.ts",
    "packages/contracts/src/generated/tools.ts",
    "packages/contracts/src/generated/tools/compute-route.ts",
    "packages/contracts/src/generated/tools/draft-customer-notification.ts",
    "packages/contracts/src/generated/tools/get-affected-orders.ts",
    "packages/contracts/src/generated/tools/get-incident-state.ts",
    "packages/contracts/src/generated/tools/propose-assignment-change.ts",
    "packages/contracts/src/generated/tools/propose-order-deferral.ts",
    "packages/contracts/src/generated/tools/record-road-observation.ts",
    "packages/contracts/src/generated/tools/test-reassignment.ts",
    "packages/contracts/src/generated/version.ts",
    "packages/contracts/src/image-review.ts",
    "packages/contracts/src/index.ts",
    "packages/contracts/src/schema-helpers.ts",
    "packages/contracts/src/tool-definitions.ts",
    "packages/contracts/src/transport.ts",
    "packages/contracts/src/validation.ts",
    "packages/contracts/test/contracts.test.ts",
    "packages/contracts/test/image-review.test.ts",
    "plans/20261030-2249-floodops-web-mobile-implementation/contracts/contract-examples.json"
  ],
  "checks": [
    {
      "command": "bun test packages/contracts/test packages/api-client/test",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/01-contracts-client",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-contracts-client-contracts-client-phase-01-v3.md"
    },
    {
      "command": "bun packages/contracts/scripts/generate.ts --check",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/01-contracts-client",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-contracts-client-contracts-client-phase-01-v3.md"
    },
    {
      "command": "bun run --cwd packages/contracts typecheck",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/01-contracts-client",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-contracts-client-contracts-client-phase-01-v3.md"
    },
    {
      "command": "bun run --cwd packages/api-client typecheck",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/01-contracts-client",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-contracts-client-contracts-client-phase-01-v3.md"
    },
    {
      "command": "bun --bun run tsc --noEmit --target ES2022 --module ESNext --moduleResolution Bundler --strict --noUncheckedIndexedAccess --verbatimModuleSyntax --resolveJsonModule --skipLibCheck --lib ES2022,DOM --types bun packages/contracts/scripts/generate.ts packages/contracts/scripts/operation-codegen.ts packages/contracts/scripts/schema-codegen.ts packages/contracts/test/contracts.test.ts packages/contracts/test/image-review.test.ts packages/api-client/scripts/smoke.ts packages/api-client/test/http.test.ts packages/api-client/test/fixtures.ts packages/api-client/test/sse-parser.test.ts packages/api-client/test/watch-events.test.ts",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/01-contracts-client",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-contracts-client-contracts-client-phase-01-v3.md"
    },
    {
      "command": "bun --bun run eslint packages/contracts packages/api-client --max-warnings=0",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/01-contracts-client",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-contracts-client-contracts-client-phase-01-v3.md"
    },
    {
      "command": "bun build packages/contracts/src/index.ts packages/api-client/src/index.ts --target browser --splitting --outdir /tmp/floodops-contracts-client-v3-browser",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/01-contracts-client",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-contracts-client-contracts-client-phase-01-v3.md"
    },
    {
      "command": "bun test tooling/import-boundaries.test.ts",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/01-contracts-client",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-contracts-client-contracts-client-phase-01-v3.md"
    },
    {
      "command": "git diff --check",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/01-contracts-client",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-contracts-client-contracts-client-phase-01-v3.md"
    },
    {
      "command": "ownership matcher assertOwnedPaths on git diff --name-status -z 1c5ab1a4b5763783a8581068407580d8e60330d7 plus untracked files; realpath and <200-line checks",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/01-contracts-client",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-contracts-client-contracts-client-phase-01-v3.md"
    },
    {
      "command": "semantic comparison of canonical four JSON artifacts to git show 1c5ab1a4b5763783a8581068407580d8e60330d7:<artifact>",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/01-contracts-client",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-contracts-client-contracts-client-phase-01-v3.md"
    },
    {
      "command": "bun packages/api-client/scripts/smoke.ts",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/01-contracts-client",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-contracts-client-contracts-client-phase-01-v3.md"
    }
  ],
  "smoke": [
    {
      "scenario": "Portable API-client POST and chunked SSE via deterministic in-process transport",
      "observed_result": "66 operations / 194 schemas / 8 tools; POST 202 running with null result; UTF-8 event delivered once; hidden-only cursor=3",
      "result": "pass",
      "evidence_path": "packages/api-client/scripts/smoke.ts"
    }
  ],
  "public_exports": [
    "@floodops/contracts: 194 named Zod schemas/DTOs, schemas/operations/tools catalogs, OperationInputs/OperationOutputs, validation helpers, ETag/error catalog/recovery, source version/hash",
    "@floodops/contracts: getToolDefinitions, getImageReviewModelOutputSchema, assertStrictToolSchema, UnsupportedToolSchemaError, parseConsistentImageReviewAdvice",
    "@floodops/api-client: ApiClient, typed transport/error/credential options, nativeCredentials, webCredentials, RequestScope, prepared command/key helpers, parseSse, EventCursor, cursorFromSnapshot, watchEvents",
    "packages/contracts/contract-surface.json: generated complete schema/operation/tool inventories and public-entrypoint/model-schema hashes"
  ],
  "integration_requests": [
    "IntegrationLead review and merge the exact submitted delivery, run post-merge affected smoke, then publish contracts-ready gate/frozen consumer index from contract-surface.json.",
    "No dependency/export-map/manifest/lockfile change is required for these packages.",
    "Feature/service owners must authorize on server, derive advice server-side, bind current job/report/digest, and supply browser/Expo/device/backend/model evidence in their phases."
  ],
  "blocked_prerequisites": [],
  "out_of_scope_changes": [],
  "unrequested_remote_actions": false
}
```

## Startup acknowledgement

Role/work item: contracts-client / contracts-client-phase-01-v3; implementation.
CWD: /Users/vominhlong/seahackathon-worktrees/01-contracts-client; branch feat/floodops-contracts-client.
Inherited HEAD 22d7703d52befbb4118622e46685b30d76f0f61e; known owned WIP checkpoint 6fc8df9 before preserving-history merge.
Authorized observed launch: 1c5ab1a4b5763783a8581068407580d8e60330d7; base 5934510f1ed03fea4d6bdaba46a3c01cebe225c7.
Policy aea042b5fdb5100e826672111f326d3a03847ee7 / SHA256 b0aa40dfbdf06eb631670ec8db0108b87e0a41912de59624af84cff9c4d49b1a verified.
Contract vision-review-v1 index at base / SHA256 974903fd7c63ff8bff2a19a8761cdcb9b48557700889e06c6cf4a4eb8ce248d7 and all 13 artifact hashes verified.
Gates plan-published dee4dfb00af173eb3cccc2a0df75e67fa1577734 and workspace-bootstrap aea042b5fdb5100e826672111f326d3a03847ee7 are valid base/launch ancestors. Base→launch contains only seven approved launch metadata files.
Allowed writes: packages/contracts/, packages/api-client/, plan contracts/, this own report; protected central manifests/config/lock excluded. No server required; local package tooling only.
App thread inventory shows no active predecessor; parent explicitly handed over sole writer.
Bun observed 1.4.0. Requested runtime gpt-6.1-sol / ultra / fast; actual model/effort/tier metadata unavailable, unverified.
Planned checks: generated drift/inventory, schema/examples/semantic rubric oracle, HTTP lost-response/CAS/auth/cancellation, SSE framing/cursor/reconnect tests, package typechecks, scoped lint and local HTTP smoke.
Remote push/deployment/provider/device/account actions: none authorized or performed.
