# FloodOps deterministic simulation

Portable TypeScript uses canonical `@floodops/contracts` entities and the pure
`@floodops/domain/operations` public seam. Platform clock/network/storage/model code is injected
or owned by later producers. Runtime logic imports no Bun, Node, Hono, React or provider SDK.

## Public entrypoints

| Import | Public seam |
| --- | --- |
| `@floodops/simulation` | `loadScenario`, `createRun`, `applyKnowledgeTransition`, `advanceRun`, `computeRoute`, `projectCandidate`, `projectCurrent`, `applyExecutedCandidate`, `retryCommittedRoute`, `checkEntry`, `calculateObservedMetrics`, `relativeReduction`, `objectiveFromEtas`, `compareObjectives`, `assessCalibration`; manifest/run/policy/projection types |
| `@floodops/simulation/graph` | immutable graph construction, turn-aware FIFO routing, geometry/profile algorithms and internal types |
| `@floodops/simulation/clock` | immutable generic event queue and explicit minute/millisecond adapters |
| `@floodops/domain/operations` | canonical operational validation, isolated assignment candidates, deferral and exact quantity-vector operations |
| `@floodops/test-fixtures` | synthetic scenario authoring factory, source fixture factory and T01–T15 input catalog |

`loadScenario(manifest, hashText, options)` copies and freezes the bundle, parses canonical wire
schemas, verifies graph/config/seed content hashes and semantic references/units/profiles/geometry,
checks source/evidence consistency and causal event ordering, then returns `LoadedScenario`.
`hashText` is a synchronous trusted SHA-256 port; tests use Bun only at this outer adapter.
`sealScenarioDraft` is explicit fixture-authoring tooling. It is never runtime input repair.
Limits default to 10,000 events, 20,000 segments and 100 drivers; callers may set lower bounds.
These resource limits are not physical/calibration parameters.

`createRun(scenario, runId, includeRerouteOnly?)` copies static/FloodOps/optional reroute-only
operational states. Every branch starts from the same frozen assignment, stops, route, clock and
physics. The seed is recorded; no stochastic operation consumes a PRNG. Scenario inputs/knowledge
are shared; branch positions, load, custody, routes, service, approvals supplied by policy, stock,
pickup-window usage and completion/attempt logs remain independent.

`advanceRun(run, targetMinute, policy, {maxBoundaries?})` returns `{run, complete, targetMinute}`.
Target must increase time and stay within H. It processes complete timestamp batches, up to the
requested boundary budget; an incomplete checkpoint retains its fixed target and resumes with the
same target. Inputs/expiry apply before new entry. An arrival or service completion may causally
create an entry at that timestamp, after those inputs. No callback/wall clock advances a run.
A DO job owner must persist/checkpoint the returned data with its own lease/CAS/idempotency fence.

`SimulationPolicy.authorizeEntry` is a required pure port. SourcesMedia supplies current normalized
knowledge; PlannerSafety supplies approval bound to session/generation/revision/latest plan/action,
vehicle/epoch/evidence and time. The callback sees cloned prospective entry context; it cannot
mutate the run. Core closure/impassable/conflict/vehicle/turn guards remain hard checks. Expiry
removes current observation IDs, condition and confidence; a later ordinary-unknown authorization
must be a new owner-bound decision. Old evidence-bound approvals must fail in the policy adapter.
The simulator does not implement participant auth, manual review, rewards, LLM control or API CAS.
`applyKnowledgeTransition(run, fullKnowledge, {sourceSnapshot,reasonId})` consumes an already normalized
server transition at the committed simulation time. It validates current support, frozen source registry,
nondecreasing epochs and actual reopening proof, updates shared runtime knowledge/source records and
invalidates the affected physical path. It does not mutate the frozen scenario/config/bundle hashes,
advance time, Execute a candidate or award points. Existing source inputs/restrictions/observation facts
are immutable; only explicit review status/conflict fields may change. A future stale fixture observation
cannot overwrite runtime knowledge. Newly effective authority advances the current epoch instead of
being discarded; a rebased reopening becomes unknown until fresh evidence/approval exists. SessionPlatform must fence this pure transition
with its session/generation/revision/CAS transaction together with the source/review transition.

