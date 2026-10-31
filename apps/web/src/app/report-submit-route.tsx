import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Report } from "@floodops/contracts";
import { ReportList } from "../features/reports/report-list";
import { createIdempotencyKey } from "@floodops/api-client";
import { MediaUploadField } from "../features/media/upload-field";
import { IDLE_UPLOAD, type UploadState } from "../features/media/upload-task";
import { Alert } from "@floodops/ui-web";
import { ReportForm } from "../features";
import { useRuntime, useRuntimeSnapshot } from "./context";
import { failureText } from "./failure";
import { readOptions, refreshAfterCommand } from "./queries";
export function ReportSubmitRoute({ kind }: { kind: "driver" | "citizen" }) {
  const runtime = useRuntime(); useRuntimeSnapshot(); const context = runtime.context(), { session, participant } = context.identity;
  const [submitted, setSubmitted] = useState<Report | null>(null);
  const [upload, setUpload] = useState<UploadState>(IDLE_UPLOAD);
  const readyMedia = upload.phase === "ready" ? upload.media : null;
  const uploadBlocked = ["reading", "reserving", "uploading", "normalizing"].includes(upload.phase) ? "Ảnh đang được xử lý. Chờ server normalize." : upload.phase === "failed" ? "Ảnh chưa ready. Thử lại hoặc bỏ ảnh trước khi gửi." : undefined;
  const config = useQuery({ ...readOptions(runtime, "getSessionConfiguration", "scenario:read", participant.role, { path: { session_id: session.session_id } }), enabled: kind === "citizen" });
  const graph = useQuery(readOptions(runtime, "getSessionGraph", "scenario:read", participant.role, { path: { session_id: session.session_id } }));
  const fixtures = config.data?.body.data.fixture_assets.filter(asset => asset.fixture_photo_id).map(asset => ({ id: asset.fixture_photo_id!, kind: "fixture" as const, label: `Fixture: ${asset.asset_id}` })) ?? [];
  const choices = [...(readyMedia ? [{ id: readyMedia.media_id, kind: "media" as const, label: "Ảnh upload đã chuẩn hóa" }] : []), ...fixtures];
  return <>{kind === "citizen" && <MediaUploadField runtime={runtime} onChange={setUpload} />}
    {config.isError && <Alert title="Chưa tải được ảnh fixture được phép">{failureText(config.error)}</Alert>}
    <ReportForm kind={kind} context={context} graph={graph.data?.body.data ?? null} mediaChoices={choices} preferredMediaId={readyMedia?.media_id ?? null} submissionBlockedReason={kind === "citizen" ? uploadBlocked : undefined} onSubmit={async body => {
      const response = await runtime.reports.submit(body, createIdempotencyKey(), participant.role === "dispatcher" ? "dispatcher" : kind === "driver" ? "driver" : "contributor").send();
      setSubmitted(response.body.data); await refreshAfterCommand(runtime);
    }} />{submitted && <section aria-label="Report đã gửi"><h2>Phản hồi report từ server</h2><ReportList reports={[submitted]} /></section>}</>;
}

export function DriverReportRoute() { return <ReportSubmitRoute kind="driver" />; }
export function CitizenReportRoute() { return <ReportSubmitRoute kind="citizen" />; }
