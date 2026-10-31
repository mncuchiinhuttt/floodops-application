/** Private server checkpoint identity. This is not a new wire DTO or authorization grant. */
export interface ScenarioReference {
  scenario_id: string;
  scenario_version: string;
  bundle_hash: string;
}
/** Injected by the composition root; pure owners must not import the API entrypoint. */
export interface SimulationPersistence<Run, State> {
  readonly reference: Readonly<ScenarioReference>;
  read(values: Record<string, unknown>): Run;
  write(values: Record<string, unknown>, run: Run): Record<string, unknown> & {
    simulation: { reference: Readonly<ScenarioReference>; state: State };
  };
}
