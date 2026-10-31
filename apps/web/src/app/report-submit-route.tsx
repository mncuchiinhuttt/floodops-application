import { useQuery } from "@tanstack/react-query";
import { createIdempotencyKey } from "@floodops/api-client";
import { Alert } from "@floodops/ui-web";
import { ReportForm } from "../features";
import { useRuntime, useRuntimeSnapshot } from "./context";
import { failureText } from "./failure";
import { readOptions, refreshAfterCommand } from "./queries";
export function ReportSubmitRoute({ kind }: { kind: "driver" | "citizen" }) {
  const runtime = useRuntime(); useRuntimeSnapshot(); const context = runtime.context(), { session, participant } = context.identity;
  const config = useQuery({ ...readOptions(runtime, "getSessionConfiguration", "scenario:read", participant.role, { path: { session_id: session.session_id } }), enabled: kind === "citizen" });
  const choices = config.data?.body.data.fixture_assets.filter(asset => asset.fixture_photo_id).map(asset => ({ id: asset.fixture_photo_id!, kind: "fixture" as const, label: asset.asset_id })) ?? [];
  return <>{config.isError && <Alert title="Chưa tải được ảnh fixture được phép">{failureText(config.error)}</Alert>}
    <ReportForm kind={kind} context={context} mediaChoices={choices} onSubmit={async body => {
      await runtime.reports.submit(body, createIdempotencyKey()).send(); await refreshAfterCommand(runtime);
    }} /></>;
}

export function DriverReportRoute() { return <ReportSubmitRoute kind="driver" />; }
export function CitizenReportRoute() { return <ReportSubmitRoute kind="citizen" />; }
