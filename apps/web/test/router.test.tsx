import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { FetchAdapter } from "@floodops/api-client";
import { createApplication } from "../src/router";
import { WebRuntime } from "../src/app/runtime";
import { WebApplication } from "../src/app/application";
import { identity, now, session } from "./fixtures";
afterEach(cleanup);
const meta = { request_id: "test-router", session_id: session.session_id, generation: 1, revision: 4, event_sequence: 8 };
function runtime(role: "driver" | "dispatcher") {
  const current = { ...identity(role), csrf_token: "c".repeat(32) };
  const fetch = vi.fn<FetchAdapter>(async input => input.endsWith("/identity") ? Response.json({ success: true, data: current, error: null, meta }) :
    Response.json({ success: false, data: null, error: { code: "CONFIG_INCOMPLETE", message: "Not composed", details: [], retryable: false, current_revision: null, replacement_session_id: null }, meta }, { status: 503 }));
  return { app: new WebRuntime({ baseUrl: "/api/v1", fetch, now: () => now }), fetch };
}
test("deep-link dispatcher route cannot render privileged data with real driver identity", async () => {
  const { app, fetch } = runtime("driver"), application = createApplication(app, [`/sessions/${session.session_id}/dispatch/plans`]);
  render(<WebApplication application={application} />);
  expect(await screen.findByText("Capability hiện tại không cấp quyền này.", {}, { timeout: 10000 })).toBeDefined();
  expect(fetch.mock.calls.every(([url]) => url.endsWith("/identity"))).toBe(true); application.router.dispose();
}, 15000);
test("real workspace route exposes canonical503 instead of a fixture or fake dashboard", async () => {
  const { app, fetch } = runtime("driver"), application = createApplication(app, [`/sessions/${session.session_id}/driver`]);
  render(<WebApplication application={application} />);
  expect(await screen.findByText("Backend chưa cung cấp dữ liệu: CONFIG_INCOMPLETE (503).", {}, { timeout: 10000 })).toBeDefined();
  expect(fetch.mock.calls.some(([url]) => url.endsWith("/drivers/me"))).toBe(true);
  expect(screen.queryByText("order_fixture001 · critical")).toBeNull(); application.router.dispose();
}, 15000);

test("landing at the root renders its headline and sends demo links to /login", async () => {
  const { app } = runtime("dispatcher"), application = createApplication(app, ["/"]);
  render(<WebApplication application={application} />);
  expect(await screen.findByRole("heading", { name: "Delivery when roads flood" })).toBeDefined();
  const callsToDemo = screen.getAllByRole("link", { name: "Open demo" });
  expect(callsToDemo.every(link => link.getAttribute("href") === "/login")).toBe(true);
  application.router.dispose();
}, 15000);
