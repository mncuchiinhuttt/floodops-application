/** Fixture scenarios provide inputs; producer-owner integration tests establish each behavior. */
export const functionalCatalog = Object.freeze([
  ["T01", "combined replay and H metrics", "simulation/planner/platform/clients"],
  ["T02", "authoritative E17 closure plus contrary report", "sources/planner/simulation"],
  ["T03", "E27 bike-only evidence with car still unknown", "sources/planner/simulation"],
  ["T04", "freshness expiry before stale Execute", "platform/planner/simulation"],
  ["T05", "temporary vector overload and picked-up hub change", "domain/planner/simulation"],
  ["T06", "independent feasible/waiting groups", "planner/platform"],
  ["T07", "same normalized image and redundant/expired reports", "media/review/platform"],
  ["T08", "rain/tide context does not change street knowledge", "sources/simulation"],
  ["T09", "model refusal/timeout/reset fences", "planner/platform"],
  ["T10", "same frozen seed reset produces same movement", "simulation/platform"],
  ["T11", "tide-only and unknown/different datum", "sources"],
  ["T12", "contradictory accepted evidence then review", "sources/review/planner"],
  ["T13", "closure after entry versus before next entry", "simulation"],
  ["T14", "deterministic playback and calibration gaps", "simulation/calibration"],
  ["T15", "fresh E27 bike report changes projected ETA before separate Execute", "sources/planner/simulation/clients"]
].map(([id, boundary, owners]) => Object.freeze({ id: id!, boundary: boundary!, owners: owners!,
  label: "functional_fixture", calibrationStatus: "incomplete" })));
