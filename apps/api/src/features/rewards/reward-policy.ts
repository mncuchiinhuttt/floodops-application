import { createHash } from "node:crypto";
import { parseSchema } from "@floodops/contracts";
import type { RewardPolicyRef } from "@floodops/contracts";
import type { RewardConfig } from "@floodops/domain/rewards";
import type { ReviewOptions } from "../reports/review/runtime-types";

/** Explicit archived configuration, with no production amount or latest-policy fallback. */
export interface RewardPolicyPayload {
  policy_id: string; version: string; basis: "per_report";
  points_per_report: number; eligible_source_ids: readonly string[];
}
export function prepareRewardPolicy(payload: RewardPolicyPayload): RewardConfig {
  if (Object.keys(payload).some(key => !["policy_id", "version", "basis", "points_per_report", "eligible_source_ids"].includes(key)) || payload.basis !== "per_report" || !Number.isSafeInteger(payload.points_per_report) || payload.points_per_report < 1
    || !Array.isArray(payload.eligible_source_ids) || new Set(payload.eligible_source_ids).size !== payload.eligible_source_ids.length) {
    throw new Error("Invalid explicit reward policy payload");
  }
  const sourceIds = payload.eligible_source_ids.map(id => parseSchema("Id", id)).sort();
  const canonical = JSON.stringify({ policy_id: payload.policy_id, version: payload.version, basis: payload.basis,
    points_per_report: payload.points_per_report, eligible_source_ids: sourceIds });
  const policy = parseSchema("RewardPolicyRef", { policy_id: payload.policy_id, version: payload.version,
    config_hash: createHash("sha256").update(canonical).digest("hex") });
  return Object.freeze({ policy: Object.freeze(policy), points_per_report: payload.points_per_report,
    eligible_source_ids: Object.freeze(sourceIds) });
}
/** Strictly load the versioned demo document; malformed or disabled config is absent. */
export function loadDemoRewardPolicy(document: unknown, enabled = true): RewardConfig | null {
  if (!enabled || typeof document !== "object" || document === null || Array.isArray(document)) return null;
  const fields = document as Record<string, unknown>, keys = Object.keys(fields);
  if (keys.length !== 4 || keys.some(key => !["provenance", "calibration", "note", "reward"].includes(key))
    || fields.provenance !== "documented_assumption" || fields.calibration !== "incomplete"
    || typeof fields.note !== "string" || fields.note.length < 40 || fields.note.length > 280) return null;
  const rawReward = fields.reward;
  if (typeof rawReward !== "object" || rawReward === null || Array.isArray(rawReward)) return null;
  const reward = rawReward as Record<string, unknown>, rewardKeys = Object.keys(reward);
  const eligibleSourceIds = reward.eligible_source_ids;
  if (rewardKeys.length !== 5 || rewardKeys.some(key => !["policy_id", "version", "basis", "points_per_report", "eligible_source_ids"].includes(key))
    || typeof reward.policy_id !== "string" || typeof reward.version !== "string" || reward.basis !== "per_report"
    || typeof reward.points_per_report !== "number" || !Array.isArray(eligibleSourceIds)
    || eligibleSourceIds.some(sourceId => typeof sourceId !== "string")) return null;
  try {
    return prepareRewardPolicy({ policy_id: reward.policy_id, version: reward.version, basis: reward.basis,
      points_per_report: reward.points_per_report, eligible_source_ids: eligibleSourceIds.map(sourceId => parseSchema("Id", sourceId)) });
  } catch { return null; }
}

const same = (a: RewardPolicyRef, b: RewardPolicyRef) => a.policy_id === b.policy_id && a.version === b.version && a.config_hash === b.config_hash;
/** Missing/corrupt archives cannot block human review or create guessed points. */
export function resolvePinnedReward(options: ReviewOptions, receipt: RewardPolicyRef | null): RewardConfig | null {
  if (!receipt || !options.resolveRewardPolicy) return null;
  try {
    const found = options.resolveRewardPolicy(Object.freeze({ ...receipt }));
    if (!found) return null;
    const checked = prepareRewardPolicy({ policy_id: found.policy.policy_id, version: found.policy.version, basis: "per_report", points_per_report: found.points_per_report,
      eligible_source_ids: found.eligible_source_ids });
    return same(receipt, checked.policy) && same(found.policy, checked.policy) ? checked : null;
  } catch { return null; }
}
