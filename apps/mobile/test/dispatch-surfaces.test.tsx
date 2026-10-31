import { render, screen } from "@testing-library/react-native";
import { GraphSchema, SessionSnapshotSchema, SourceSchema } from "@floodops/contracts";
import { OverviewScreen } from "../src/features/operations-map/overview-screen";
import { SourcesScreen } from "../src/features/sources/sources-screen";
import { initialQuery } from "../src/shared/query-state";
import { fixtureContext } from "../preview/fixture-data";
import { graph, knowledge, sources, snapshotFixture } from "./dispatch-fixture";
test("native overview renders proportional SVG with vehicle/length text alternative and disclosed impact", async () => {
  const context = fixtureContext(); const data = SessionSnapshotSchema.parse(snapshotFixture());
  GraphSchema.parse(graph);
  await render(<OverviewScreen context={context} query={{ ...initialQuery(context.session), status: "ready", data }} graph={graph} vehicle="motorbike" />);
  expect(screen.getByLabelText("Road geometry for motorbike; detailed text list follows")).toBeOnTheScreen();
  expect(screen.getByText("seg_fixture01 · 160 m · unresolved_conflict · unknown")).toBeOnTheScreen();
  expect(screen.getByText("Incidents: inc_fixture01")).toBeOnTheScreen();
  await screen.rerender(<OverviewScreen context={context} query={{ ...initialQuery(context.session), status: "ready", data }} graph={{ ...graph, graph_hash: "wrong-graph" }} vehicle="car" />);
  expect(screen.queryByLabelText(/Road geometry/)).toBeNull();
  expect(screen.getByText("Refresh the matching session and graph.")).toBeOnTheScreen();
});
test("source context never claims passability; conflicts/empty observations and cached revisions remain explicit", async () => {
  const context = fixtureContext(); sources.forEach(source => SourceSchema.parse(source));
  await render(<SourcesScreen context={{ ...context, session: { ...context.session, revision: 4 } }} query={{ ...initialQuery(context.session), status: "ready", data: { sources, knowledge } }} />);
  expect(screen.getByText("Context only; cannot establish street passability.")).toBeOnTheScreen();
  expect(screen.getByText("Blocked pending conflict review. Approval cannot override this.")).toBeOnTheScreen();
  expect(screen.getByText("Observations: None · Restrictions: None")).toBeOnTheScreen();
  expect(screen.getByText(/Stale\/cached · Revision 3/)).toBeOnTheScreen();
});
