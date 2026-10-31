import { expect, test, vi } from "vitest";
import { waitFor } from "@testing-library/react";
import { RequestScope, type FetchAdapter } from "@floodops/api-client";
import { WebRuntime } from "../src/app/runtime";
import { SessionCommands } from "../src/features/session/runtime/commands";
import { readOptions } from "../src/app/queries";
import { followSession } from "../src/features/session/runtime/foreground";
import type { Identity } from "@floodops/contracts";
import { identity, now, session } from "../preview/fixtures";
const csrf = "c".repeat(32);
const owner = (): Identity => ({ ...identity("dispatcher"), participant: { ...identity("dispatcher").participant, permissions: [...identity("dispatcher").participant.permissions, "session:read", "simulation:reset"] }, csrf_token: csrf });
const meta = { request_id: "test-runtime", session_id: session.session_id, generation: 1, revision: 4, event_sequence: 8 };
const envelope = (data: unknown, status = 200, responseMeta = meta) => Response.json({ success: true, data, error: null, meta: responseMeta }, { status });
const created = () => ({ session, participant: owner().participant, credential: { client_type: "web", access_token: null, csrf_token: csrf, expires_at: session.expires_at } });
function runtime(fetch: FetchAdapter) { return new WebRuntime({ baseUrl: "/api/v1", fetch, now: () => now }); }

test("session admission keeps credentials only in memory and clears previous query/principal scope", async () => {
  const fetch = vi.fn<FetchAdapter>(async () => envelope(created(), 201)); const app = runtime(fetch);
  app.adopt(owner()); const previous = app.context().scope; app.queries.setQueryData(["old"], { privateValue: "synthetic" });
  const next = await new SessionCommands(app).create({ scenario_id: session.scenario_id, scenario_version: "1", client_type: "web" });
  expect(next.csrf_token).toBe(csrf); expect(previous.signal.aborted).toBe(true); expect(app.queries.getQueryData(["old"])).toBeUndefined();
  const options = fetch.mock.calls[0]![1]; expect(options.credentials).toBe("include");
  expect(new Headers(options.headers).has("Authorization")).toBe(false); expect(new Headers(options.headers).get("X-Client-Request-Scope")?.length).toBeGreaterThanOrEqual(32);
  app.dispose();
});
test("body-loss retry is explicit and retains original admission key/body", async () => {
  let count = 0; const fetch = vi.fn<FetchAdapter>(async () => { if (!count++) throw new Error("lost"); return envelope(created(), 201); });
  const app = runtime(fetch), commands = new SessionCommands(app);
  await expect(commands.create({ scenario_id: session.scenario_id, scenario_version: "1", client_type: "web" })).rejects.toThrow();
  expect(fetch).toHaveBeenCalledTimes(1); expect(commands.hasAdmission()).toBe(true);
  await commands.retryAdmission(); expect(fetch).toHaveBeenCalledTimes(2);
  expect(fetch.mock.calls[0]![1].body).toBe(fetch.mock.calls[1]![1].body);
  expect(new Headers(fetch.mock.calls[0]![1].headers).get("Idempotency-Key")).toBe(new Headers(fetch.mock.calls[1]![1].headers).get("Idempotency-Key"));
  app.dispose();
});
test("post-command forced identity refresh starts after earlier in-flight read", async () => {
  let release!: (response: Response) => void, count = 0;
  const fetch = vi.fn<FetchAdapter>(async () => ++count === 1 ? new Promise<Response>(resolve => { release = resolve; }) :
    envelope({ ...owner(), session: { ...session, revision: 5 } }, 200, { ...meta, revision: 5 }));
  const app = runtime(fetch); app.adopt(owner());
  const earlier = app.ensureIdentity(session.session_id, undefined, true); const afterCommand = app.refresh();
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1)); release(envelope(owner())); await earlier; await afterCommand;
  expect(fetch).toHaveBeenCalledTimes(2); expect(app.context().identity.session.revision).toBe(5); app.dispose();
});
test("principal replacement aborts old requests and removes cache without transferring fields", () => {
  const app = runtime(async () => envelope(owner())); app.adopt(owner()); const scope = app.context().scope;
  app.queries.setQueryData(["session", session.session_id, "old"], { draft: "Owner A only" });
  app.adopt({ ...owner(), participant: { ...owner().participant, participant_id: "participant_another001" } });
  expect(scope.signal.aborted).toBe(true); expect(app.queries.getQueryCache().getAll()).toHaveLength(0);
  expect(app.context().identity.participant.participant_id).toBe("participant_another001"); app.dispose();
});
test("offline admissions/commands do not create a paused mutation or send transport", async () => {
  const fetch = vi.fn<FetchAdapter>(async () => envelope(created(), 201)); const app = runtime(fetch); app.adopt(owner()); app.setOnline(false);
  const commands = new SessionCommands(app);
  expect(() => commands.create({ scenario_id: session.scenario_id, scenario_version: "1", client_type: "web" })).toThrow(/offline/);
  await expect(commands.logout()).rejects.toThrow(/offline/); expect(fetch).not.toHaveBeenCalled();
  expect(app.queries.getMutationCache().getAll()).toHaveLength(0); app.dispose();
});
test("terminal event from authorized stream removes session and cached private resources", async () => {
  const event = { event_id: "event_terminal001", event_sequence: 9, session_id: session.session_id, generation: 1, revision: 4, sim_minute: 12,
    type: "session_expired", actor: "system", resource_ids: [], reason_code: null, replacement_session_id: null, created_at: "2026-10-31T01:00:00Z" };
  const fetch = vi.fn<FetchAdapter>(async () => envelope({ events: [event], next_sequence: 9, has_more: false }, 200, { ...meta, event_sequence: 9 }));
  const app = runtime(fetch); app.adopt(owner()); app.eventMeta = meta; app.queries.setQueryData(["private"], "cached");
  await followSession(app, new RequestScope(session.session_id, 1), vi.fn());
  expect(app.snapshot().identity).toBeNull(); expect(app.queries.getQueryCache().getAll()).toHaveLength(0); app.dispose();
});