A blocked route remains waiting with null ETA. `retryCommittedRoute` is an explicit owner-authorized
wake of an existing route; approval alone does not execute a proposed plan. Physical checks run again
on advance. `applyExecutedCandidate` is a pure transition for an already-authorized atomic Executor;
it is not an API/security boundary. It validates the entire batch, recomputes projection, rejects a
worse lexicographic objective (POL-05), and returns a new FloodOps state. Static remains unchanged.
`projectCandidate` returns projected objective/ETAs/candidate state without mutation. It uses the
same movement/service/load physics and frozen future input stream, including completions beyond H
when finite; score delay is capped at H. `computeRoute` uses the same projection for ETA rather than
trusting a supplied stop time/distance/ETA. Consumers must keep projected output separate from committed state.

## Physical and data rules

Geometry is WGS84 `[longitude,latitude]`; polyline endpoints match nodes exactly, with no implicit
snapping. Length sums all vertices using mean spherical radius 6,371,008.8m. The declared tolerance
is a scenario parameter; this approximation and synthetic success do not establish D04 accuracy.
Motorbike/car/truck access is explicit, each vehicle has its own profile, and `only_turn`/`no_turn`
compile to vehicle-scoped adjacent-turn bans. Search retains `(node,incoming edge)` and deterministic
arrival/state-key/edge-ID ties. Unreachable returns null, with no bicycle or geometric-time fallback.

Wire travel profiles are constant over `[valid_from,valid_until)` windows, with contiguous coverage
through H and nondecreasing duration at boundaries (FIFO). They never interpolate between windows.
Original internal knot profiles remain continuous piecewise-linear duration with exact rational
arrival ceiling and constant endpoints. Both use nonnegative safe integer milliseconds, positive
duration and explicit overflow rejection. Fractional wire minutes round once to nearest millisecond.

Pickup and delivery consume authored service time. Load/carrying IDs/lifecycle change together at
service completion. Pickup service resolves by frozen order+hub parameter, not a caller-selected
stop ID. Capacity is checked at every stop in every declared dimension; omitted dimensions and
unit mismatch fail. Decimal arithmetic follows each finite JSON number's shortest decimal spelling
exactly; unrepresentable results fail rather than use an epsilon or silently drop demand.
Hub windows have explicit absolute anchors and no automatic refill; stock is consumed once.
Picked-up retains driver/hub; delivered assignment/completion and original SLA/tier remain immutable.

A legally entered edge locks its exit time. A later change logs `in_progress_at_change`; it does not
reverse/teleport/shorten travel. The next entry is checked against current state. Reroute-only keeps
its initial route until a road change/expiry requests a new individual path, using the same guards
and physics without changing assignment/hub/priority.

Source snapshots are canonical, declared synthetic inputs. Loader consistency checks all accepted
current matching observations, excludes future/expired/rejected/superseded evidence, and prevents a
selected reference subset from hiding conflict. Known confidence/expiry must match supporting
source policy/evidence. Available effective authority cannot be omitted. A reopening needs a matching
actual authorized source restriction and input, scoped to the active closure/vehicle/segment/time;
a label or contrary report cannot remove closure. Runtime source normalization/review remains owned
by SourcesMedia/ReviewRewards. Rain/tide context never changes street knowledge.

## Metrics, evidence and limitations

`calculateObservedMetrics(orders, branchLog, H)` uses actual completion logs, never proposal ETA.
Unfinished lateness uses H; exact-SLA delivery is on time. Road attempts are distinct IDs with
proposal/movement breakdown; hub/load/no-route failures do not inflate blocked-road counts.
Reassignment/ETA counters deduplicate order IDs; baseline-zero reduction is null.

```sh
bun test packages/simulation/test packages/test-fixtures/test
bun --bun run tsc -p packages/simulation/tsconfig.json
bun --bun run tsc -p packages/domain/tsconfig.json
bun --bun run tsc -p packages/test-fixtures/tsconfig.json
bun --bun run eslint packages/simulation/src packages/simulation/test packages/domain/src/operations packages/test-fixtures/src packages/test-fixtures/test --max-warnings=0
bun packages/simulation/test/scenario/scenario-smoke.ts
```

The frozen bundle lives at `data/scenarios/functional-v1/manifest.json`; its README and calibration
register explain provenance, units, hashes and missing evidence. The fixture catalog maps T01–T15
inputs and owner boundaries; it does not claim complete application acceptance. Own tests exercise
reachable simulation/domain portions; platform/media/reward/planner/client/model/device checks need
their corresponding producers and integration. D04 real sources/licences/holdout/tolerances are absent.
Calibrated loading rejects incomplete evidence; `assessCalibration` checks supplied metadata/residuals
and known simulated/assumed labels, not real-world source truth. No real K1/K2 efficacy or release
claim follows from this delivery. Existing baseline Expo Zod3/deepmerge audit findings remain explicit
QA/security/release blockers; manifests/lock/config were not changed by this worker.
