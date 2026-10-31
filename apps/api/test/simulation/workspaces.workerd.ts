import { afterEach, expect, it } from "vitest";
import { reset } from "cloudflare:test";
import { parseSchema } from "@floodops/contracts";
import { sourceState } from "@floodops/domain/reporting";
import { create, invite, request, auth, mutate, snapshot, start, key, fixture } from "./runtime-fixtures";

afterEach(reset);
it("public producer workspace views show actual same-revision fleet/knowledge/clock/results and enforce roles", async () => {
  const f = await create();
  const response = await request(`/sessions/${f.id}/snapshot`, { headers: auth(f) });
  expect(response.status).toBe(200);
  const body = parseSchema("SessionSnapshotResponse", await response.json()), data = body.data!;
  expect(data.operations.branches.find(branch => branch.branch_id === "floodops")!.drivers.length).toBe(2);
  expect(data.operations.branches.find(branch => branch.branch_id === "floodops")!.orders.length).toBe(3);
  expect(data.knowledge.segments.length).toBeGreaterThan(0);
  expect(data.session.revision).toBe(body.meta.revision); expect(data.clock.now_minute).toBe(data.session.sim_minute);
  expect(data.latest_plan).toBeNull(); expect(data.active_job).toBeNull();
  const reserved = await start(f);
  // Baseline Planner impact cannot project a pending advance. Do not forge a paused/empty impact.
  const unavailable = await request(`/sessions/${f.id}/snapshot`, { headers: auth(f) });
  expect(unavailable.status).toBe(503); expect(parseSchema("ErrorResponse", await unavailable.json()).error?.code).toBe("CONFIG_INCOMPLETE");
  const advancing = parseSchema("SimulationClockResponse", await (await request(`/sessions/${f.id}/simulation`, { headers: auth(f) })).json()).data!;
  expect(advancing.mode).toBe("advancing"); expect(advancing.advance_job?.status).toBe("queued");
  const viewer = await invite(f, "viewer"), driver = await invite(f, "driver"), contributor = await invite(f, "contributor");
  for (const member of [viewer, driver, contributor]) expect((await request(`/sessions/${f.id}/snapshot`, { headers: auth(member) })).status).toBe(403);
  const overview = await request(`/sessions/${f.id}/overview`, { headers: auth(viewer) }); expect(overview.status).toBe(200);
  const value = parseSchema("ViewerOverviewResponse", await overview.json()).data!;
  expect(Object.keys(value).sort()).toEqual(["coverage", "results", "scenario", "session"]);
  expect(value.session.revision).toBe(1); expect(value.results.observed_until_minute).toBe(0);
  expect((await request(`/sessions/${f.id}/drivers/me`, { headers: auth(viewer) })).status).toBe(403);
  expect((await request(`/sessions/${f.id}/contributors/me`, { headers: auth(driver) })).status).toBe(403);
  expect(reserved.status).toBe(200);
});

it("driver dashboard filters committed orders/routes and current-generation reports by exact participant", async () => {
  const f = await create(), a = await invite(f, "driver"), b = await invite(f, "driver"), car = await invite(f, "driver", "drv_auto01");
  await mutate(f, state => {
    const source = sourceState(state.values);
    for (const [report_id, participant, generation] of [["report_current1", a.created.participant, 0], ["report_foreign1", b.created.participant, 0], ["report_oldgen01", a.created.participant, 99]] as const) {
      const report = parseSchema("Report", { report_id, participant_id: participant.participant_id, reporter_entity_id: participant.bound_entity_id,
        kind: "driver", segment_id: "seg_edge17", coordinate: null, captured_at: "2026-10-31T00:00:00Z", captured_sim_minute: 0,
        received_at: "2026-10-31T00:00:00Z", vehicle_types: ["motorbike"], description: "Synthetic dashboard privacy fixture", media_id: null,
        fixture_photo_id: null, status: "pending_review", reason_codes: [], observation_ids: [], award_id: null, input_revision: 0,
        observation_candidates: [], input_mode: "quick", quick_condition: "normal", reward: { status: "pending_config", policy: null, reason_code: "POLICY_NOT_CONFIGURED", award_id: null },
        review_result_id: null, reviewed_at: null });
      source.reports[report_id] = { report, generation, originalSubmitter: participant, boundVehicleTypes: ["motorbike"],
        capturedEpochs: [], sourceId: "source_testfixture1", normalizedDigest: "d".repeat(64) };
    }
    state.values.sourcesMedia = source;
  });
  for (const member of [a, car]) {
    const response = await request(`/sessions/${f.id}/drivers/me`, { headers: auth(member) }); expect(response.status).toBe(200);
    const text = await response.text();
    expect(text.includes("originalSubmitter")).toBe(false); expect(text.includes("normalizedDigest")).toBe(false); expect(text.includes("capturedEpochs")).toBe(false);
    const data = parseSchema("DriverDashboardResponse", JSON.parse(text)).data!;
    expect(data.driver_id).toBe(member.created.participant.bound_entity_id);
    expect(data.assigned_orders.every(order => order.driver_id === data.driver_id)).toBe(true);
    expect(data.route_ids.length).toBeGreaterThan(0);
    expect(data.own_reports.map(report => report.report_id)).toEqual(member === a ? ["report_current1"] : []);
  }
});

it("missing true producer, dangling latest pointers, invalid routes and old serialization fail closed", async () => {
  for (const fault of ["missing_impact", "routes_missing", "routes_duplicate", "old_marker", "dangling"]) {
    const f = await create(), driver = await invite(f, "driver");
    await mutate(f, state => {
      state.values.test_workspace_fault = fault;
      if (fault === "old_marker") state.values.runtime_contract = { serialization: "legacy", version: "0.3" };
      if (fault === "dangling") state.pointers.latest_plan_id = "plan_missing01";
    });
    const endpoint = fault.startsWith("routes") ? "/drivers/me" : "/snapshot";
    const response = await request(`/sessions/${f.id}${endpoint}`, { headers: auth(fault.startsWith("routes") ? driver : f) });
    expect(response.status).toBe(503); expect(parseSchema("ErrorResponse", await response.json()).error?.code).toBe("CONFIG_INCOMPLETE");
  }
});

it("Reset isolates workspace generation and fresh v2 marker without rewriting legacy evidence", async () => {
  const f = await create();
  await mutate(f, state => { state.values.runtime_contract = { serialization: "legacy", version: "0.3" }; state.values.kept_legacy = "retained"; });
  const resetResponse = await request(`/sessions/${f.id}/resets`, { method: "POST", headers: auth(f, { "Content-Type": "application/json", "Idempotency-Key": key(), "If-Match": f.etag }), body: JSON.stringify({ client_type: "native", confirm: true }) });
  expect(resetResponse.status).toBe(201); const replacement = fixture(parseSchema("ResetResultResponse", await resetResponse.json()).data!.replacement);
  const result = await request(`/sessions/${replacement.id}/snapshot`, { headers: auth(replacement) }); expect(result.status).toBe(200);
  expect(parseSchema("SessionSnapshotResponse", await result.json()).data?.session.generation).toBe(1);
  expect((await snapshot(f)).values.kept_legacy).toBe("retained");
  expect((await request(`/sessions/${f.id}/snapshot`, { headers: auth(f) })).status).toBe(410);
});
