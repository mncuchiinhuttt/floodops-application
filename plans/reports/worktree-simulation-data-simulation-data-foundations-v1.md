# SimulationData foundations — SourceEvidence (partial slice complete)

## Startup acknowledgement
- Role/work item: simulation-data / simulation-data-foundations-v1, implementation partial slice.
- CWD: /Users/vominhlong/seahackathon-worktrees/03-simulation-data
- Branch: feat/floodops-simulation-data; clean observed launch: 1c5ab1a4b5763783a8581068407580d8e60330d7.
- Base: 5934510f1ed03fea4d6bdaba46a3c01cebe225c7; base to launch contains only seven Lead launch/packet files.
- Policy: aea042b5fdb5100e826672111f326d3a03847ee7 / b0aa40dfbdf06eb631670ec8db0108b87e0a41912de59624af84cff9c4d49b1a, verified committed and working bytes.
- Contract index: worktree-execution/contracts/simulation-foundations-v1-index.json at base, SHA-256 6d2399ef5c6b805f463bbcaeb304dbf1b692a30c7b60359234f8f8183b286c86. All five indexed artifacts match source dee4dfb00af173eb3cccc2a0df75e67fa1577734 and working bytes.
- plan-published dee4dfb00af173eb3cccc2a0df75e67fa1577734 and workspace-bootstrap aea042b5fdb5100e826672111f326d3a03847ee7 are ancestors, as are base and index source.
- Allowed source: simulation src/test graph and clock subtrees; test-fixtures/src/functional/graph; simulation/README.md. Own report namespace only. Central protected files excluded. No ports assigned or servers needed.
- Remote push/deployment/resources/model calls: none authorized or performed. Local scoped signed commits authorized; signing configuration preserved.
- Runtime observed: Bun 1.4.0. Requested gpt-6.1-sol / ultra / fast; actual model/effort/service-tier not exposed to this worker and unverified.
- Planned checks: focused Bun graph/clock tests, TypeScript for the two packages, scoped ESLint, executable foundation smoke, owned-path verification.
- Deferred by receipt: scenario loader, assignment/movement, metrics/calibration, domain operations, real datasets; contracts-ready and follow-up receipt required. No simulation-ready or full-phase claim.

## Completed behavior
- Immutable copied/frozen directed WGS84 graph with geometry lengths, per-vehicle access/profiles, adjacent turn bans and validation of IDs/references/endpoints.
- FIFO earliest-arrival routing retains incoming-edge state, evaluates profiles at actual entry time, preserves one-way/vehicle restrictions, deterministic ties, zero-hop and null no-route results.
- Piecewise-linear profiles reject non-FIFO inputs; exact BigInt rational arrival ceiling avoids floating-point FIFO plateau errors and rejects unsafe arrival arithmetic.
- Immutable integer-millisecond event queue uses input → expiry → invalidation → entry → completion at each timestamp, declared sequence within a phase, and monotonic emitted event sequence. Advances process all boundaries through target ≤ H. Independent clock snapshots remain isolated.
- Original labelled synthetic fixture with assumed durations; no stochastic operations or PRNG/seed needed. No real-world passability, calibration, approval or Execute authority is implied.
- README documents internal interfaces, units, interpolation/clamping, tie rules, approximation limits, checks and deferred integration.

## Source and actual verification
- Source SHA C: `d3ba3f76ba9589dcba7b526dbd664e627683a540`. `git verify-commit d3ba3f76ba9589dcba7b526dbd664e627683a540` passed; existing SSH signing/configuration preserved.
- Source commit contains 18 owned files. Final delivery adds only this report; no central/package/lock/policy changes.
- Frozen install passed: 138 pinned packages, ignored lifecycle scripts; lockfile/manifests unchanged.
- Focused Bun suite passed: **18 tests, 0 failures, 4,823 assertions**, four test files, Bun 1.4.0.
- Both package typechecks and explicit strict test typecheck passed. Initial strict test check found a readonly-array assertion mismatch; assertion now compares readonly/mutable values consistently and recheck passed. No production behavior was weakened.
- Full scoped ESLint passed; after the assertion-only correction the affected clock test lint also passed.
- All source and test files are below 200 lines. Canonical ownership matcher and narrower partial-receipt/realpath checks passed for all 19 delivered paths. Staged diff whitespace check passed.
- Read-only independent test/review helpers found a floating-point FIFO plateau defect and horizon initialization boundary. Both were fixed with regressions; re-review cleared findings (11 affected tests/4,681 assertions passed). No unresolved review findings remain.
- CLI smoke runs below exercise actual graph/profile/route/clock code. The reusable fixture smoke invokes source index entrypoints temporarily as owner verification; future package consumers must use Lead-published exports.

