import { expect, test, vi } from "vitest";
import type { Event } from "@floodops/contracts";
import { ImageReviewRefresh, type ImageBinding } from "../src/features/reports/image-binding";
import { imageBinding, imageReview, session } from "./fixtures";
const event = (sequence: number): Event => ({ event_id: `event-${sequence}`, event_sequence: sequence, session_id: session.session_id, generation: session.generation,
  revision: session.revision, sim_minute: session.sim_minute, type: "image_review_changed", actor: "system", resource_ids: [imageBinding.reportId, imageBinding.jobId],
  reason_code: null, replacement_session_id: null, created_at: "2026-10-31T00:12:00Z" });
const response = (sequence: number) => ({ data: imageReview, meta: { request_id: "fixture", session_id: session.session_id, generation: 1, revision: 4, event_sequence: sequence } });
test("same-revision progress refetches by event sequence; duplicates and wrong scope do not", async () => {
  const load = vi.fn(async () => response(9)); const update = vi.fn();
  const refresh = new ImageReviewRefresh(() => imageBinding, load, update);
  expect(await refresh.onEvent(event(9))).toBe(true); expect(update).toHaveBeenCalledWith(imageReview);
  expect(await refresh.onEvent(event(9))).toBe(false);
  expect(await refresh.onEvent({ ...event(10), generation: 2 })).toBe(false);
  expect(await refresh.onEvent({ ...event(10), resource_ids: ["other-report"] })).toBe(false);
  expect(await refresh.onEvent({ ...event(10), session_id: "other-session" })).toBe(false);
  expect(load).toHaveBeenCalledTimes(1);
});
test("Reset/new job during load discards old output and new generation can restart sequence", async () => {
  let binding: ImageBinding | null = imageBinding;
  let resolve!: (value: ReturnType<typeof response>) => void;
  const update = vi.fn(); const load = vi.fn(() => new Promise<ReturnType<typeof response>>(done => { resolve = done; }));
  const refresh = new ImageReviewRefresh(() => binding, load, update);
  const pending = refresh.onEvent(event(9)); binding = { ...imageBinding, generation: 2 };
  resolve(response(9)); expect(await pending).toBe(false); expect(update).not.toHaveBeenCalled();
  const second = refresh.onEvent({ ...event(1), generation: 2 });
  resolve({ data: { ...imageReview, job: { ...imageReview.job!, generation: 2 } }, meta: { ...response(1).meta, generation: 2 } });
  expect(await second).toBe(true);
});
test("job/digest mismatch and older event response are discarded", async () => {
  const update = vi.fn();
  for (const wrong of [{ ...imageReview, job: { ...imageReview.job!, input_digest: "c".repeat(64) } },
    { ...imageReview, job: { ...imageReview.job!, job_id: "another-job" } }]) {
    const refresh = new ImageReviewRefresh(() => imageBinding, async () => ({ ...response(9), data: wrong }), update);
    expect(await refresh.onEvent(event(9))).toBe(false);
  }
  const refresh = new ImageReviewRefresh(() => imageBinding, async () => response(8), update);
  expect(await refresh.onEvent(event(9))).toBe(false); expect(update).not.toHaveBeenCalled();
});
