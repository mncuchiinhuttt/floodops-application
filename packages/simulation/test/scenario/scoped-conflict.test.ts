import { expect, test } from "bun:test";
import { loadScenario, sealScenarioDraft } from "@floodops/simulation";
import { hash } from "./test-context.ts";
import { contraryId, contradictory, derive, scopedManifest, scopes, sharedId, vehicles } from "./scoped-evidence-context.ts";

for (const shared of scopes) for (const contrary of scopes.filter(scope => scope.every(vehicle => shared.includes(vehicle)))) {
  for (const reversed of [false, true]) test(`shared ${shared.join("/")}, contrary ${contrary.join("/")}, reversed=${reversed}`, () => {
    const manifest = scopedManifest(shared, contrary, reversed);
    const scenario = loadScenario(sealScenarioDraft(manifest, hash), hash);
    for (const vehicle of vehicles) {
      const knowledge = scenario.manifest.initialKnowledge.find(item => item.segment_id === "seg_edge27" && item.vehicle_type === vehicle)!;
      expect(knowledge.state).toBe(contrary.includes(vehicle) ? "unresolved_conflict" : shared.includes(vehicle) ? "known" : "ordinary_unknown");
      if (contrary.includes(vehicle)) expect(knowledge.observation_ids).toContain(contraryId);
      else expect(knowledge.condition).toBe(shared.includes(vehicle) ? "normal" : "unknown");
    }
    expect(scenario.manifest.sourceSnapshot.observations.find(item => item.observation_id === sharedId)!.has_conflict).toBe(true);
  });
}

test("a global aggregate flag does not invent conflict when every current scoped condition agrees", () => {
  const manifest = scopedManifest(vehicles, []);
  manifest.sourceSnapshot.observations.find(item => item.observation_id === sharedId)!.has_conflict = true;
  manifest.initialKnowledge = derive(manifest, 0);
  const scenario = loadScenario(sealScenarioDraft(manifest, hash), hash);
  expect(scenario.manifest.initialKnowledge.filter(item => item.segment_id === "seg_edge27").map(item => item.state)).toEqual(["known", "known", "known"]);
});

test("actual scoped contradiction stays fail-closed even with false global flags or an omitted contrary reference", () => {
  const manifest = scopedManifest(vehicles, ["motorbike"]);
  manifest.sourceSnapshot.observations.filter(item => [sharedId, contraryId].includes(item.observation_id)).forEach(item => { item.has_conflict = false; });
  manifest.initialKnowledge = derive(manifest, 0);
  const actual = manifest.initialKnowledge.find(item => item.segment_id === "seg_edge27" && item.vehicle_type === "motorbike")!;
  expect(actual.state).toBe("unresolved_conflict");
  Object.assign(actual, { state: "known", condition: "normal", confidence_band: "high", observation_ids: [sharedId], expires_sim_minute: 21 });
  expect(() => loadScenario(sealScenarioDraft(manifest, hash), hash)).toThrow("consistent current evidence");
});

const excluded: [string, (manifest: ReturnType<typeof scopedManifest>) => void][] = [
  ["future", manifest => { Object.assign(contradictory(manifest), { observed_sim_minute: 1, observed_at: "2026-10-31T00:01:00Z", expires_sim_minute: 4, expires_at: "2026-10-31T00:04:00Z" }); }],
  ["other epoch", manifest => { contradictory(manifest).knowledge_epoch = 1; }],
  ["other segment", manifest => { contradictory(manifest).segment_id = "seg_edge21"; }],
  ...(["pending", "rejected", "superseded"] as const).map(status => [status, (manifest: ReturnType<typeof scopedManifest>) => { contradictory(manifest).validation = status; }] as [string, (manifest: ReturnType<typeof scopedManifest>) => void])
];
for (const [label, change] of excluded) test(`global flag from ${label} evidence does not poison another current scope`, () => {
  const manifest = scopedManifest(vehicles, ["motorbike"]); change(manifest); manifest.initialKnowledge = derive(manifest, 0);
  const scenario = loadScenario(sealScenarioDraft(manifest, hash), hash);
  expect(scenario.manifest.initialKnowledge.filter(item => item.segment_id === "seg_edge27").every(item => item.state === "known")).toBe(true);
});

for (const vehicle of vehicles) test(`unsupported known/conflict/confidence/expiry still reject for ${vehicle}`, () => {
  const original = scopedManifest(vehicles, vehicles.filter(item => item !== vehicle));
  for (const patch of [{ observation_ids: [] }, { confidence_band: "low" }, { expires_sim_minute: 22 },
    { state: "unresolved_conflict", condition: "unknown", confidence_band: null }]) {
    const manifest = structuredClone(original), knowledge = manifest.initialKnowledge.find(item => item.segment_id === "seg_edge27" && item.vehicle_type === vehicle)!;
    Object.assign(knowledge, patch);
    expect(() => loadScenario(sealScenarioDraft(manifest, hash), hash)).toThrow();
  }
});