| Command | Actual result |
| --- | --- |
| `bun install --frozen-lockfile --ignore-scripts` | pass |
| `bun test packages/simulation/test/graph packages/simulation/test/clock` | pass |
| `bun --bun run tsc -p packages/simulation/tsconfig.json` | pass |
| `bun --bun run tsc -p packages/test-fixtures/tsconfig.json` | pass |
| `bun --bun run tsc --noEmit --strict --noUncheckedIndexedAccess --moduleResolution Bundler --allowImportingTsExtensions --module ESNext --target ES2022 --skipLibCheck --types bun packages/simulation/test/graph/*.ts packages/simulation/test/clock/*.ts` | pass |
| `bun --bun run eslint packages/simulation/src packages/simulation/test packages/test-fixtures/src/functional/graph --max-warnings=0` | pass |
| `bun --bun run eslint packages/simulation/test/clock/event-clock.test.ts --max-warnings=0` | pass |

Executable smoke commands:

```sh
bun packages/simulation/test/graph/foundation-smoke.ts
bun --eval 'import {createGraph,findRoute} from "./packages/simulation/src/graph/index.ts"; import {createTurnAwareFixture} from "./packages/test-fixtures/src/functional/graph/index.ts"; const fixture=createTurnAwareFixture(); const graph=createGraph(fixture.graph); const car=findRoute(graph,{from:"A",to:"D",vehicle:"car",departureMs:0}); const bike=findRoute(graph,{from:"A",to:"D",vehicle:"motorbike",departureMs:0}); if(car?.arrivalMs!==5000 || bike?.arrivalMs!==500) throw new Error("Synthetic fixture smoke failed"); console.log(JSON.stringify({metadata:fixture.metadata,carRoute:car.edgeIds,bikeRoute:bike.edgeIds,carArrivalMs:car.arrivalMs,bikeArrivalMs:bike.arrivalMs,fixtureSha256:new Bun.CryptoHasher("sha256").update(JSON.stringify(fixture)).digest("hex")}));'
```

Observed engine smoke: car `AC,CB,BD` (5ms), motorbike `AD-bike` (1ms), reverse route `null`; events `closure,expiry,entry`; final clock20ms and original clock0ms.
Observed reusable fixture smoke: car `AC,CB,BD` (5000ms), motorbike `AD-bike` (500ms); `functional_fixture`, calibration `incomplete`.

## Frozen input evidence
These checks used the exact source content committed as C. Root tooling/config was read-only.
Fixture JSON SHA-256: `26797adc061a498dfbbe5a192e3fea2ab2309ac60c3fced9f721669aab95cca0`.
Fixture ID `synthetic-turn-aware-v1`; `randomSeed:null` because no randomness is consumed.
Synthetic clock smoke configuration: T0-relative now0ms, H20ms; closure(input,seq1), expiry(expiry,seq2), entry(entry,seq0) all at10ms.

| File | SHA-256 |
| --- | --- |
| `bun.lock` | `b79cbf0466c01ec9b9d1bc5a0ac9e6c9a2a96b898318a174a0ea48de1c7409e6` |
| `tsconfig.base.json` | `35aaa42da6a2d83e94626be0879ed09c3c72303cc3816bb3d987cc9bdfaae081` |
| `eslint.config.js` | `4a76e11925903b3935e0a37dd4b71452ea7bf127f43f034629fd34fad1f233ba` |
| `packages/simulation/package.json` | `eb61ae819f2032f4cc3721b17d086c5f191231f5c1faba312f25b664f56bffd6` |
| `packages/test-fixtures/package.json` | `4253e5830776fa27491cda249b421c53898dbe980af7491bb82691e758b8e309` |
| `packages/test-fixtures/src/functional/graph/turn-aware.ts` | `0ea683cd996c96bea74804dbdc282bdbc780951ee6f7160fb168e5c4aa10c252` |

