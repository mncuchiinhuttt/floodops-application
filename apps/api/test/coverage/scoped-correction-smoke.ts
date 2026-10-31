import { createRewardLedger, deriveUsefulCoverage, projectActiveGaps, proposeGapOpenings } from "@floodops/domain/rewards";
import { advanceScopedRun, coverageInput, resolveScopedRun, scopedRun, sharedId } from "./scoped-evidence-fixture.ts";

const run = scopedRun(), input = coverageInput(run), before = deriveUsefulCoverage(input);
const atExpiry = deriveUsefulCoverage(coverageInput(advanceScopedRun(run, 1)));
const resolved = deriveUsefulCoverage(coverageInput(resolveScopedRun(run)));
const expired = deriveUsefulCoverage(coverageInput(advanceScopedRun(run, 3)));
const context = { session_id: "ses_scoped001", generation: 1, event_sequence: 1 };
const ledger = proposeGapOpenings(createRewardLedger(context.session_id, 1, 0), input, context,
  input.scope.map(scope => ({ ...scope, gap_id: `gap_scope_${scope.vehicle_type}` })));
const bumped = input.scope.map(scope => ({ ...scope, knowledge_epoch: scope.knowledge_epoch + 1 }));
const active = projectActiveGaps(ledger, bumped);
if (before.coverage.covered_pairs !== 1 || atExpiry.coverage.covered_pairs !== 2 || resolved.coverage.covered_pairs !== 2
  || expired.coverage.covered_pairs !== 0 || active.length !== 0 || ledger.gaps[0]?.status !== "open") throw new Error("Scoped correction smoke failed");
console.log(JSON.stringify({ kind: "functional_fixture_public_source_simulator_reward_smoke",
  aggregate_flag: run.sourceSnapshot.observations.find(item => item.observation_id === sharedId)?.has_conflict,
  current: before.coverage, after_contrary_expiry: atExpiry.coverage, resolved: resolved.coverage, expired: expired.coverage,
  historical_open_rows: ledger.gaps.length, active_after_explicit_epoch_bump: active.length,
  seed_hash: run.scenario.manifest.config.seed_hash, config_hash: run.scenario.manifest.config.config_hash,
  bundle_hash: run.scenario.bundleHash, qualification: "Pure public consumer integration; no durable review/provider/device proof" }));
