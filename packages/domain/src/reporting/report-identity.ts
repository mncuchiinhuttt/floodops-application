import { ParticipantSchema } from "@floodops/contracts";
import type { VehicleType } from "@floodops/contracts";
import type { ReportContext } from "./report-types.ts";
import { fail } from "../sources/source-types.ts";

/** Capability verification, session/generation fencing and wall-clock expiry precede this pure port. */
export function bindReportIdentity(input: { kind: "driver" | "citizen"; reporter_entity_id?: string; vehicle_types: readonly VehicleType[] }, context: ReportContext): string {
  const actor = context.participant;
  if (!ParticipantSchema.safeParse(actor).success || !actor.permissions.includes("reports:submit")) fail("FORBIDDEN");
  let entity: string, vehicles = context.boundVehicleTypes;
  if (actor.role === "dispatcher") {
    if (!actor.permissions.includes("simulation:submit_as") || !input.reporter_entity_id) fail("FORBIDDEN");
    const binding = context.dispatcherEntities.find(item => item.entity_id === input.reporter_entity_id && item.kind === input.kind);
    if (!binding) fail("FORBIDDEN");
    entity = binding.entity_id; vehicles = binding.vehicle_types;
  } else {
    if ((actor.role !== "driver" || input.kind !== "driver") && (actor.role !== "contributor" || input.kind !== "citizen")) fail("FORBIDDEN");
    if (actor.bound_entity_id === null || (input.reporter_entity_id !== undefined && input.reporter_entity_id !== actor.bound_entity_id)) fail("FORBIDDEN");
    entity = actor.bound_entity_id;
  }
  if (input.vehicle_types.some(vehicle => !vehicles.includes(vehicle))) fail("FORBIDDEN");
  return entity;
}