test("queued refresh cannot resurrect old authority after clear/replace/dispose", async () => {
  for (const operation of ["clear", "replace", "dispose"]) {
    const fetch = vi.fn<FetchAdapter>(() => new Promise<Response>(() => undefined)), app = runtime(fetch); app.adopt(owner());
    const original = app.ensureIdentity(session.session_id, undefined, true), queued = app.refresh();
    const rejected = Promise.all([expect(original).rejects.toThrow(), expect(queued).rejects.toThrow()]);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    if (operation === "replace") app.adopt({ ...owner(), participant: { ...owner().participant, participant_id: "participant_replaced001" } });
    else if (operation === "dispose") app.dispose(); else app.clear();
    await rejected; expect(fetch).toHaveBeenCalledTimes(1); app.dispose();
  }
});
test("own Reset cancels identity read so late410 cannot cancel replacement response", async () => {
  let oldResponse!: (response: Response) => void, resetResponse!: (response: Response) => void;
  const fetch = vi.fn<FetchAdapter>(input => new Promise<Response>(resolve => { if (input.endsWith("/identity")) oldResponse = resolve; else resetResponse = resolve; }));
  const app = runtime(fetch); app.adopt(owner()); const oldScope = app.context().scope;
  const read = app.refresh(), rejectedRead = expect(read).rejects.toThrow(); await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
  const resetting = new SessionCommands(app).reset(); await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  oldResponse(Response.json({ success: false, data: null, error: { code: "SESSION_RESET", message: "old", details: [], retryable: false, current_revision: null, replacement_session_id: null }, meta }, { status: 410 }));
  await rejectedRead; expect(oldScope.signal.aborted).toBe(false);
  const replacement = { ...created(), session: { ...session, session_id: "session_replaced001", generation: 2 } };
  resetResponse(envelope({ old_session_id: session.session_id, replacement }, 201, { ...meta, session_id: "session_replaced001", generation: 2 }));
  await resetting; expect(app.context().identity.session.session_id).toBe("session_replaced001"); expect(oldScope.signal.aborted).toBe(true); app.dispose();
});

test("query options captured for an old principal cannot start with new credentials", async () => {
  const fetch = vi.fn<FetchAdapter>(async () => envelope(owner())), app = runtime(fetch); app.adopt(owner());
  const options = readOptions(app, "getSession", "session:read", "dispatcher", { path: { session_id: session.session_id } });
  app.adopt({ ...owner(), participant: { ...owner().participant, participant_id: "participant_replaced001" } });
  await expect(app.queries.fetchQuery(options)).rejects.toThrow(); expect(fetch).not.toHaveBeenCalled(); app.dispose();
});
