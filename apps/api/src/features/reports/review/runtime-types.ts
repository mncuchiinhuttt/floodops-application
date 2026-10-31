import type { Conflict, Observation, Report, RewardPolicyRef, SegmentKnowledge } from "@floodops/contracts";
import type { KnowledgePair } from "@floodops/domain/knowledge";
import type { EvidenceContext } from "@floodops/domain/sources";
import type { ReportContext } from "@floodops/domain/reporting";
import type { CoverageInput, RewardConfig, RewardLedger } from "@floodops/domain/rewards";
import type { Snapshot, TransitionContext } from "../../../shared/index";
import type { ImageConfig, ImageMetadata } from "./image/binding";

/** Private injected canonical source boundary; no full Sources factory is implied. */
export interface ReviewSourceState {
  readonly reports: readonly Report[];
  readonly knowledge: readonly SegmentKnowledge[];
  readonly conflicts: readonly Conflict[];
  readonly pairs: readonly KnowledgePair[];
  readonly relevantScope: CoverageInput["scope"];
  readonly evidence: EvidenceContext;
}
export interface SourceReviewPort {
  read(context: TransitionContext): ReviewSourceState;
  report(snapshot: Snapshot, reportId: string): Report | null;
  reportContext(context: TransitionContext, report: Report): ReportContext;
  image(snapshot: Snapshot, report: Report): ImageMetadata | null;
  apply(context: TransitionContext, change: {
    reports: readonly Report[]; observations: readonly Observation[]; knowledge: readonly SegmentKnowledge[]; conflicts: readonly Conflict[];
  }): Record<string, unknown>;
}
export interface ReviewAudit { report_id: string; decision: "accept" | "reject"; reason: string; actor_id: string; at: string }
export interface ReviewStore { ledger: RewardLedger; audit: readonly ReviewAudit[] }
export interface ReviewOptions {
  source: SourceReviewPort;
  resolveRewardPolicy?: (receipt: RewardPolicyRef) => RewardConfig | null;
  imageConfig?: ImageConfig;
  id?: (prefix: string) => string;
}
export const REVIEW_ACCEPT = "review:accept", REVIEW_REJECT = "review:reject", REVIEW_RESOLVE = "review:resolve";
export const REVIEW_AWARDS = "review:awards", REVIEW_DASHBOARD = "contributor-dashboard", REVIEW_IMAGE_CONTEXT = "review:image-context";
