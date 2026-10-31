import { z } from "zod";
import { SessionSnapshotSchema } from "../schemas/session-snapshot";

export const getIncidentState = {
  name: "get_incident_state",
  input: z.strictObject({

}),
  output: SessionSnapshotSchema,
  sideEffect: "read_only",
} as const;
