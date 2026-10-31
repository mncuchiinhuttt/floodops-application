import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { createIdempotencyKey } from "@floodops/api-client";
import { Alert } from "@floodops/ui-web";
import { ReviewScreen, type ImageBinding } from "../features";
import { ResourceView } from "../shared/feature-state";
import { reportImageContext } from "../features/reports/image-binding";
import { useRuntime, useRuntimeSnapshot } from "./context";
import { readOptions, refreshAfterCommand, resourceOf } from "./queries";
import type { Report } from "@floodops/contracts";

export function ReviewRoute() {
  const runtime = useRuntime(); useRuntimeSnapshot(); const { reportId = "" } = useParams(); const { session } = runtime.context().identity;
  const report = useQuery(readOptions(runtime, "getReport", "reports:review", "dispatcher", { path: { session_id: session.session_id, report_id: reportId } }));
  return <ResourceView resource={resourceOf(report)}>{data => <BoundReview key={`${session.session_id}:${session.generation}:${data.report_id}`} report={data} refreshing={report.isFetching} />}</ResourceView>;
}
function BoundReview({ report, refreshing }: { report: Report; refreshing: boolean }) {
  const runtime = useRuntime(), context = runtime.context(), { session, participant } = context.identity;
  const [reviewed, setReviewed] = useState<{ report: Report; basedOn: Report } | null>(null);
  const currentReport = reviewed?.basedOn === report ? reviewed.report : report;
  const inputContext = reportImageContext(report), prefix = ["session", session.session_id, session.generation, participant.participant_id];
  const config = useQuery({ ...readOptions(runtime, "getSessionConfiguration", "scenario:read", "dispatcher", { path: { session_id: session.session_id } }), enabled: !!report.fixture_photo_id });
  const fixture = config.data?.body.data.fixture_assets.find(asset => asset.fixture_photo_id === report.fixture_photo_id);
  const image = useQuery({ queryKey: [...prefix, "private-image", inputContext], enabled: !!report.media_id || !!fixture,
    queryFn: ({ signal }) => report.media_id ? runtime.bound.read("getMedia", "media:read", "dispatcher", { path: { session_id: session.session_id, media_id: report.media_id } }, signal) :
      runtime.bound.read("getFixtureAsset", "scenario:read", "dispatcher", { path: { session_id: session.session_id, asset_id: fixture!.asset_id } }, signal),
  });
  const advice = useQuery({ ...readOptions(runtime, "getReportImageReview", "reports:review", "dispatcher", { path: { session_id: session.session_id, report_id: report.report_id } }),
    queryKey: [...prefix, "image-review", report.report_id, inputContext], enabled: report.status === "pending_review" && report.kind === "citizen" });
  const job = advice.data?.body.data.job;
  const binding: ImageBinding | null = job ? { sessionId: session.session_id, generation: session.generation, reportId: report.report_id,
    jobId: job.job_id, inputDigest: job.input_digest, reportInputRevision: report.input_revision, reportContext: inputContext } : null;
  const [imageUrl, setImageUrl] = useState<{ input: string; url: string } | null>(null);
  useEffect(() => {
    if (!image.data) return;
    const bytes = image.data.body, png = bytes[0] === 137 && bytes[1] === 80;
    const url = URL.createObjectURL(new Blob([new Uint8Array(bytes).buffer], { type: png ? "image/png" : "image/jpeg" }));
    setImageUrl({ input: inputContext, url }); return () => URL.revokeObjectURL(url);
  }, [image.data, inputContext]);
  return <>{imageUrl?.input === inputContext && <img className="private-report-image" src={imageUrl.url} alt="Ảnh báo cáo private do server cấp" />}
    {image.isError && <Alert title="Ảnh chưa sẵn sàng">Không tải được ảnh chuẩn hóa; AI bị chặn cho tới khi xác minh lại.</Alert>}
    <ReviewScreen context={context} session={session} report={currentReport} imageReview={advice.isFetching ? { status: "loading" } : resourceOf(advice)} imageBinding={binding} normalizedImageReady={image.isSuccess && !image.isFetching} reviewBlockedReason={refreshing ? "Đang làm mới báo cáo. Xem lại trước khi quyết định." : undefined}
      onAiRequest={async () => { await runtime.reports.requestImageReview(report.report_id, createIdempotencyKey()).send(); await runtime.queries.invalidateQueries({ queryKey: prefix }); }}
      onReview={async body => { const response = await runtime.reports.review(report.report_id, body, createIdempotencyKey()).send(); setReviewed({ report: response.body.data.report, basedOn: report }); await refreshAfterCommand(runtime); }} />
  </>;
}
