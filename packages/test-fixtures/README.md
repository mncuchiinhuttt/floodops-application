# FloodOps functional fixtures

`createFunctionalScenario()` remains the original version1 draft. Frozen v1 bytes are preserved.
`createFunctionalScenarioV2()` is the explicit opt-in version2 draft with the same scenario ID
`scn_functional1`, geometry, operational physics, events, seed and H. It adds exactly one available
simulated driver observation Source (`src_driver01`) and its own profile (`prf_driver01`).

The driver profile is disclosed functional configuration: low confidence,3simulation-minute TTL,
10m location tolerance, no restriction authority and no reopening permission. `ttl_driver` and
`location_driver` parameters carry assumed/simulated provenance. These values are not D04 evidence
or real street-safety guarantees.

Use `sealScenarioDraft(createFunctionalScenarioV2(), trustedSha256)` and `loadScenario` from
`@floodops/simulation`, or load the already sealed `data/scenarios/functional-v2/manifest.json`.
The v2 synthetic PNG is byte-identical to v1. Source/config/seed hashes change; graph hash stays
unchanged. Do not mutate active v1 session registries or replace missing configuration with a
permissive fallback. Lead must opt the app catalog/new-session default into version2.

The actual source feature factory remains `createSourcesFeature({scenarioCatalog,simulationPersistence})`.
For local Worker composition preserve its recovery-enabled `createSessionObject(combinedRegistry)`.
The catalog must resolve `get("scn_functional1","2")` to the loaded v2 scenario. Lead owns app wiring
and the real HTTP driver-flow cutover; these fixtures do not self-publish a backend/release gate.

Focused verification from the worktree root:

```sh
bun test packages/simulation/test/scenario/driver-source-v2.test.ts
bun packages/simulation/test/scenario/driver-source-v2-smoke.ts
```

The smoke uses real public submission, observation acceptance and simulation transition functions
with a server-bound driver participant. It proves fresh own-vehicle low evidence, no points and no
assignment/route/ETA commit. It is not HTTP/client/device/model or calibrated-data evidence.
