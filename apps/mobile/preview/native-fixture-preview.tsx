import { Text, View } from "react-native";
import { DriverScreen } from "../src/features/driver/driver-screen";
import { ContributorScreen } from "../src/features/rewards/contributor-screen";
import { ReviewScreen } from "../src/features/reports/review-screen";
import { ReportForm } from "../src/features/reports/report-form";
import { newReportDraft } from "../src/features/reports/report-draft";
import { initialAdvice, receiveAdvice } from "../src/features/reports/image-review-state";
import { PlanScreen } from "../src/features/planning/plan-screen";
import { ResultsScreen } from "../src/features/results/results-screen";
import { initialQuery } from "../src/shared/query-state";
import { fixtureContext, fixtureContributor, fixtureDriver, fixtureJob, fixturePlan, fixtureReport, fixtureResults } from "./fixture-data";
/** A renderable fixture surface, not an app entrypoint/router/backend adapter. */
export function NativeFixturePreview({ surface }: { surface: "driver" | "contributor" | "report" | "review" | "plan" | "results" }) {
  const role = surface === "driver" ? "driver" : surface === "contributor" || surface === "report" ? "contributor" : "dispatcher";
  const context = fixtureContext(role);
  const plan = fixturePlan();
  const job = fixtureJob();
  const binding = { session_id: job.session_id, generation: job.generation, reportId: job.report_id, jobId: job.job_id, inputDigest: job.input_digest };
  const advice = receiveAdvice(initialAdvice(binding, context.session.event_sequence), binding, { report_id: job.report_id, job }, context.session, 0);
  const query = <T,>(data: T) => ({ ...initialQuery<T>(context.session), status: "ready" as const, data });
  return <View><Text accessibilityRole="header">Fixture preview — not connected to live backend</Text>
    <Text>Synthetic inputs · Calibration incomplete · No device, model or backend proof</Text>
    {surface === "driver" && <DriverScreen context={context} query={query(fixtureDriver())} />}
    {surface === "contributor" && <ContributorScreen context={context} query={query(fixtureContributor())} />}
    {surface === "report" && <ReportForm context={context} initialDraft={newReportDraft(context, "2026-10-31T00:10:00Z")} />}
    {surface === "review" && <ReviewScreen context={context} report={fixtureReport()} advice={advice} />}
    {surface === "plan" && <PlanScreen context={context} plan={plan} currentPlan={{ planId: plan.plan_id, planningJobId: plan.planning_job_id }} />}
    {surface === "results" && <ResultsScreen context={context} query={query(fixtureResults())} />}
  </View>;
}
