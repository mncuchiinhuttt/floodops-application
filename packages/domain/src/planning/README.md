# Pure planning foundations

Work item: planner-safety-domain-foundations-v1. This module is a deterministic proposal evaluator,
not a dispatcher authorization boundary or durable Executor.

Public entrypoint: `packages/domain/src/planning/index.ts`.

- `checkProposalIdentity(plan, current)` compares session, generation, revision and both latest IDs.
- `evaluateRoadEntry(input)` checks canonical vehicle/epoch knowledge, expiry, hard rules and
  exact server-owned action+plan+revision decisions. A successful soft decision remains uncertain.
- `createPlanningPolicy(run, authority, actionIdsByDriver, allowPending?, observe?)` adapts the
  predicate to the simulator. Only proposal feasibility may allow pending soft risk. Captured expiry
  and conflict guards survive the simulator's normalization to ordinary unknown.
- `selectDependencyGroups(actions, groups, requested, readiness)` validates both DAGs and unique
  ownership, computes closure, and excludes unavailable groups plus their dependents.
- `compileCandidate(plan, selection, routes, run)` creates one assignment/stop/defer candidate.
  Model statuses/rule results/segment IDs/ETA do not grant readiness. ETA preview compiles no
  operational route. Compatible reassign+hub actions merge; conflicting writes fail.
- `evaluateCandidate(input)` uses the actual public simulator and operation validators for combined
  pickup/custody/load/hub/defer physics and lexicographic objective. It recomputes selected routes.
  Intrinsically invalid group closures may be excluded while valid independent groups survive;
  individually feasible but inconsistent combined candidates are rejected together.

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

Central integration requests:

1. Add `"@floodops/simulation": "workspace:*"` to `packages/domain/package.json` dependencies,
   and map `"./planning": "./src/planning/index.ts"` in its exports. Lead owns manifest/lock changes.
   The import graph remains planning -> public simulator -> operations; operations never imports planning.
2. API consumers should depend on the public domain planning and simulator entrypoints. This slice's
   tests import their own planning entrypoint relatively until Lead publishes the package export.
3. Future factory composition must supply a captured run, validated Plan/Route registry, current pointer
   identity, authorized human decisions, epoch registry, explicit defer limit and SHA256 function.
   Producer-validated DTOs are mandatory; do not pass model output directly as server authority.
4. Exact route failure traces are an optional public simulator seam request for full phase06 diagnostics.

Focused tests live under `apps/api/test/planning` and `apps/api/test/policy`. Until request 1 lands,
standard domain typecheck remains unresolved at the missing declared dependency. Evidence records
temporary public-index path mapping separately; that check is not an integrated package gate.
No phase06/planner-ready, durable Execute, calibration, real-model or client acceptance is implied.
