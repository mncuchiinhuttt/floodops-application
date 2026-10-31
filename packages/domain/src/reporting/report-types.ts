import type { FixtureAsset, Participant, RewardPolicyRef, VehicleType } from "@floodops/contracts";
import type { SourceEnvironment } from "../sources/source-types.ts";
import type { KnowledgePair } from "../knowledge/current-evidence.ts";

export interface ReporterBinding { readonly entity_id: string; readonly kind: "driver" | "citizen"; readonly vehicle_types: readonly VehicleType[] }
/** These inputs come from authenticated server state, never request JSON or model output. */
export interface ReportContext extends SourceEnvironment {
  /** Persisted authenticated original submitter; the reviewing dispatcher is authorized separately. */
  readonly participant: Participant;
  readonly boundVehicleTypes: readonly VehicleType[];
  readonly dispatcherEntities: readonly ReporterBinding[];
  readonly sourceId: string;
  readonly reportId: string;
  readonly inputRevision: number;
  readonly receivedAt: string;
  /** Immutable server policy at receipt; missing configuration is never backfilled. */
  readonly receiptRewardPolicy?: RewardPolicyRef | null;
  /** Immutable epoch snapshot retained at submission/capture; never replace with newer acceptance epochs. */
  readonly epochs: readonly KnowledgePair[];
  readonly fixtureAssets: readonly FixtureAsset[];
  readonly media: null | { readonly media_id: string; readonly normalized: boolean; readonly duplicate: boolean };
}
