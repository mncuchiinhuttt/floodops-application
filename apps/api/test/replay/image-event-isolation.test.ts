import { afterEach, describe, expect, it } from "vitest";
import { reset } from "cloudflare:test";
import { parseSchema } from "@floodops/contracts";
import { create, invite, rpc } from "../capabilities/helpers";
import { emitMisdirected, eventActors, fieldRoles, legacyEvent, page, storedAudience, stream } from "./image-event-fixtures";
afterEach(reset);
describe("dispatcher-only image event authorization precedence", () => {
  it.each(fieldRoles)("never widens a new image event to explicitly targeted %s", async role => {
    const owner = await create(); const target = await invite(owner, role);
    const result = await emitMisdirected(owner, [target], [role]); expect(result.status).toBe(200);
    const hidden = await page(target); expect(hidden.events).toHaveLength(0); expect(hidden.next_sequence).toBe(1);
    expect(await storedAudience(owner)).toEqual({ roles: ["dispatcher"], participants: [] });
    const identity = await rpc(owner, {}); expect(identity.body.meta.revision).toBe(0); expect(identity.body.meta.event_sequence).toBe(1);
  });
  it("keeps owner and invited dispatcher visibility without advice or credentials", async () => {
    const owner = await create(); const dispatcher = await invite(owner, "dispatcher"); const target = await invite(owner, "viewer");
    expect((await emitMisdirected(owner, [target], ["viewer"])).status).toBe(200);
    for (const f of [owner, dispatcher]) {
      const events = (await page(f)).events; expect(events).toHaveLength(1);
      expect(events[0]!.type).toBe("image_review_changed"); expect(events[0]!.resource_ids).toEqual(["report_report01", "imagejob_job0001"]);
      expect(Object.keys(events[0]!).sort()).toEqual(["actor", "created_at", "event_id", "event_sequence", "generation", "reason_code", "replacement_session_id", "resource_ids", "revision", "session_id", "sim_minute", "type"]);
    }
    const s = await stream(dispatcher);
    try { expect(await s.next()).toContain("event: image_review_changed"); } finally { await s.reader.cancel(); }
  });
  const legacyCases = eventActors.flatMap(actor => fieldRoles.map(role => ({ actor, role })));
  it.each(legacyCases)("denies legacy $actor image events targeting $role by role and participant ID", async ({ actor, role }) => {
    const owner = await create(); const target = await invite(owner, role);
    // Cover both the actual v1 dispatcher-role/field-ID row and misconfigured field-role rows.
    const audience = actor === "system" || actor === "model" ? ["dispatcher" as const] : [role];
    await legacyEvent(owner, target, actor, "image_review_changed", audience);
    const hidden = await page(target, 0, 1); expect(hidden.events).toHaveLength(0); expect(hidden.next_sequence).toBe(1);
    // Event type owns visibility even when legacy row audience excludes dispatcher.
    const visible = await page(owner); expect(visible.events).toHaveLength(1); expect(visible.events[0]!.actor).toBe(actor);
    const s = await stream(target);
    try {
      const text = await s.next(); expect(text).toContain('"next_sequence":1'); expect(text).not.toContain("image_review_changed");
      expect(text).not.toContain("report_report01"); expect(text).not.toContain("imagejob_job0001");
    } finally { await s.reader.cancel(); }
  });
  it.each(fieldRoles)("preserves ordinary participant-targeted events for %s", async role => {
    const owner = await create(); const target = await invite(owner, role); const unrelated = await invite(owner, "dispatcher");
    await legacyEvent(owner, target, "community", "report_changed", []);
    expect((await page(target)).events.map(e => e.type)).toEqual(["report_changed"]);
    expect((await page(unrelated)).events).toHaveLength(0);
  });
  it("scans hidden image rows without skipping the next participant event", async () => {
    const owner = await create(); const target = await invite(owner, "contributor");
    await legacyEvent(owner, target, "model", "image_review_changed", ["contributor"]);
    await legacyEvent(owner, target, "community", "report_changed", []);
    const first = await page(target, 0, 1); expect(first).toEqual({ events: [], next_sequence: 1, has_more: true });
    const second = await page(target, first.next_sequence, 1);
    expect(second.events.map(e => e.type)).toEqual(["report_changed"]); expect(second.next_sequence).toBe(2); expect(second.has_more).toBe(false);
  });
  it.each(fieldRoles)("matches JSON visibility while an active SSE stream polls for %s", async role => {
    const owner = await create(); const target = await invite(owner, role);
    const targetStream = await stream(target); const ownerStream = await stream(owner);
    try {
      const targetRead = targetStream.next(); const ownerRead = ownerStream.next();
      expect((await emitMisdirected(owner, [target], [role])).status).toBe(200);
      const [targetText, ownerText] = await Promise.all([targetRead, ownerRead]);
      expect(targetText).toContain('"next_sequence":1'); expect(targetText).not.toContain("image_review_changed"); expect(targetText).not.toContain("imagejob_job0001");
      expect(ownerText).toContain("event: image_review_changed");
      expect(parseSchema("EventPage", await page(target)).events).toHaveLength(0);
      expect((await page(owner)).events.map(e => e.type)).toEqual(["image_review_changed"]);
    } finally { await targetStream.reader.cancel(); await ownerStream.reader.cancel(); }
  });
});
