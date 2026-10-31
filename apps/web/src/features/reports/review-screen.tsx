import { useId, useState } from "react";
import { ReviewInputSchema, type ImageReviewState, type Report, type ReviewInput, type SessionMeta } from "@floodops/contracts";
import { Alert, Button, Card, ErrorSummary, SelectField, TextArea, TextField, type FormError } from "@floodops/ui-web";
import { accessReason, sameVersion, type AccessContext } from "../../shared/access";
import { Denied, SimulationBanner, type Resource } from "../../shared/feature-state";
import { useCommand } from "../../shared/use-command";
import { RewardFeedback } from "./reward-feedback";
import { ImageReviewCard } from "./image-review-card";
import { reportImageContext, type ImageBinding } from "./image-binding";

export interface ReviewScreenProps {
  context: AccessContext; session: SessionMeta; report: Report;
  imageReview: Resource<ImageReviewState>; imageBinding: ImageBinding | null; normalizedImageReady?: boolean; reviewBlockedReason?: string;
  onReview: (input: ReviewInput) => Promise<unknown>; onAiRequest: () => Promise<unknown>;
}
export function ReviewScreen(props: ReviewScreenProps) {
  const { context, session, report } = props;
  return <ReviewDetail key={`${session.session_id}:${session.generation}:${context.identity.participant.participant_id}:${report.report_id}:${report.input_revision}:${reportImageContext(report)}`} {...props} />;
}
function ReviewDetail({ context, session, report, imageReview, imageBinding, onReview, onAiRequest, normalizedImageReady = false, reviewBlockedReason }: ReviewScreenProps) {
  const prefix = useId();
  const [reason, setReason] = useState("");
  const [segment, setSegment] = useState(report.segment_id ?? "");
  const [vehicle, setVehicle] = useState("");
  const [condition, setCondition] = useState(report.input_mode === "quick" ? report.quick_condition ?? "" : "");
  const [errors, setErrors] = useState<FormError[]>([]);
  const [attempt, setAttempt] = useState(0);
  const key = `${session.session_id}:${session.generation}:${report.report_id}:${report.input_revision}`;
  const manual = useCommand(key); const ai = useCommand(key);
  const denied = accessReason(context, "reports:review", "dispatcher");
  if (denied || !sameVersion(context.identity.session, session)) return <Denied reason={denied ?? "Dữ liệu review cũ. Cần làm mới."} />;
  const blocked = reviewBlockedReason ?? accessReason(context, "reports:review", "dispatcher", true) ??
    (["accepted", "rejected"].includes(report.status) ? "Báo cáo đã được quyết định. Làm mới để xem trạng thái." : null);
  const acceptBlocked = blocked ?? (report.status !== "pending_review" ? "Chỉ Accept khi báo cáo pending_review." : report.reason_codes.length ? "Cần giải quyết lý do validation trước khi Accept." : report.kind === "citizen" && !normalizedImageReady ? "Chưa xác minh ảnh đã chuẩn hóa." : null);
  const aiBlocked = blocked ?? (report.status !== "pending_review" || report.kind !== "citizen" || report.input_mode !== "photo" || !normalizedImageReady ? "AI cần ảnh cộng đồng chuẩn hóa và pending_review." : null);
  const disabled = (value: string | null) => value ? { disabled: true as const, disabledReason: value } : { disabled: false as const };
  function decide(decision: "accept" | "reject") {
    const result = ReviewInputSchema.safeParse(decision === "reject" ? { decision, reason, mapped_segment_id: null, vehicle_types: [], condition: null } : { decision, reason, mapped_segment_id: segment.trim() || null,
      vehicle_types: vehicle ? [vehicle] : [], condition: condition || null });
    const next: FormError[] = [];
    if (!reason.trim()) next.push({ fieldId: `${prefix}-reason`, message: "Nhập lý do review." });
    if (decision === "accept" && (!segment.trim() || !vehicle || !condition)) next.push({ fieldId: `${prefix}-segment`, message: "Accept cần xác nhận đoạn đường, loại xe và tình trạng." });
    if (!result.success) next.push({ fieldId: `${prefix}-reason`, message: "Nội dung không đúng contract. Kiểm tra các trường review." });
    setErrors(next); setAttempt(value => value + 1);
    if (decision === "accept" && report.input_mode === "quick" && condition !== report.quick_condition) next.push({ fieldId: `${prefix}-reason`, message: "Không đổi tình trạng của driver quick report." });
    if (!(decision === "accept" ? acceptBlocked : blocked) && !next.length && result.success) void manual.run(() => onReview(result.data));
  }
  const bindingMatchesReport = imageBinding?.reportId === report.report_id && imageBinding.sessionId === session.session_id && imageBinding.generation === session.generation && imageBinding.reportInputRevision === report.input_revision && imageBinding.reportContext === reportImageContext(report);
  const safeImageReview = report.status === "pending_review" && bindingMatchesReport ? imageReview : { status: "stale" as const };
  return <main><SimulationBanner session={session} provenance={context.provenance} /><h1>Review báo cáo {report.report_id}</h1>
    <Card title="Báo cáo"><p>{report.description}</p><p>{report.status} · Chụp {report.captured_at} · Phút {report.captured_sim_minute}</p>
      <p>Vehicle: {report.vehicle_types.join(", ") || "Chưa xác định"} · {report.reason_codes.join(", ")}</p></Card>
    <RewardFeedback report={report} />
    <ImageReviewCard resource={safeImageReview} binding={imageBinding} />
    <Button {...disabled(aiBlocked)} pending={ai.pending} pendingLabel="Đang yêu cầu AI…" onClick={() => void ai.run(onAiRequest)}>AI nhận xét</Button>
    {ai.message && <Alert title="Trạng thái AI">{ai.message}</Alert>}
    <Card title="Quyết định thủ công" description="Review, hiệu lực quan sát và thưởng là các quyết định server riêng. AI không tự Accept/Reject.">
      <ErrorSummary errors={errors} submissionKey={attempt} />
      <TextField id={`${prefix}-segment`} label="Đoạn đường xác nhận" value={segment} onChange={event => setSegment(event.target.value)} />
      <SelectField label="Vehicle xác nhận" value={vehicle} onChange={event => setVehicle(event.target.value)} options={[
        { value: "", label: "Chọn loại xe" }, { value: "motorbike", label: "Xe máy" }, { value: "car", label: "Ô tô" }, { value: "truck", label: "Xe tải" },
      ]} />
      <SelectField disabled={report.input_mode === "quick"} label="Tình trạng xác nhận" value={condition} onChange={event => setCondition(event.target.value)} options={[
        { value: "", label: "Chọn tình trạng" }, { value: "normal", label: "Normal" }, { value: "caution", label: "Caution" },
        { value: "impassable", label: "Impassable" }, { value: "unknown", label: "Unknown" },
      ]} />
      <TextArea id={`${prefix}-reason`} label="Lý do review" maxLength={2000} value={reason} onChange={event => setReason(event.target.value)} />
      <div className="feature-actions"><Button {...disabled(acceptBlocked)} pending={manual.pending} onClick={() => decide("accept")}>Accept</Button>
        <Button {...disabled(blocked)} variant="danger" pending={manual.pending} onClick={() => decide("reject")}>Reject</Button></div>
      {manual.message && <Alert title="Kết quả review">{manual.message}</Alert>}
    </Card>
  </main>;
}
