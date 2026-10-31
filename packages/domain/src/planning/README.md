# Pure planning foundations

Work items: planner-safety-domain-foundations-v1 and planner-safety-domain-correction-v2. This module is a deterministic proposal evaluator,
not a dispatcher authorization boundary or durable Executor.

Public entrypoint: `@floodops/domain/planning` (`packages/domain/src/planning/index.ts`).

- `checkProposalIdentity(plan, current)` compares session, generation, revision and both latest IDs.
- `evaluateRoadEntry(input)` checks canonical vehicle/epoch knowledge, expiry, hard rules and
  exact server-owned action+plan+revision decisions. A successful soft decision remains uncertain.
- `createCurrentPolicy(run, committedPolicy)` preserves captured hard/conflict/expiry/epoch guards,
  then delegates branch/driver-specific committed entry grants. It reads no proposal identity/approval.
- `createPlanningPolicy(run, authority, actionIdsByDriver, currentPolicy, allowPending?, observe?)`
  applies proposal authority only to selected physical-action drivers in FloodOps. Other branches and
  untouched FloodOps drivers delegate to currentPolicy before any proposal identity/approval check.
  Pending feasibility allowances never spread to those delegated paths. Captured expiry and conflict
  guards survive the simulator's normalization to ordinary unknown.
- `selectDependencyGroups(actions, groups, requested, readiness)` validates both DAGs and unique
  ownership, computes closure, and excludes unavailable groups plus their dependents.
- `compileCandidate(plan, selection, routes, run)` creates one assignment/stop/defer candidate.
  Model statuses/rule results/segment IDs/ETA do not grant readiness. ETA preview compiles no
  operational route. Compatible reassign+hub actions merge; conflicting writes fail.
- `evaluateCandidate(input)` uses the actual public simulator and operation validators for combined
  pickup/custody/load/hub/defer physics and lexicographic objective. It recomputes selected routes.
  Intrinsically invalid group closures may be excluded while valid independent groups survive;
  individually feasible but inconsistent combined candidates are rejected together. Input currentPolicy
  is required: before uses only committed/current authority, while after composes that authority for
  untouched drivers with selected proposal authority. Missing currentPolicy fails CONFIG_INCOMPLETE.

All authority/config/clock inputs must be captured by the server. In particular, canonical
SegmentKnowledge must already be produced from validated accepted observations/restrictions:
source authority, observed-at not in the future, vehicle/epoch eligibility and conflict resolution
are upstream SourcesMedia responsibilities. SegmentKnowledge itself carries no observed-at field;
this module does not invent one or infer street safety from weather/context.

`CandidateEvaluation.is_projected` is always true. Projection uses detached state. Its
`candidateRun` is a simulation scratch value, never an instruction to persist operations.
Ready still waits for the human dispatcher. The eventual DO transaction must recheck trusted
session/generation/revision/latest plan/job and the whole selected candidate immediately before
atomic commit. Exact replay/idempotency, asynchronous jobs, routers, Commander/tools, provider
calls and durable race proof are outside this receipt.

The hash port must compute SHA256. Derived route IDs bind the captured plan/job/generation,
snapshot bundle/time and combined selected candidate. Recomputed canonical route context hashes
still use the simulator's public physical context. Excluded full-plan assignment overrides are
not applied; subset routes are derived again and their stop consistency is revalidated.

When all physical alternatives fail, simulator hard prechecks can bypass its policy callback.
The candidate result may therefore carry POL-04/NO_FEASIBLE_ROUTE; the standalone road predicate
retains precise POL-01/closure/impassable and POL-03/conflict diagnostics. Full planning composition
should request a public simulator route-failure trace rather than inspect private implementation.

Integration contract:

1. Lead supplied the public planning export and simulation workspace dependency in correction v2.
   Standard domain typecheck and focused tests require no temporary path mapping.
2. Future factory composition must supply a captured run, validated Plan/Route registry, current pointer
   identity, authorized proposal decisions, epoch registry, explicit defer limit, SHA256 and a separately
   captured committed/current SimulationPolicy. That policy owns branch/driver-specific existing grants;
   it must never be derived from new proposal approvals. No permissive default exists.
3. Current authority must survive unrelated proposal revisions/supersession. Committed route entry still
   rechecks hard evidence, vehicle, epoch and expiry; committed grants are not latest-plan approvals.
   Reuse one snapshot/physics/H for before/after, with the correct distinct authority in each projection.
4. Exact route failure traces remain an optional public simulator seam request for full phase06 diagnostics.

Focused tests live under `apps/api/test/planning` and `apps/api/test/policy`; scoped test tsconfig is
`apps/api/test/planning/tsconfig.json`. CLI `authority-smoke.ts` exercises branch entry logs and the
critical-loss/approval-invariance case through actual public simulator paths. `planning-smoke.ts`
retains original-event-fixture hub pickup/projection proof. Neither is a durable Execute proof.
No phase06/planner-ready, calibration, real-model or client acceptance is implied.

Runtime v3 consumer: `apps/api/src/features/planning/index.ts` composes these pure functions with actual
Hono/DO jobs, metadata decisions, atomic Execute and persisted movement grants. A valid server-issued
soft-risk path remains pending when it differs from a safe detour; unmatched DTO path assertions still
grant no authority. Ready metrics use the actual gated projection. Runtime proposals normalize cached
knowledge from canonical source facts before tools/gates; see the API-owned README for composition.
