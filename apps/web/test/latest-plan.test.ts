import { expect, test } from "vitest";
import { latestPlanReason } from "../src/app/latest-plan";
import { plan } from "../preview/plan-fixture";
test("cached matching latest pointer cannot enable commands after failed refetch", () => {
  const cached = { plan, latest: plan, snapshotRevision: 4, currentRevision: 4, fetching: false, snapshotReady: true };
  expect(latestPlanReason(cached)).toBeUndefined();
  expect(latestPlanReason({ ...cached, snapshotReady: false })).toBeDefined();
  expect(latestPlanReason({ ...cached, fetching: true })).toBeDefined();
  expect(latestPlanReason({ ...cached, latest: { ...plan, planning_job_id: "job_superseded001" } })).toBeDefined();
});