## Integration requests and limitations
1. IntegrationLead: add package export subpaths @floodops/simulation/graph -> ./src/graph/index.ts and @floodops/simulation/clock -> ./src/clock/index.ts in protected packages/simulation/package.json; add focused test/typecheck scripts when composing the package.
2. IntegrationLead: add @floodops/test-fixtures/functional/graph -> ./src/functional/graph/index.ts and focused typecheck script in protected packages/test-fixtures/package.json. No new dependencies required. Do not introduce production deep imports to source files.
3. IntegrationLead: review/merge exact delivery, then issue fresh contracts-ready and a follow-up SimulationData receipt before scenario loader/movement/assignment/projection/metrics/calibration work. This partial delivery must not emit simulation-ready.

- Deferred dependent work has no contracts-ready in this receipt and requires a follow-up launch receipt; movement, scenario loading, assignment, metrics and domain operations were not attempted.
- D04 real dataset/licence/provenance/independent holdout and calibration tolerances are unavailable; synthetic fixtures remain calibration incomplete.
- Cross-package consumers await Lead-owned export maps; source-level CLI smoke is owner validation only. No application/Worker/native/model/release gate claimed.

This authorized partial work item is complete and ready for integration review. The broader Phase03/simulation-ready/D04 gates remain unclaimed. No operation in this slice was denied, pending approval or uncertain. Requests above are pending Lead integration, not an auto-review denial. No remote push/merge/deploy/paid/provider/account/device actions occurred; no secrets or out-of-scope edits were introduced. Dependencies were fetched only through the authorized frozen package install.

