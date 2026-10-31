export { deriveUsefulCoverage } from "./coverage.ts";
export { proposeGapOpenings, proposeSourceGapFills } from "./gaps.ts";
export { proposeReportReward } from "./propose-reward.ts";
export { createRewardLedger, validateLedger } from "./validation.ts";
export { RewardProposalError } from "./types.ts";
export type {
  CoverageScope, CoverageInput, UsefulPair, UsefulCoverage, PhotoClaim, RewardLedger, TransitionContext,
  GapIdentity, RewardConfig, VerifiedPhoto, RewardInput, RewardReason, RewardProposal,
} from "./types.ts";
