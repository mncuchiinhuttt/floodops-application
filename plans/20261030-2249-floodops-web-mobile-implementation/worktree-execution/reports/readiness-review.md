# Readiness review

Scope: execution-waves.md, worktree-runbook.md, work-items-and-handoff.md, orchestrator.md, producer-interfaces.md, roles.json, handoff-schemas.json, and the main plan Handoff; consumer role prompts and referenced acceptance requirements were traced where needed. Static documentation review only; no application tests, builds, deployments, worktrees, branches, or Git mutations were performed.

## High findings

### 1. Apply the launch-metadata exemption in delivery ownership checks

- Priority: High / P1
- Confidence: 0.99
- Primary location: `plans/20261030-2249-floodops-web-mobile-implementation/worktree-execution/work-items-and-handoff.md:44-45` — Receipt acceptance của Lead.
- Supporting locations: `worktree-execution/work-items-and-handoff.md:9-13`; `worktree-execution/ownership.md:8-13,43-45`; `worktree-execution/roles.json:258-260`.

A normal first worker delivery is rejected by the prescribed ownership check: the Lead records code baseline B, commits the Lead-owned launch receipt as L, and starts the worker at L, but `git diff base_sha...delivery_sha` includes that launch receipt because B precedes L. The matcher assigns the entire `worktree-execution/` subtree to IntegrationLead and rejects central/unrelated paths in a worker delivery, even when the worker changes only its own source. The statement that B→L contains approved metadata and the history-preserving baseline-amendment procedure do not supply an exemption in this acceptance algorithm. Minimal correction: verify the exact Lead-recorded B→L delta separately, then check worker ownership on L→delivery, using the approved launch SHA rather than a worker-selected arbitrary SHA; retain B for contract/gate ancestry and apply the same distinction after an amendment.

### 2. Separate committed delivery evidence from its enclosing commit SHA

- Priority: High / P1
- Confidence: 0.98
- Primary location: `plans/20261030-2249-floodops-web-mobile-implementation/worktree-execution/work-items-and-handoff.md:29-31` — Delivery report format.
- Supporting locations: `worktree-execution/work-items-and-handoff.md:4-6,44-46`; `worktree-execution/worktree-runbook.md:55-57,62-68`; `worktree-execution/handoff-schemas.json:189-192,316-322`.

The delivery side still requires a self-referential commit: the worker must commit its report with the code, the report must contain the exact delivery SHA, and the Lead merges that exact submitted SHA. Writing the previous HEAD names a commit without the new delivery, while inserting the new hash and recommitting changes the hash again; committing a later report that names an earlier code commit also leaves that report outside the prescribed exact merge. The explicit metadata-only solution covers launch receipts only. Minimal correction: commit source C, commit evidence R that references `source_sha=C` without requiring its own `delivery_sha`, and send `delivery_sha=R` out of band for the Lead to record in a later ledger commit and merge; align the report template and DeliveryReceipt schema with those two distinct identities.

### 3. Authorize isolated preview evidence before the production release gate

- Priority: High / P1
- Confidence: 0.98
- Primary location: `plans/20261030-2249-floodops-web-mobile-implementation/worktree-execution/roles.json:979-980` — execution_waves, wave 8 remote_action_requires.
- Supporting locations: `worktree-execution/roles.json:133-137,833-836`; `worktree-execution/execution-waves.md:38`; `specs/testing-strategy.md:65,78`; `specs/cloudflare-deployment.md:187-191`.

The first remote preview cannot legally run under this graph even after explicit preview account permission is supplied: every ReleaseOps remote action and every preview deployment requires `release-authorized`, but that gate requires all release prerequisites and native/model/security acceptance to have passed already. Those referenced requirements include security/load tests restricted to authorized preview, a preview acceptance suite before production, and a rollback drill; ReleaseOps itself must produce preview smoke and rollback evidence. Thus the gate demands evidence from actions that it simultaneously forbids, forcing either a permanent block or a false ready claim. Minimal correction: add an explicitly scoped preview/dev-build authorization usable to collect evidence against isolated nonproduction resources, including during QA when needed; reserve `release-authorized` and its full prerequisite checks for production promotion/store submission. Do not weaken production prerequisites or give the role implicit account permission.

## Verdict

- Overall correctness: incorrect.
- Explanation: The future workflow has two delivery-protocol contradictions and a preview/release authorization cycle. These are documentation readiness blockers, not requests to implement or exercise the application now.
- Overall confidence: 0.98.

## Focused recheck — supersedes the original verdict for F1–F3

This recheck is limited to the three findings above and their propagated producer/consumer instructions. It is a static documentation recheck; no application checks, Git smoke, deployments, account actions, or broad new review were performed.

- **F1 — Resolved.** `work-items-and-handoff.md`, Receipt acceptance steps 1–2, now verifies BASE→observed launch as approved Lead metadata and checks ownership on `observed_launch_sha...delivery_sha`. `ownership.md`, Matcher step 6, and `roles.json`, `ownership_policy.scope_diff_base`, agree. The runbook baseline-amendment step 4 uses NEW_LAUNCH_SHA for the worker contribution, while preserving ancestry and retaining the rejection of worker central-file edits after launch.
- **F2 — Resolved.** `work-items-and-handoff.md`, File authority, Delivery report format, and Receipt acceptance, now separates source C from evidence R and transmits delivery_sha=R only after R exists. `handoff-schemas.json` defines worker SourceEvidence with source_sha and without delivery_sha, while the later Lead-owned DeliveryReceipt contains both identities. The runbook and all 13 role prompt handoffs consume the same protocol; the committed report no longer has to contain its own SHA.
- **F3 — Resolved.** `roles.json` defines preview-authorized independently of qa-ready/calibration-validated and routes preview/development versus production/store actions to separate permission gates. `orchestrator.md`, Emit launch receipts and Merge/build-readiness gates, and `execution-waves.md`, Readiness vs completion, explicitly allow the Lead to operate isolated preview/model/native dev-build evidence collection before final QA instead of waiting for ReleaseOps. LaunchReceipt.remote_authorizations and all role prompts carry explicit scoped grants; production/store/main promotion still require release-authorized and the mandatory evidence.

**Current scoped verdict:** correct for the original F1–F3; all three resolved, zero unresolved. Confidence: 0.98. The earlier incorrect verdict is retained above as historical review context, not an active blocker claim.
