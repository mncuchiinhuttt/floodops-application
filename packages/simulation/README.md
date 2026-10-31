# Simulation foundations

This partial package implements portable, deterministic graph algorithms and a generic event clock.
It is not the scenario runner, operational reducer, movement/assignment engine or a simulation-ready gate.
No API DTOs or contracts package are imported. No wall clock, random generator, network or platform SDK is used.

## Internal algorithm entrypoints

`src/graph/index.ts` exposes `createGraph`, `findRoute`, `distanceMeters`,
`polylineLengthMeters`, `validateTravelProfile`, `travelDurationMs` and their internal types.
`src/clock/index.ts` exposes `createEventClock`, `advanceEventClock`, `EVENT_PHASES`,
`minutesToMilliseconds`, `millisecondsToMinutes` and their internal types.
These source entrypoints still need Lead-owned package export maps before other packages consume them.

Graph geometry uses WGS84 `[longitude, latitude]`. Each directed polyline must start and end at
its declared nodes exactly; no implicit snapping tolerance is invented. Length is calculated over
all vertices using a sphere of mean Earth radius 6,371,008.8 meters. This is a documented approximation
for synthetic functional tests, not calibrated ellipsoidal or TP.HCM road measurement evidence.
Every allowed vehicle needs its own positive travel profile. No vehicle or bicycle fallback exists.
Turn bans refer to adjacent directed edges and explicit compatible vehicles.

Profiles contain safe integer `departureMs` and positive safe integer `durationMs` knots.
Duration is linearly interpolated with an exact integer rational ceiling of arrival time; before/after the knots,
the endpoint duration is constant. Knots must have strictly increasing departure time and nondecreasing
arrival time. This representation is FIFO; non-FIFO input is rejected. No traffic multiplier is inferred
from geometry. Arithmetic beyond safe integer time is rejected.

Routing minimizes arrival time on states `(node, incoming edge)`, evaluating each profile at actual
edge entry time. Optional `incomingEdgeId` preserves a turn restriction at the origin. A zero-hop route
has zero length and the requested departure as arrival. Unreachable destinations return `null`.
Tie resolution uses arrival time, then code-unit ordering of serialized `(node, incoming edge)` keys;
outgoing edges use code-unit ID order and the first equal-arrival state is retained. Input array order
and locale do not affect the result. This route is physical access only: current evidence, closures,
load/custody, approvals and Execute remain downstream policy responsibilities.

## Clock semantics

Time is safe nonnegative integer milliseconds relative to injected T0. Minute conversion rounds to
the nearest millisecond once at the boundary; no timezone or playback speed is involved.
Clock construction copies and freezes events; event IDs reference caller-owned immutable data.
No payload, callback, side effect or domain mutation is executed by this queue.
A clock initialized at its horizon must have no pending events, because it cannot advance further.
An advance must increase time and stay within the injected horizon. Every event through the target
(including events at the target or initial time) is emitted. At an equal timestamp the order is:

1. `input` (context/restriction/accepted evidence), in declared sequence order.
2. `expiry`.
3. `invalidation`.
4. `entry` (Execute/edge-entry check).
5. `completion` (movement/service completion).

Declared event IDs and sequences are unique; emitted `eventSequence` is assigned monotonically in
processing order across advances. Original clock snapshots remain unchanged. Applying emitted events
in order, enforcing causal constraints, handling newly scheduled events and bounded DO advance jobs
belong to the later scenario/runtime integration; the generic queue does not claim those behaviors.

## Verification

Run from the worktree root with Bun 1.4.0 and frozen workspace dependencies:

```sh
bun test packages/simulation/test/graph packages/simulation/test/clock
bun --bun run tsc -p packages/simulation/tsconfig.json
bun --bun run tsc -p packages/test-fixtures/tsconfig.json
bun --bun run eslint packages/simulation/src packages/simulation/test packages/test-fixtures/src/functional/graph --max-warnings=0
bun packages/simulation/test/graph/foundation-smoke.ts
```

`@floodops/test-fixtures` contains original synthetic coordinates and assumed durations under
`src/functional/graph`; its catalog is explicitly `functional_fixture`, calibration `incomplete`.
No PRNG is needed because these algorithms and fixtures contain no stochastic operations.
D04 source provenance, licence snapshots, parameter estimates and holdout validation remain unavailable.
Scenario loading, movement, assignment, projections, metrics and calibration require contracts-ready
and a follow-up launch receipt. This delivery does not establish T01–T15 application acceptance.
