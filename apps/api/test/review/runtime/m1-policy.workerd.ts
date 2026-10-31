import { afterEach, expect, it } from "vitest";
import { reset } from "cloudflare:test";
import { parseSchema } from "@floodops/contracts";
import { auth, create, domain, key, request, responseEtag, review, snapshot } from "./runtime-fixtures";
import { reportA, reportDriver } from "./source-fixture";
afterEach(reset);
it("later conflict resolution keeps original awarded policy/review identity/time without reaward", async () => {
  const owner = await create(), accepted = await review(owner, reportA);
  expect(accepted.response.status).toBe(200);
  const first = parseSchema("ReportReviewResultResponse", accepted.body).data!;
  const driver = await review(owner, reportDriver, { condition: "impassable", etag: responseEtag(accepted) });
  expect(driver.response.status).toBe(200);
  const conflicting = parseSchema("ReportReviewResultResponse", driver.body).data!;
  const conflict = domain(await snapshot(owner)).source.conflicts.find(item => item.status === "unresolved")!;
  const response = await request(`/sessions/${owner.id}/conflicts/${conflict.conflict_id}/resolutions`, { method: "POST",
    headers: auth(owner, { "Content-Type": "application/json", "Idempotency-Key": key(), "If-Match": responseEtag(driver) }),
    body: JSON.stringify({ keep_observation_ids: first.observations.map(item => item.observation_id),
      supersede_observation_ids: conflicting.observations.map(item => item.observation_id), reason: "Keep previously reviewed evidence" }) });
  expect(response.status).toBe(200); expect(parseSchema("ConflictResolutionResultResponse", await response.json()).data!.awards).toEqual([]);
  const after = domain(await snapshot(owner)); expect(after.source.reports.find(item => item.report_id === reportA)).toEqual(first.report);
  expect(after.rewards!.ledger.awards).toEqual([first.award]);
});
