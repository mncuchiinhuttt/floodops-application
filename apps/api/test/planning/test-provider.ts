import type { CommanderProvider } from "../../src/features/planning/runtime-types";
import type { SessionSnapshot, Route } from "@floodops/contracts";
/** Declared deterministic transport exercises the real tool/controller path; never a production fallback. */
export const testProvider: CommanderProvider = { async respond(request) {
  const outputs = request.input.filter(v => !!v && typeof v === "object" && (v as { type?: string }).type === "function_call_output")
    .map(v => JSON.parse((v as { output: string }).output) as unknown);
  const call = (name: string, args: unknown, index: number) => ({ status: "completed", output: [{
    type: "function_call", call_id: "call_" + index, name, arguments: JSON.stringify(args) }] });
  if (!outputs.length) return call("get_incident_state", {}, 1);
  if (outputs.length === 1) {
    const snapshot = outputs[0] as SessionSnapshot, branch = snapshot.operations.branches.find(b => b.branch_id === "floodops")!;
    const driver = branch.drivers.find(d => d.driver_id === "drv_moto01")!;
    return call("compute_route", { driver_id: driver.driver_id, origin_node_id: driver.position.node_id,
      stop_refs: driver.ordered_stops.map(s => ({ order_id: s.order_id, kind: s.kind })), assignment_overrides: [] }, 2);
  }
  return { status: "completed", output: [{ type: "message", content: [{ type: "output_text",
    text: JSON.stringify({ action_ids: [], route_ids: [(outputs[1] as Route).route_id] }) }] }] };
} };
