import { Text } from "react-native";
import { Alert, Card } from "@floodops/ui-native";
import type { Results } from "@floodops/contracts";
import { DataScreen } from "../../shared/screen-frame";
import type { QueryState } from "../../shared/query-state";
import type { MobileContext } from "../../shared/session-context";
export function ResultsScreen({ context, query }: { context: MobileContext; query: QueryState<Results> }) {
  return <DataScreen title="Simulation results" context={context} query={query} permission="results:read" roles={["dispatcher"]}>
    {results => results.session_id !== context.session.session_id ? <Alert title="Scope mismatch">Refresh results for the current session.</Alert> : <>
      <Text>{results.label} · Calibration {results.calibration_status}</Text>
      <Text>Scenario {results.scenario_id} / {results.scenario_version} · Config {results.config_hash}</Text>
      <Text>Observed through {results.observed_until_minute} / Horizon {results.horizon_minute} min</Text>
      <Text>Late reduction ratio: {results.late_reduction_ratio === null ? "N/A — baseline has no comparable rate" : results.late_reduction_ratio}</Text>
      {results.branches.map(branch => <Card key={branch.branch_id} title={branch.branch_id} description={branch.completed_at_horizon ? "Measured through horizon" : "Run unfinished"}>
        {Object.entries(branch.metrics).map(([name, value]) => <Text key={name}>{name}: {value}</Text>)}
      </Card>)}
      <Text>Measured branch metrics are separate from projected plan ETAs. D04 limitations remain visible.</Text>
    </>}
  </DataScreen>;
}
