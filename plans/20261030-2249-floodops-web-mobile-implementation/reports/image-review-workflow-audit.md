# US-30 advisory image-review workflow audit

## Result

- **Concrete Critical findings: 0.**
- **Concrete High findings: 0.**
- **Total reportable new-amendment defects: 0.**
- **Overall correctness: correct within this documentation-only, High/Critical review scope.**
- **Confidence: 0.91.**

No evidence-backed High/Critical contradiction was identified in the reviewed US-30 amendment. This verdict concerns the written workflow and integration contracts only; it does not establish application correctness, authorization effectiveness, model quality, or release readiness.

## Scope and method

Read the exact root `AGENTS.md`, PRD US-30/§6.3.1 with surrounding validation/reward context, the complete canonical `specs/ai-assisted-image-review.md`, phases 04/05/07/09/10/11/12, and the relevant operational-limits, concurrency/realtime, API-security, prerequisite, testing, frontend-surface, deployment, producer-interface, ownership and shared-contract documents. Read the image-review role amendments, machine gate definitions, affected task dependencies and execution-wave/config boundaries. Static wire inspection additionally covered the two image-review operations, model/advice/job/state schemas and the `Event.type` addition.

Paths below are relative to this active plan unless prefixed `FloodOps/` (repository-relative). Review was restricted to the labelled image-review amendment and its direct consumers; the excluded application repository and unchanged base-app design were not audited.

## Evidence traced

| Lens | Static evidence and conclusion |
|---|---|
| Manual review remains independent | `FloodOps/prd.md:379–385`; `specs/ai-assisted-image-review.md:55–58,64–65`; `phase-07-review-gaps-rewards.md:38–40`; `phase-09-react-web-console.md:36–39`; `phase-10-expo-mobile-application.md:34–38,57`. Human Accept/Reject has no advice-ID, completed-job or score precondition. Pending/error AI states cannot block it, and a completed human decision invalidates current advice. |
| Score, match and prohibited authority | `specs/ai-assisted-image-review.md:10–25,30–35`; `FloodOps/prd.md:372–384`; `contracts/openapi.json:12908–13062`. The rubric applies to the normalized image supplied to the provider. Four bounded ordinal ratings feed server floor-half-up scoring; the server derives recommendation using the specified precedence. Yes/no/unclear compares the caption with visible content only. Neither score nor recommendation is Observation confidence, calibrated probability, authenticity, passability, acceptance, reward or Execute authority. |
| Null/failure versus genuine zero | `specs/ai-assisted-image-review.md:25,34–36,79–85`; `contracts/openapi.json:13071–13304`; web/native phase references above. Missing advice and failed/superseded jobs carry null results, while a valid all-zero rating vector can yield an actual score of 0. The UI contract does not substitute zero or canned success for unavailable advice. |
| Deadline, crash and supersession | `specs/ai-assisted-image-review.md:47,51–58,82–85`; `specs/concurrency-realtime.md:29–34`; `phase-04-session-runtime-security.md:38–41,56`. Current report/image/context/model/rubric/session/generation/job bindings are checked before paid work and publication. Manual decisions, changed bindings, Reset and expiry supersede old work. The canonical rule explicitly times out only queued/running jobs: completed advice with a still-current binding remains readable after the provider-request deadline. Recovery releases the slot without automatic provider retry. |
| Same-operational-revision producer-to-consumer dispatch | `contracts/openapi.json:11729–11813` includes `image_review_changed`; `phase-04-session-runtime-security.md:38–40` and `worktree-execution/producer-interfaces.md:27` assign dispatcher-only projection. Consuming dispatch is explicit in `specs/concurrency-realtime.md:40–45`, `phase-09-react-web-console.md:37,47` and `phase-10-expo-mobile-application.md:38,48`: refetch using event sequence and current binding rather than discarding equal-revision progress. `specs/web-mobile-feature-surfaces.md` requires the same live-update behavior. No app dispatch implementation was inspected or executed. |
| Paid-call, role and media boundaries | `contracts/openapi.json:3740–3949`; `specs/api-conventions-security.md:19–23,54–69`; `specs/operational-limits.md:28–36`; `phase-05-sources-observations-media.md:34–40,53`. Both new operations are dispatcher-only, POST accepts only an empty object, and the media seam supplies an authorized normalized derivative/digest/readiness rather than caller URLs or raw staging. Explicit requests, idempotent/current-input reuse, per-session call/concurrency/output bounds and account hard-cap/kill-switch prerequisites are stated. These are requirements, not demonstrated enforcement. |
| Privacy, ownership and retention prerequisites | `specs/ai-assisted-image-review.md:53,63–65`; `specs/api-conventions-security.md:55–69`; `specs/decisions-prerequisites.md:27–32`; `phase-12-cloudflare-eas-release.md:33–37,55`; `specs/cloudflare-deployment.md:95`. Live processing requires permitted images, consent and actual provider-account handling/retention evidence; no zero-retention assurance is asserted. Event/log payloads exclude raw images/advice. Media remains session-owned/private, and existing cleanup distinguishes per-session report media from shared immutable fixture assets. |
| Producer and Lead shared-writer boundaries | `specs/ai-assisted-image-review.md:68–73`; `worktree-execution/producer-interfaces.md:23–28`; `worktree-execution/ownership.md:3–30`; affected role prompts and `roles.json:683–733`. ContractsClient publishes wire/provider schemas; SourcesMedia supplies normalized-media access; ReviewRewards owns the isolated service/provider adapter; SessionPlatform owns generic durable hooks. Lead composes central registrations/configuration and publishes baseline amendments. No private PlannerSafety provider dependency or worker authority to edit another owner is introduced. |
| Dependency order and evidence separation | `worktree-execution/roles.json:179–184,228–248,1094–1170`; `implementation-tasks.json:197–260,265–399,450–457`; `specs/testing-strategy.md:47–61,94–95`; `phase-11-verification-acceptance.md:34–41,58`. The review-ready gate explicitly requires backend/provider-boundary proofs, not downstream client/device or live-vision evidence. Backend composition precedes web/native, combined configuration precedes QA, and preview authorization can be granted before QA for evidence collection. IR-02/11 client proof and IR-12 live evaluation remain downstream evidence gates; no new image-review dependency cycle was identified. IR acceptance supplements the existing US/T scope rather than replacing it. |

## Optional suggestions

None. No scope expansion or speculative base-app changes are proposed.

## Static-only limits and unexercised evidence

- No builds, lint, tests, formatters, package installation, Git/history/remote/provider calls, image execution or example-payload execution were performed. The only write was this assigned report.
- The parent validation report records 66 operations / 61 paths / 194 schemas, 46 JSON fixtures and 243 document-level rating/match outcomes. Those figures were read as supplied context, not independently rerun here; they are not application/model/security proofs.
- With Git/history calls excluded, historical preservation and exact diff provenance were not independently verified. Findings screening was restricted to explicit US-30 additions and their directly referenced contracts; this report does not recertify unchanged design.
- No runtime observation establishes manual-review availability during an actual model failure, atomic supersession, persisted crash recovery, paid-call limits, same-revision cache refresh, image normalization/ownership, privacy enforcement or injection resistance.
- Real provider compatibility and permitted human-labelled image evaluation, browser/native interactions, iOS/Android device evidence, actual consent/retention/account terms and authorized deployment/rollback evidence remain to be produced by the assigned implementation/QA/release owners. No enforcement-effectiveness claim is made.
