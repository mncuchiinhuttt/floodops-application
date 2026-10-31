# K1/K2 functional-v2 comparison

## Method and scope

Recorded from T01’s real HTTP calls through the composed Hono + SQLite Durable Object Worker, including `GET /results` after an approved Execute and simulation advance to the frozen horizon. This is one synthetic functional fixture run, not a calibrated forecast or a real-world effect estimate.

- Scenario: `scn_functional1`, version `2`
- Seed hash: `c22f9470dc4ed6406466dfa7f4c807ef1f339b86d252188d09d3e764d3856dad`
- Config hash returned by `GET /results`: `60416b3269b2cd0bf7118e7fbf22ae66f33d7e11fbcba0135c0645756618492f`
- Combined incident: `inc_combined1`; triggered at simulation minute 2.75 after its fixture events became effective
- Results horizon / observed-through: 20 / 20 minutes
- `calibration_status`: `incomplete`

## Raw results

| Branch | Critical late | Total late |
|---|---:|---:|
| Static baseline | 1 | 2 |
| FloodOps | 0 | 1 |

The API returned `late_reduction_ratio = 0.5`, calculated as `(2 - 1) / 2`.

- **K1:** the single fixture run met the stated target (`FloodOps critical_late = 0`).
- **K2:** the single fixture run met the proposed boundary exactly (`1 / 2 = 50%` of baseline; ratio `0.5`).

These are raw counts from one frozen synthetic run only. Do not generalize them to operational traffic or calibrated outcomes. Independent D04/T14 calibration evidence is incomplete and remains a blocker to calibrated claims.

Reproduce the API comparison and print its captured response summary:

```sh
bun --bun run vitest run --config tooling/runtime/vitest.config.ts tooling/runtime/acceptance-flows.workerd.ts -t T01 --reporter=verbose --silent=false
```

## T01 timing constraint observed

The combined incident fixture references closure events scheduled for simulation minute 1. Triggering it at minute 0 returned HTTP 409 because those fixture events were in the future. At minute 1, both `cause: incident` and `cause: manual` planning requests completed as `NO_FEASIBLE_PLAN`. The passing T01 path advances the unchanged frozen scenario to minute 2.75, records the combined incident, reads impact, requests a manual deterministic plan, approves pending actions, Executes, advances to H, and calls `GET /results`. No seed, event, map, capacity, demand, or SLA assumption was modified.

## Separate T15/K6 unmet result

The complete T15 HTTP sequence reaches manual acceptance, a new-revision replan, approval, Execute, and the `proposal_changed` plan/execution event. However, the required ETA-change assertion fails for the frozen scenario at simulation minute 2.75. With the manually accepted normal motorbike report at `seg_edge27`, captured at minute 2.75 and expiring at 5.75, the projected FloodOps ETAs were:

| Order | Before report | After report and replan |
|---|---:|---:|
| `ord_order1` | 6.25 | 6.25 |
| `ord_order2` | 3 | 3 |
| `ord_order3` | `null` | `null` |

No ETA changed. The T15 test therefore remains explicitly failing on K6; this is an unmet product acceptance gap, not a passing result or a reason to tune the fixture. The test command is the same harness with `-t T15` and is expected to fail at the final ETA-change assertion until product behavior changes.
