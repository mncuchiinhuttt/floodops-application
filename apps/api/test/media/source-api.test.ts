import { afterEach, describe, expect, it } from "vitest";
import { reset, runInDurableObject } from "cloudflare:test";
import { parseSchema } from "@floodops/contracts";
import { advanceRun } from "@floodops/simulation";
import type { Snapshot } from "../../src/shared/index";
import { createNormalizedImagePort } from "../../src/features/media/index";
import { persistence } from "./runtime-worker";
import { bindings, call, create, headers, join, key, ready, seedAsset } from "./helpers";
import type { Member } from "./helpers";
afterEach(reset);
const input = (patch: Record<string, unknown> = {}) => ({ kind: "citizen", media_id: null, fixture_photo_id: "photo_fixture01", segment_id: "seg_edge27",
  coordinate: [106.701,10.7705], captured_at: "2026-10-31T00:00:00Z", captured_sim_minute: 0, vehicle_types: ["motorbike"], description: "Synthetic photo evidence only", ...patch });
async function post(member: Member, value: unknown, requestKey = key(), etag = member.etag) {
  return call(`/sessions/${member.id}/reports`, { method: "POST", headers: headers(member, { "Content-Type": "application/json", "Idempotency-Key": requestKey, "If-Match": etag }), body: JSON.stringify(value) });
}
async function current(member: Member): Promise<Member> { const response = await call(`/sessions/${member.id}/identity`, { headers: headers(member) }); return { ...member, etag: response.headers.get("ETag")! }; }
async function minute(member: Member, target: number): Promise<Member> {
  await runInDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(member.id)), (_instance, state) => {
    const row = state.storage.sql.exec<{ value: string }>("SELECT value FROM documents WHERE collection='runtime' AND id='snapshot'").one();
    const snapshot = JSON.parse(row.value) as Snapshot;
    const run = advanceRun(persistence.read(snapshot.values), target, { authorizeEntry: ({ knowledge }) => ({ allowed: knowledge?.state === "known" && knowledge.confidence_band === "high", reason: "POL-02" }) }).run;
    snapshot.values = persistence.write(snapshot.values, run); snapshot.meta.sim_minute = target; snapshot.meta.revision++;
    state.storage.sql.exec("UPDATE documents SET value=? WHERE collection='runtime' AND id='snapshot'", JSON.stringify(snapshot));
  });
  return current(member);
}
describe("actual source/report API", () => {
  it("publishes real catalog/config/graph with strict version and bounded pages", async () => {
    const first = await call("/scenarios?limit=1"), list = parseSchema("ScenarioSummaryListResponse", await first.json()).data!;
    expect(list.items).toHaveLength(1); expect(list.page.has_more).toBe(true);
    expect((await call(`/scenarios?limit=1&cursor=${encodeURIComponent(list.page.next_cursor!)}`)).status).toBe(200);
    expect((await call("/scenarios/scn_functional1")).status).toBe(422);
    expect((await call("/scenarios/scn_functional1?version=unknown")).status).toBe(404);
    expect((await call("/scenarios/scn_functional1?version=1&authority=admin")).status).toBe(422);
    const owner = await create(); const graph = await call(`/sessions/${owner.id}/graph`, { headers: headers(owner) });
    expect(parseSchema("GraphResponse", await graph.json()).data!.segments).toHaveLength(12);
  });
  it("scopes source/knowledge roles and current restrictions by vehicle and available reopening evidence", async () => {
    let owner = await create("native", "scn_drivercase1"); const viewer = await join(owner, "viewer", null), contributor = await join(owner, "contributor", "contributor_functional1");
    const driver = await join(owner, "driver", "drv_moto01");
    expect((await call(`/sessions/${owner.id}/sources`, { headers: headers(viewer) })).status).toBe(200);
    expect((await call(`/sessions/${owner.id}/source-events`, { headers: headers(contributor) })).status).toBe(403);
    expect((await call(`/sessions/${owner.id}/knowledge`, { headers: headers(contributor) })).status).toBe(403);
    owner = await minute(owner, 3.5);
    const knowledge = parseSchema("KnowledgeResponse", await (await call(`/sessions/${owner.id}/knowledge`, { headers: headers(driver) })).json()).data!;
    expect(knowledge.segments.every(pair => pair.vehicle_type === "motorbike")).toBe(true);
    expect(knowledge.restrictions.every(restriction => restriction.vehicle_types.every(vehicle => vehicle === "motorbike"))).toBe(true);
    expect(knowledge.restrictions.some(restriction => restriction.restriction_id === "rst_seg_edge17")).toBe(false);
    const all = parseSchema("RestrictionListResponse", await (await call(`/sessions/${owner.id}/restrictions`, { headers: headers(owner) })).json()).data!;
    expect(all.items.some(item => item.restriction_id === "rst_noinput01")).toBe(false);
    expect(all.items.find(item => item.restriction_id === "rst_seg_edge17")?.vehicle_types).toEqual(["car","truck"]);
  });
  it("returns normalized context envelopes without creating road passability", async () => {
    const owner = await create("native", "scn_drivercase1");
    const before = await (await call(`/sessions/${owner.id}/knowledge`, { headers: headers(owner) })).json();
    const replay = await call(`/sessions/${owner.id}/source-events`, { method: "POST", headers: headers(owner, { "Content-Type": "application/json", "Idempotency-Key": key(), "If-Match": owner.etag }), body: JSON.stringify({ fixture_event_id: "fxe_rain001" }) });
    expect(replay.status).toBe(201); expect(parseSchema("InputEventResponse", await replay.json()).data!.measurement).toMatchObject({ value: 30, unit: "mm" });
    const events = parseSchema("InputEventListResponse", await (await call(`/sessions/${owner.id}/source-events`, { headers: headers(owner) })).json()).data!;
    expect(events.items.find(item => item.source_id === "src_rain001")?.measurement).toMatchObject({ value: 30, unit: "mm" });
    const after = await (await call(`/sessions/${owner.id}/knowledge`, { headers: headers(owner) })).json();
    expect((after as { data: unknown }).data).toEqual((before as { data: unknown }).data);
  });
  it("keeps citizen pending, participant-owned and separate from knowledge/award, with a real authorized normalized-image port", async () => {
    const owner = await create(), contributor = await join(owner, "contributor", "contributor_functional1"), other = await join(owner, "contributor", "contributor_functional1");
    const { media } = await ready(contributor);
    const before = parseSchema("KnowledgeResponse", await (await call(`/sessions/${owner.id}/knowledge`, { headers: headers(owner) })).json()).data;
    const response = await post(contributor, input({ media_id: media.media_id, fixture_photo_id: null })); expect(response.status).toBe(201);
    const report = parseSchema("ReportResponse", await response.json()).data!;
    expect(report).toMatchObject({ status: "pending_review", participant_id: contributor.participant, reporter_entity_id: "contributor_functional1", observation_ids: [], award_id: null });
    const after = parseSchema("KnowledgeResponse", await (await call(`/sessions/${owner.id}/knowledge`, { headers: headers(owner) })).json()).data; expect(after).toEqual(before);
    expect((await call(`/sessions/${owner.id}/reports/${report.report_id}`, { headers: headers(other) })).status).toBe(404);
    const port = createNormalizedImagePort(bindings), context = { sessionId: owner.id, requestId: "request_portcheck1", auth: { token: owner.token, transport: "bearer" as const, origin: null, csrf: null } };
    const image = await port.read(context, report.report_id); expect(image.mediaDigest).toBe(media.sha256); expect(image.bytes.length).toBe(media.byte_length);
    expect(image).not.toHaveProperty("rawKey"); expect(image).not.toHaveProperty("url");
    await expect(port.read({ ...context, auth: { ...context.auth, token: contributor.token } }, report.report_id)).rejects.toMatchObject({ status: 403 });
  });
  it("uses explicit driver configuration, deterministic quick acceptance and typed impersonation/unavailable text errors", async () => {
    const canonical = await create(), missingDriver = await join(canonical, "driver", "drv_moto01");
    const quick = { ...input(), kind: "driver", input_mode: "quick", quick_condition: "normal" }; delete (quick as Record<string,unknown>).media_id; delete (quick as Record<string,unknown>).fixture_photo_id;
    const unavailable = await post(missingDriver, quick); expect(unavailable.status).toBe(503); expect(parseSchema("ErrorResponse", await unavailable.json()).error.code).toBe("CONFIG_INCOMPLETE");
    const owner = await create("native", "scn_drivercase1"), driver = await join(owner, "driver", "drv_moto01");
    const spoofed = await post(driver, { ...quick, reporter_entity_id: "drv_auto01" }); expect(spoofed.status).toBe(403);
    const accepted = await post(driver, quick); expect(accepted.status).toBe(201);
    expect(parseSchema("ReportResponse", await accepted.json()).data).toMatchObject({ status: "accepted", award_id: null });
    const text = await post(await current(driver), { ...quick, input_mode: "text", quick_condition: null }); expect(text.status).toBe(201);
    expect(parseSchema("ReportResponse", await text.json()).data).toMatchObject({ status: "needs_clarification", reason_codes: ["NEEDS_CLARIFICATION"] });
  });
  it("replays a completed fixture report before R2/Images and stale CAS effects", async () => {
    const owner = await create(); await seedAsset(); const requestKey = key(), payload = input({ reporter_entity_id: "contributor_functional1" });
    const first = await post(owner, payload, requestKey); expect(first.status).toBe(201); const body = await first.json();
    await bindings.SCENARIO_ASSETS!.delete("assets/asset_synthetic01");
    const replay = await post(owner, payload, requestKey); expect(replay.status).toBe(201); expect(await replay.json()).toEqual(body);
    const missing = await post(await current(owner), payload); expect(missing.status).toBe(503);
    const stale = await post(owner, input({ reporter_entity_id: "contributor_functional1", fixture_photo_id: null, media_id: "media_missing01" })); expect(stale.status).toBeGreaterThanOrEqual(400);
  });
  it("flags duplicate normalized images and never awards repeated or cross-participant reports", async () => {
    const owner = await create(), first = await join(owner, "contributor", "contributor_functional1"), second = await join(owner, "contributor", "contributor_functional1");
    const a = await ready(first), b = await ready(second); expect(a.media.sha256).toBe(b.media.sha256);
    expect((await post(first, input({ media_id: a.media.media_id, fixture_photo_id: null }))).status).toBe(201);
    const duplicate = await post(await current(second), input({ media_id: b.media.media_id, fixture_photo_id: null })); expect(duplicate.status).toBe(201);
    expect(parseSchema("ReportResponse", await duplicate.json()).data).toMatchObject({ status: "needs_clarification", reason_codes: ["DUPLICATE_IMAGE"], award_id: null });
  });
  it("does not give a delayed capture the newer incident epoch", async () => {
    let owner = await create("native", "scn_drivercase1"); const driver = await join(owner, "driver", "drv_moto01"); owner = await minute(owner, 3.5);
    const quick = { kind: "driver", input_mode: "quick", quick_condition: "impassable", segment_id: "seg_edge27", coordinate: [106.701,10.7705],
      captured_at: "2026-10-31T00:02:30Z", captured_sim_minute: 2.5, vehicle_types: ["motorbike"], description: "Synthetic delayed capture" };
    const response = await post(await current(driver), quick); expect(response.status).toBe(201);
    expect(parseSchema("ReportResponse", await response.json()).data).toMatchObject({ status: "needs_clarification", observation_ids: [] });
    const knowledge = parseSchema("KnowledgeResponse", await (await call(`/sessions/${owner.id}/knowledge`, { headers: headers(owner) })).json()).data!;
    expect(knowledge.segments.find(pair => pair.segment_id === "seg_edge27" && pair.vehicle_type === "motorbike")?.observation_ids).toEqual(["obs_bike001"]);
  });
});
