# US-26 / K5 Codex evidence index

This index supports [US-26 / K5 in PRD v0.5](../../FloodOps/prd.md). It records repository-backed evidence: 50 pages correspond to committed `plans/reports/worktree-*.md` handoffs, plus two pages for bounded slices recorded only in the amendment/Git history. For report-backed slices, the handoff is the source of truth for exact `source_sha`, `changed_paths`, command results and limitations; matching Lead-authored delivery receipts are linked where present. The report commits on `integration/floodops-application` are dated 2026-10-31.

## Session slices

### Contracts and shared systems

- [ContractsClient M1 cutover v4](contracts-client-m1-cutover-v4.md) · [ContractsClient phase 01 v3](contracts-client-phase-01-v3.md)
- [Design system foundations v1](design-system-foundations-v1.md) · [Design system phase 02 v2](design-system-phase-02-v2.md) · [Design system phase 02 v3](design-system-phase-02-v3.md)
- [SimulationData foundations v1](simulation-data-foundations-v1.md) · [SimulationData phase 03 v2](simulation-data-phase-03-v2.md) · [SimulationData scoped conflict v3](simulation-data-scope-conflict-v3.md) · [SimulationData driver source v4](simulation-data-driver-source-v4.md)
- [SessionPlatform phase 04 v1](session-platform-phase-04-v1.md) · [phase 04 v2](session-platform-phase-04-v2.md) · [phase 04 v3](session-platform-phase-04-v3.md) · [review hooks v5](session-platform-review-hooks-v5.md) · [M1 version v6](session-platform-m1-version-v6.md) · [Reset stream v4](session-platform-reset-stream-v4.md)

### Sources, planning, review and results

- [SourcesMedia domain foundations v1](sources-media-domain-foundations-v1.md) · [phase 05 v2](sources-media-phase-05-v2.md) · [review adapter v3](sources-media-review-adapter-v3.md) · [M1 receipt v4](sources-media-m1-receipt-v4.md) · [demo driver v5](sources-media-demo-driver-v5.md)
- [PlannerSafety domain foundations v1](planner-safety-domain-foundations-v1.md) · [runtime foundations v3](planner-safety-runtime-foundations-v3.md) · [authority correction v2](planner-safety-domain-correction-v2.md) · [deterministic core v4](planner-safety-deterministic-core-v4.md) · [M1 runtime v5](planner-safety-m1-runtime-v5.md)
- [ReviewRewards domain foundations v1](review-rewards-domain-foundations-v1.md) · [runtime foundations v3](review-rewards-runtime-foundations-v3.md) · [domain correction v2](review-rewards-domain-correction-v2.md) · [source compatibility v4](review-rewards-source-compat-v4.md) · [M1 reward v5](review-rewards-m1-reward-v5.md)
- [ResultsEvaluation domain foundations v1](results-evaluation-domain-foundations-v1.md) · [runtime foundations v2](results-evaluation-runtime-foundations-v2.md) · [M1 projections v3](results-evaluation-m1-projections-v3.md)

### Web, native and integration

- [WebConsole screen foundations v1](web-console-screen-foundations-v1.md) · [runtime continuation v2](web-console-runtime-continuation-v2.md) · [media/map v3](web-console-m1-media-map-v3.md) · [M1 wire v4](web-console-m1-wire-v4.md)
- [ExpoMobile screen foundations v1](expo-mobile-screen-foundations-v1.md) · [runtime continuation v2](expo-mobile-runtime-continuation-v2.md) · [native local v3](expo-mobile-native-local-v3.md) · [M1 wire v4](expo-mobile-m1-wire-v4.md)
- [IntegrationLead bootstrap](integration-lead-bootstrap.md) · [delivery verifier v1](integration-lead-delivery-verifier-v1.md) · [sources prerequisites v1](integration-lead-sources-prereqs-v1.md) · [runtime composition v1](integration-lead-runtime-composition-v1.md) · [session Reset/MVP sources v1](integration-lead-session-reset-mvp-sources-v1.md) · [M1 cutover v1](integration-lead-m1-cutover-v1.md) · [M1 HTTP probe v1](integration-lead-m1-http-probe-v1.md) · [independent business runtime v1](integration-lead-independent-business-runtime-v1.md) · [backend compose preflight v1](integration-lead-backend-compose-preflight-v1.md)

### Git/amendment-backed slices

- [Remaining API operations](remaining-five-api-v1.md) — amendment and integration commit; no delivery receipt/handoff is recorded.
- [Cloudflare production deployment and ETag correction](cloudflare-production-deployment-2026-10-31.md) — Git history and root deployment record; no delivery receipt/handoff is recorded.

## Reading the records

Each report-backed page gives the report date, a short agent-action summary, and pointers to exact files/commits/checks and the associated human-decision record when one exists. Commit-only pages identify their Git/amendment sources and mark missing checks or acceptance as `not recorded`. A user-intent quote appears only when an amendment contains `trusted_user_evidence`; otherwise it says `not recorded`. A source report's `code-ready-for-integration` status is not treated as product acceptance.

## What this log does not cover

- Chat turns and prompts that were not preserved in a committed report or an amendment's `trusted_user_evidence` are not included. The repository does not preserve a complete conversation transcript; missing prompt/decision fields remain `not recorded` rather than reconstructed.
- This is not an audit of every tool call, an agent/jailbreak-resistance evaluation, or proof that every command passed. See the linked handoff's exact results and qualifications; do not upgrade blocked, unavailable, partial or unexercised work into a pass.
- The log is not product acceptance for all 41 US, T01–T24, IR-01–IR-12, calibration, real-model quality, native devices, or production readiness. The [roadmap](../../docs/development-roadmap.md) records the current milestone status and evidence boundary.
