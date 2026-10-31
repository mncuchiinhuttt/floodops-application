/** Synthetic transport only; this test creates no real capability or invitation. */
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { FetchAdapter } from "@floodops/api-client";
import { WebRuntime } from "../src/app/runtime";
import { RuntimeProvider } from "../src/app/context";
import { SessionCommands } from "../src/features/session/runtime/commands";
import { Invitations } from "../src/features/session/runtime/invitations";
import { identity, now, session } from "./fixtures";
afterEach(cleanup);
test("invitation adapter sends frozen role/binding; response code stays masked outside query cache", async () => {
  const current = identity("dispatcher"); current.participant.permissions.push("participants:invite"); current.csrf_token = "c".repeat(32);
  const fakeToken = "synthetic-not-a-real-claim-token-0001";
  const fetch = vi.fn<FetchAdapter>(async input => Response.json({ success: true, error: null,
    data: input.endsWith("/invitations") ? { invite_id: "invite_synthetic001", claim_token: fakeToken, role: "driver", bound_entity_id: "driver_entity001", expires_at: session.expires_at } : current,
    meta: { request_id: "test-invite", session_id: session.session_id, generation: 1, revision: 4, event_sequence: 9 } }, { status: input.endsWith("/invitations") ? 201 : 200 }));
  const runtime = new WebRuntime({ baseUrl: "/api/v1", fetch, now: () => now }); runtime.adopt(current);
  render(<RuntimeProvider runtime={runtime}><Invitations commands={new SessionCommands(runtime)} /></RuntimeProvider>);
  expect(screen.queryByRole("option", { name: "Dispatcher" })).toBeNull();
  fireEvent.change(screen.getByLabelText("Entity ID được phép trong scenario"), { target: { value: "driver_entity001" } });
  fireEvent.submit(screen.getByRole("form", { name: "Tạo invitation" }));
  const field = await screen.findByLabelText("Mã dùng một lần") as HTMLInputElement;
  expect(field.type).toBe("password"); expect(field.value).toBe(fakeToken);
  expect(JSON.parse(fetch.mock.calls[0]![1].body as string)).toEqual({ role: "driver", bound_entity_id: "driver_entity001", expires_in_seconds: 300 });
  expect(new Headers(fetch.mock.calls[0]![1].headers).get("X-CSRF-Token")).toBe(current.csrf_token);
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  expect(runtime.queries.getQueryCache().getAll()).toHaveLength(0); runtime.dispose();
});
