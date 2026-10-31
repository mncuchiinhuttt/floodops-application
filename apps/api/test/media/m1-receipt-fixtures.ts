import { parseSchema } from "@floodops/contracts";
import type { Report, RewardPolicyRef, SubmitReportInput } from "@floodops/contracts";
import { createSessionRuntimeClient } from "../../src/shared/index";
import type { Member } from "./helpers";
import { bindings, call, current, headers, key, sessionContext } from "./review-adapter-fixtures";
export { bindings, call, citizen, createV2, current, headers, join, key, ready, resetSession,
  sessionContext, snapshot, sources, submit, transitionContext } from "./review-adapter-fixtures";
export const policyA: RewardPolicyRef = { policy_id: "policy_receiptA01", version: "explicit-test-A", config_hash: "a".repeat(64) };
export const policyB: RewardPolicyRef = { policy_id: "policy_receiptB01", version: "explicit-test-B", config_hash: "b".repeat(64) };
export async function configure(member: Member, policy: RewardPolicyRef | null) {
  const reply = await createSessionRuntimeClient(bindings).dispatch({ ...sessionContext(member), kind: "command", name: "test-receipt-policy",
    path: "test-receipt-policy", key: key(), payload: { policy } });
  if (reply.status !== 200) throw new Error(`Server test policy setup failed ${reply.status}`);
  return reply;
}
export async function readReport(member: Member, reportId: string): Promise<Report> {
  const response = await call(`/sessions/${member.id}/reports/${reportId}`, { headers: headers(member) });
  if (response.status !== 200) throw new Error(`Read report failed ${response.status}`);
  return parseSchema("ReportResponse", await response.json()).data!;
}
export async function postRaw(member: Member, input: unknown): Promise<Response> {
  return call(`/sessions/${member.id}/reports`, { method: "POST", headers: headers(member, {
    "Content-Type": "application/json", "Idempotency-Key": key(), "If-Match": (await current(member)).etag }), body: JSON.stringify(input) });
}
export const driverText = (): SubmitReportInput => ({ kind: "driver", input_mode: "text", quick_condition: null, segment_id: "seg_edge27",
  coordinate: [106.701, 10.7705], captured_at: "2026-10-31T00:00:00Z", captured_sim_minute: 0, vehicle_types: ["motorbike"],
  description: "Synthetic text requiring deterministic manual clarification" });
