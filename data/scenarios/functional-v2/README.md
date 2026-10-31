# Functional scenario version2

Scenario ID `scn_functional1`, version `2`; calibration incomplete. This is an original synthetic
functional fixture, preserving v1 geometry/operations/time/events/H and adding only driver report
source configuration. The v1 directory and public v1 factory remain unchanged.

Driver source `src_driver01`: available, simulated, observation role. Profile `prf_driver01`: low,
TTL3simulation minutes, location tolerance10m, no authority/reopening. Parameters `ttl_driver` and
`location_driver` are explicit assumed values with synthetic provenance. No D04 claim.

`manifest.json` was authored with the public v2 fixture accessor and sealed/validated with the
public simulator helpers. `synthetic-report.png` is an identical copy of the original procedural
v1 asset, not a real image or vision-quality sample. Lead must select version2 in the app catalog
and new sessions, then run the actual HTTP driver quick-report path. Existing v1 sessions are not
silently migrated.
