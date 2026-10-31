import { afterEach, expect, it } from "vitest";
import { reset } from "cloudflare:test";
import { parseSchema } from "@floodops/contracts";
import { ports, sourceReview } from "./review-adapter-worker";
import { accept, call, citizen, createV2, current, headers, join, key, ready, rewards, snapshot, sources, submit, transitionContext } from "./review-adapter-fixtures";
afterEach(reset);
it("real v2 quick-driver submission conflicts with citizen acceptance; kept accepted photo can award once on resolution", async () => {
  const owner = await createV2(), driver = await join(owner, "driver", "drv_moto01"), contributor = await join(owner, "contributor", "contributor_functional1");
  const quick = await submit(driver, { kind: "driver", input_mode: "quick", quick_condition: "impassable", segment_id: "seg_edge27",
    coordinate: [106.701, 10.7705], captured_at: "2026-10-31T00:00:00Z", captured_sim_minute: 0, vehicle_types: ["motorbike"], description: "Synthetic driver contradiction" });
  expect(quick.status).toBe("accepted"); expect(quick.award_id).toBeNull();
  const { media } = await ready(contributor), citizenReport = await submit(contributor, citizen(media.media_id));
  const accepted = await accept(owner, citizenReport.report_id); expect(accepted.status).toBe(200);
  const result = parseSchema("ReportReviewResultResponse", await accepted.json()).data!; expect(result.report.status).toBe("accepted"); expect(result.award).toBeNull();
  const conflicted = await snapshot(owner), state = sourceReview.read(await transitionContext(owner, conflicted));
  const conflict = state.conflicts.find(item => item.status === "unresolved" && item.segment_id === "seg_edge27" && item.vehicle_type === "motorbike");
  expect(conflict).toBeDefined(); expect(sourceReview.image(conflicted, result.report)).toMatchObject({ ready: true, duplicate: false, normalized_hash: media.sha256 });
  const requestKey = key(), etag = (await current(owner)).etag;
  const resolve = () => call(`/sessions/${owner.id}/conflicts/${conflict!.conflict_id}/resolutions`, { method: "POST",
    headers: headers(owner, { "Content-Type": "application/json", "Idempotency-Key": requestKey, "If-Match": etag }), body: JSON.stringify({
      keep_observation_ids: result.observations.map(item => item.observation_id), supersede_observation_ids: quick.observation_ids,
      reason: "Dispatcher retains the synthetic citizen evidence" }) });
  const response = await resolve(); expect(response.status).toBe(200);
  const resolution = parseSchema("ConflictResolutionResultResponse", await response.json()).data!;
  expect(resolution.conflict.status).toBe("resolved"); expect(resolution.awards).toHaveLength(1); expect(resolution.awards[0]?.report_id).toBe(citizenReport.report_id);
  const committed = await snapshot(owner), run = ports.simulationPersistence.read(committed.values);
  expect(run.knowledge.find(pair => pair.segment_id === "seg_edge27" && pair.vehicle_type === "motorbike")?.state).toBe("known");
  expect(run.knowledge.find(pair => pair.segment_id === "seg_edge27" && pair.vehicle_type === "car")?.state).toBe("ordinary_unknown");
  expect(run.sourceSnapshot.observations.find(item => quick.observation_ids.includes(item.observation_id))?.validation).toBe("superseded");
  expect(rewards(committed)?.ledger.awards).toHaveLength(1); expect(sources(committed).reports[citizenReport.report_id]?.report.award_id).toBe(resolution.awards[0]?.award_id);
  expect((await resolve()).status).toBe(200); expect((await snapshot(owner)).values).toEqual(committed.values);
});
