import { SimulationClockSchema } from "@floodops/contracts";
import type { RuntimeRegistry } from "../../shared/index";
import { readAdvanceState, readRun } from "./state";
import { CLOCK_VIEW, JOBS_VIEW } from "./runtime-types";
import type { ResolvedOptions } from "./runtime-types";

export function simulationViews<State>(options: ResolvedOptions<State>): RuntimeRegistry["views"] {
  return {
    [CLOCK_VIEW]: { permission: "session:read", roles: ["dispatcher", "driver", "contributor", "viewer"],
      project(context) {
        const run = readRun(context, options), state = readAdvanceState(context.snapshot.values);
        return SimulationClockSchema.parse({ now_minute: run.nowMs / 60000, horizon_minute: run.scenario.manifest.config.horizon_minute,
          advance_job: state.currentJobId ? state.jobs[state.currentJobId]?.job ?? null : null,
          mode: context.snapshot.meta.status === "advancing" ? "advancing" : "paused", playback_controls_are_view_only: true });
      } },
    [JOBS_VIEW]: { permission: "simulation:advance", roles: ["dispatcher"],
      project: context => Object.values(readAdvanceState(context.snapshot.values).jobs).map(record => record.job) }
  };
}
