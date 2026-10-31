import { afterEach, describe, expect, it } from "vitest";
import { reset } from "cloudflare:test";
import { parseSchema } from "@floodops/contracts";
import { activeStreamCount, composed, createComposed, memberHeaders } from "../capabilities/composed-http-fixtures";
import { joinComposed, openComposedStream, readUntilClosed, resetComposed, resetEvents } from "./reset-stream-fixtures";
afterEach(reset);
describe("already-open SSE terminal Reset delivery", () => {
  it.each(["dispatcher", "driver", "contributor", "viewer"] as const)("delivers canonical Reset and replacement ID to %s before EOF", async role => {
    const owner = await createComposed(); const member = role === "dispatcher" ? owner : await joinComposed(owner, role);
    const stream = await openComposedStream(member);
    const resetResponse = await resetComposed(owner); expect(resetResponse.status).toBe(201);
    const replacement = parseSchema("ResetResultResponse", await resetResponse.json()).data!.replacement;
    const text = await readUntilClosed(stream); const terminal = resetEvents(text);
    expect(terminal).toHaveLength(1); expect(terminal[0]!.replacement_session_id).toBe(replacement.session.session_id);
    expect(terminal[0]!.session_id).toBe(owner.id); expect(terminal[0]!.generation).toBe(0); expect(terminal[0]!.resource_ids).toEqual([]);
    expect(text.includes(owner.token) || text.includes(member.token) || text.includes(replacement.credential.access_token!)).toBe(false);
    expect(await activeStreamCount(owner)).toBe(0);
    expect((await composed(`/sessions/${owner.id}/identity`, { headers: memberHeaders(member) })).status).toBe(410);
    expect((await composed(`/sessions/${owner.id}/events?after=0`, { headers: memberHeaders(member) })).status).toBe(410);
    expect((await composed(`/sessions/${owner.id}/events/stream?after=0`, { headers: memberHeaders(member) })).status).toBe(410);
    expect((await composed(`/sessions/${replacement.session.session_id}/identity`, { headers: memberHeaders(member) })).status).toBe(401);
  });
});
