import { afterEach, expect, test } from "vitest";
import { cleanup, render } from "@testing-library/react";
import axe from "axe-core";
import { CalibrationStatus, EvidenceSummary, MapCanvas, PlanActionCard, PointsLedger, ResultComparison, SimulationBanner, SourceCard } from "../../src/index";
import { FoundationsGallery } from "../../src/foundations-gallery";
import { evidence, plan, results, scene, source } from "../../src/stories/examples";
afterEach(cleanup);
const options = { runOnly: { type: "tag" as const, values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, rules: { "color-contrast": { enabled: false } } };
test("axe checks actual primitive gallery semantics (color contrast tested separately)", async () => {
  const { container } = render(<main><FoundationsGallery /></main>);
  const result = await axe.run(container, options);
  expect(result.violations.map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) }))).toEqual([]);
});
test("axe checks presentation patterns including table headers/map text alternatives", async () => {
  const { container } = render(<main><h1>Presentation examples</h1><SimulationBanner /><CalibrationStatus status="incomplete" detail="Evidence unavailable" />
    <SourceCard source={source} /><EvidenceSummary items={evidence} /><MapCanvas scene={scene} /><PlanActionCard plan={plan} />
    <PointsLedger entries={[]} /><ResultComparison results={results} /></main>);
  const result = await axe.run(container, options);
  expect(result.violations.map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) }))).toEqual([]);
});
