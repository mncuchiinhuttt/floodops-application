# K4 local rehearsal result

This is a **LOCAL rehearsal only** against the isolated loopback Wrangler Worker at `http://127.0.0.1:8774/api/v1`, with private state under `.wrangler/state/FlowTests`. It used the functional-v2 synthetic PNG and deterministic planner; no remote provider or paid service was called. The measurement begins when the HTTP manual-review response returns `accepted` and ends when `getPlan` returns the projected plan. Review time is excluded.

Command:

```sh
FLOODOPS_API_URL=http://127.0.0.1:8774/api/v1 bun tooling/runtime/k4-rehearsal.ts
```

- Independent sessions: 10
- Denominator: 10
- Completed: 9; failures: 1
- Nearest-rank p95: rank `ceil(0.95 * 10) = 10`; run 10 failed, so p95 is `+Infinity` / no finite value (`p95_ms: null` in JSON), not the average of the successful runs.
- 10-second target: **not met**

| Run | Client wall time (ms) | Result |
|---:|---:|---|
| 1 | 1869.185 | complete |
| 2 | 1650.357 | complete |
| 3 | 1655.069 | complete |
| 4 | 1913.174 | complete |
| 5 | 1811.955 | complete |
| 6 | 2691.786 | complete |
| 7 | 1342.048 | complete |
| 8 | 5318.087 | complete |
| 9 | 3316.968 | complete |
| 10 | 10087.630 | failure: `planning-job:incomplete` |

The full JSON run output was produced by `tooling/runtime/k4-rehearsal.ts`. The failure remains in the sample and counts as `+Infinity` at the nearest-rank position. This local result is not production, calibrated, or representative performance evidence.
