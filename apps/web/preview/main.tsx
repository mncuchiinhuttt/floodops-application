import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Button } from "@floodops/ui-web";
import "./preview.css";
import { ContributorWorkspace, DriverWorkspace, PlanScreen, ReportForm, ReviewScreen, capabilityDestinations } from "../src/features";
import { contributorDashboard, driverDashboard, driverRoute, identity, imageBinding, imageReview, now, report, session } from "./fixtures";
import { plan } from "./plan-fixture";

function FixturePreview() {
  const [scene, setScene] = useState("driver");
  const [message, setMessage] = useState("Chưa có fixture callback.");
  const [online, setOnline] = useState(true);
  const [aiState, setAiState] = useState("completed");
  const role = scene.startsWith("driver") ? "driver" : scene.startsWith("community") ? "contributor" : "dispatcher";
  const context = { identity: identity(role), online, now, provenance: "simulated" as const };
  const record = async (name: string) => { setMessage(`Fixture callback: ${name}. Không gửi backend, không commit trạng thái.`); };
  const shownImageReview = aiState === "none" ? { report_id: report.report_id, job: null } : aiState === "completed" ? imageReview :
    { ...imageReview, job: { ...imageReview.job!, status: aiState as "running" | "failed", result: null,
      error_code: aiState === "failed" ? "MODEL_TIMEOUT" as const : null, completed_at: aiState === "failed" ? imageReview.job!.completed_at : null } };
  return <div className="fixture-preview"><header className="fixture-warning"><h1>Fixture preview — chưa kết nối backend</h1>
    <p>Chỉ kiểm màn hình/form với dữ liệu synthetic. Không có capability thật, model, D04 hoặc kết quả vận hành.</p>
    <nav aria-label="Chọn fixture màn hình">{[
      ["driver", "Driver workspace"], ["driver-report", "Driver report"], ["community", "Contributor workspace"],
      ["community-report", "Contributor report"], ["plan", "Plan"], ["review", "Review"],
    ].map(([value, label]) => <Button key={value} variant="secondary" onClick={() => setScene(value!)}>{label}</Button>)}</nav>
    <label><input type="checkbox" checked={online} onChange={event => setOnline(event.target.checked)} /> Fixture online</label>
    <p>Navigation definitions cho fixture: {capabilityDestinations(context).map(item => item.label).join(" · ")}</p>
  </header>
    {scene === "driver" && <DriverWorkspace context={context} resource={{ status: "ready", data: driverDashboard }} routes={{ status: "ready", data: [driverRoute] }} />}
    {scene === "community" && <ContributorWorkspace context={context} resource={{ status: "ready", data: contributorDashboard }} />}
    {(scene === "driver-report" || scene === "community-report") && <ReportForm key={scene} kind={scene === "driver-report" ? "driver" : "citizen"} context={context}
      mediaChoices={[{ id: "photo_fixture001", kind: "fixture", label: "Ảnh synthetic được phép" }]} onSubmit={() => record("submitReport")} />}
    {scene === "plan" && <PlanScreen context={context} resource={{ status: "ready", data: plan }} onDecision={body => record(body.decision)} onDryRun={() => record("dryRun")} onExecute={() => record("execute")} />}
    {scene === "review" && <><fieldset><legend>Trạng thái AI fixture</legend>{["none", "running", "failed", "completed"].map(value =>
      <label key={value}><input name="ai-state" type="radio" checked={aiState === value} onChange={() => setAiState(value)} />{value}</label>)}</fieldset>
      <ReviewScreen context={context} session={session} report={report} imageReview={{ status: "ready", data: shownImageReview }} imageBinding={imageBinding}
        onReview={body => record(`review ${body.decision}`)} onAiRequest={() => record("image review request")} /></>}
    <footer role="status">{message}</footer>
  </div>;
}
const root = document.getElementById("fixture-root");
if (!root) throw new Error("Missing fixture preview root");
createRoot(root).render(<FixturePreview />);
