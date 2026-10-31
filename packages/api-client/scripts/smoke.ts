import assert from "node:assert/strict";
import { ApiClient, nativeCredentials, RequestScope, parseSse, EventCursor } from "../src";
import { operations, schemas, tools, getImageReviewModelOutputSchema, CONTRACT_SOURCE_SHA256 } from "@floodops/contracts";
import examples from "../../contracts/definition/contract-definition.json";

// Deterministic in-process transport smoke, not a backend/model/device E2E test.
const fixture = examples["contract-examples.json"].examples.find(e => e.name === "image_review_job_response_running_envelope")!;
const envelope = fixture.payload as unknown as { data: { session_id: string; generation: number; report_id: string }; meta: { request_id: string } };
let calls = 0;
const client = new ApiClient({ baseUrl: "https://floodops.example/api/v1",
  credentials: nativeCredentials(() => "synthetic-smoke-token-".repeat(2)),
  fetch: async (url, init) => {
    calls++; assert(url.endsWith("/image-review-jobs")); assert.equal(init.method, "POST");
    assert.equal(init.body, "{}"); assert.equal(new Headers(init.headers).get("If-Match"), null);
    return Response.json(fixture.payload, { status: 202 });
  } });
const path = { session_id: envelope.data.session_id, report_id: envelope.data.report_id };
const scope = new RequestScope(path.session_id, envelope.data.generation);
const result = await client.request("createReportImageReview", { path,
  headers: { "Idempotency-Key": "smoke_key_000000000001" }, body: {} }, { scope });
assert.equal(result.body.data.status, "running"); assert.equal(result.body.data.result, null);
const event = { event_id: "event_smoke0001", event_sequence: 1, session_id: path.session_id, generation: scope.generation,
  revision: 1, sim_minute: 0, type: "image_review_changed", actor: "system", resource_ids: [path.report_id],
  reason_code: "Nhận xét ảnh", replacement_session_id: null, created_at: "2026-10-31T00:00:00Z" };
const bytes = new TextEncoder().encode(`id: 1\nevent: image_review_changed\ndata: ${JSON.stringify(event)}\n\nevent: cursor\ndata: {"next_sequence":3}\n\n`);
let position = 0;
const stream = new ReadableStream<Uint8Array>({ pull(controller) {
  if (position === bytes.length) controller.close(); else controller.enqueue(bytes.slice(position, ++position));
} });
const cursor = new EventCursor(path.session_id, scope.generation, 0);
let events = 0;
for await (const frame of parseSse(stream)) if (cursor.applyFrame(frame)) events++;
assert.equal(events, 1); assert.equal(cursor.after, 3);
assert.equal(Object.keys(getImageReviewModelOutputSchema().properties).length, 5);
console.log(JSON.stringify({ smoke: "in-process-transport", operations: Object.keys(operations).length,
  schemas: Object.keys(schemas).length, commander_tools: Object.keys(tools).length, calls,
  job_status: result.body.data.status, result: result.body.data.result, visible_events: events,
  cursor: cursor.after, source_sha256: CONTRACT_SOURCE_SHA256 }));