## Machine-readable SourceEvidence
```json
{
  "work_item_id": "simulation-data-foundations-v1",
  "role_id": "simulation-data",
  "base_sha": "5934510f1ed03fea4d6bdaba46a3c01cebe225c7",
  "observed_launch_sha": "1c5ab1a4b5763783a8581068407580d8e60330d7",
  "status": "code-ready-for-integration",
  "contract_sha256": "6d2399ef5c6b805f463bbcaeb304dbf1b692a30c7b60359234f8f8183b286c86",
  "changed_paths": [
    "packages/simulation/README.md",
    "packages/simulation/src/clock/event-clock.ts",
    "packages/simulation/src/clock/index.ts",
    "packages/simulation/src/clock/simulation-time.ts",
    "packages/simulation/src/graph/create-graph.ts",
    "packages/simulation/src/graph/find-route.ts",
    "packages/simulation/src/graph/geometry.ts",
    "packages/simulation/src/graph/graph-types.ts",
    "packages/simulation/src/graph/index.ts",
    "packages/simulation/src/graph/travel-profile.ts",
    "packages/simulation/test/clock/event-clock.test.ts",
    "packages/simulation/test/graph/find-route.test.ts",
    "packages/simulation/test/graph/foundation-smoke.ts",
    "packages/simulation/test/graph/geometry-profile.test.ts",
    "packages/simulation/test/graph/graph-builder.ts",
    "packages/simulation/test/graph/graph-validation.test.ts",
    "packages/test-fixtures/src/functional/graph/index.ts",
    "packages/test-fixtures/src/functional/graph/turn-aware.ts",
    "plans/reports/worktree-simulation-data-simulation-data-foundations-v1.md"
  ],
  "checks": [
    {
      "command": "bun install --frozen-lockfile --ignore-scripts",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/03-simulation-data",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-simulation-data-simulation-data-foundations-v1.md"
    },
    {
      "command": "bun test packages/simulation/test/graph packages/simulation/test/clock",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/03-simulation-data",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-simulation-data-simulation-data-foundations-v1.md"
    },
    {
      "command": "bun --bun run tsc -p packages/simulation/tsconfig.json",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/03-simulation-data",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-simulation-data-simulation-data-foundations-v1.md"
    },
    {
      "command": "bun --bun run tsc -p packages/test-fixtures/tsconfig.json",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/03-simulation-data",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-simulation-data-simulation-data-foundations-v1.md"
    },
    {
      "command": "bun --bun run tsc --noEmit --strict --noUncheckedIndexedAccess --moduleResolution Bundler --allowImportingTsExtensions --module ESNext --target ES2022 --skipLibCheck --types bun packages/simulation/test/graph/*.ts packages/simulation/test/clock/*.ts",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/03-simulation-data",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-simulation-data-simulation-data-foundations-v1.md"
    },
    {
      "command": "bun --bun run eslint packages/simulation/src packages/simulation/test packages/test-fixtures/src/functional/graph --max-warnings=0",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/03-simulation-data",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-simulation-data-simulation-data-foundations-v1.md"
    },
    {
      "command": "bun --bun run eslint packages/simulation/test/clock/event-clock.test.ts --max-warnings=0",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/03-simulation-data",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-simulation-data-simulation-data-foundations-v1.md"
    },
    {
      "command": "git diff --cached --check",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/03-simulation-data",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-simulation-data-simulation-data-foundations-v1.md"
    },
    {
      "command": "git verify-commit d3ba3f76ba9589dcba7b526dbd664e627683a540",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/03-simulation-data",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-simulation-data-simulation-data-foundations-v1.md"
    }
  ],
  "smoke": [
    {
      "scenario": "bun packages/simulation/test/graph/foundation-smoke.ts",
      "observed_result": "Synthetic car AC,CB,BD arrival 5ms; motorbike AD-bike arrival 1ms; reverse route null. Event order closure,expiry,entry. Final clock20ms; original0ms.",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-simulation-data-simulation-data-foundations-v1.md"
    },
    {
      "scenario": "bun --eval 'import {createGraph,findRoute} from \"./packages/simulation/src/graph/index.ts\"; import {createTurnAwareFixture} from \"./packages/test-fixtures/src/functional/graph/index.ts\"; const fixture=createTurnAwareFixture(); const graph=createGraph(fixture.graph); const car=findRoute(graph,{from:\"A\",to:\"D\",vehicle:\"car\",departureMs:0}); const bike=findRoute(graph,{from:\"A\",to:\"D\",vehicle:\"motorbike\",departureMs:0}); if(car?.arrivalMs!==5000 || bike?.arrivalMs!==500) throw new Error(\"Synthetic fixture smoke failed\"); console.log(JSON.stringify({metadata:fixture.metadata,carRoute:car.edgeIds,bikeRoute:bike.edgeIds,carArrivalMs:car.arrivalMs,bikeArrivalMs:bike.arrivalMs,fixtureSha256:new Bun.CryptoHasher(\"sha256\").update(JSON.stringify(fixture)).digest(\"hex\")}));'",
      "observed_result": "Actual reusable synthetic fixture: car AC,CB,BD arrival5000ms; bike AD-bike arrival500ms; calibration incomplete; fixture JSON SHA25626797adc061a498dfbbe5a192e3fea2ab2309ac60c3fced9f721669aab95cca0.",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-simulation-data-simulation-data-foundations-v1.md"
    }
  ],
  "public_exports": [
    "Planned @floodops/simulation/graph: createGraph, findRoute, distanceMeters, polylineLengthMeters, validateTravelProfile, travelDurationMs; internal Coordinate/Vehicle/GraphInput/RoutingGraph/RouteQuery/Route and related types.",
    "Planned @floodops/simulation/clock: createEventClock, advanceEventClock, EVENT_PHASES, minutesToMilliseconds, millisecondsToMinutes; internal event/clock types.",
    "Planned @floodops/test-fixtures/functional/graph: createTurnAwareFixture. Export maps pending Lead; source index entrypoints exist."
  ],
  "integration_requests": [
    "IntegrationLead: add package export subpaths @floodops/simulation/graph -> ./src/graph/index.ts and @floodops/simulation/clock -> ./src/clock/index.ts in protected packages/simulation/package.json; add focused test/typecheck scripts when composing the package.",
    "IntegrationLead: add @floodops/test-fixtures/functional/graph -> ./src/functional/graph/index.ts and focused typecheck script in protected packages/test-fixtures/package.json. No new dependencies required. Do not introduce production deep imports to source files.",
    "IntegrationLead: review/merge exact delivery, then issue fresh contracts-ready and a follow-up SimulationData receipt before scenario loader/movement/assignment/projection/metrics/calibration work. This partial delivery must not emit simulation-ready."
  ],
  "blocked_prerequisites": [
    "Deferred dependent work has no contracts-ready in this receipt and requires a follow-up launch receipt; movement, scenario loading, assignment, metrics and domain operations were not attempted.",
    "D04 real dataset/licence/provenance/independent holdout and calibration tolerances are unavailable; synthetic fixtures remain calibration incomplete.",
    "Cross-package consumers await Lead-owned export maps; source-level CLI smoke is owner validation only. No application/Worker/native/model/release gate claimed."
  ],
  "out_of_scope_changes": [],
  "unrequested_remote_actions": false,
  "source_sha": "d3ba3f76ba9589dcba7b526dbd664e627683a540",
  "policy_sha256": "b0aa40dfbdf06eb631670ec8db0108b87e0a41912de59624af84cff9c4d49b1a"
}
```
