import { useEffect, useId, useState } from "react";
import { DriverReportInputSchema, CitizenReportInputSchema, type Graph, type SubmitReportInput } from "@floodops/contracts";
import { Alert, Button, Form, SelectField, TextArea, TextField, type FormError } from "@floodops/ui-web";
import { accessReason, type AccessContext } from "../../shared/access";
import { Denied, SimulationBanner } from "../../shared/feature-state";
import { useCommand } from "../../shared/use-command";
import { LocationPicker } from "../operations-map/location-picker";

export interface ReportMediaChoice { id: string; kind: "media" | "fixture"; label: string }
export interface ReportFormProps {
  kind: "driver" | "citizen"; context: AccessContext;
  mediaChoices?: readonly ReportMediaChoice[]; preferredMediaId?: string | null; submissionBlockedReason?: string;
  /** Scenario road geometry; when present the form offers an OpenStreetMap picker and device location. */
  graph?: Graph | null;
  onSubmit: (input: SubmitReportInput) => Promise<unknown>;
}
export function ReportForm(props: ReportFormProps) {
  const { session, participant } = props.context.identity;
  return <ReportFormDetail key={`${session.session_id}:${session.generation}:${participant.participant_id}:${participant.bound_entity_id}:${props.kind}`} {...props} />;
}
function ReportFormDetail({ kind, context, mediaChoices = [], preferredMediaId, submissionBlockedReason, graph, onSubmit }: ReportFormProps) {
  const prefix = useId();
  const [description, setDescription] = useState("");
  const [segment, setSegment] = useState("");
  const [longitude, setLongitude] = useState("");
  const [latitude, setLatitude] = useState("");
  const [capturedAt, setCapturedAt] = useState("");
  const [minute, setMinute] = useState(String(context.identity.session.sim_minute));
  const [mode, setMode] = useState("text");
  const [condition, setCondition] = useState("unknown");
  const [vehicle, setVehicle] = useState("");
  const [mediaKey, setMediaKey] = useState("");
  const [errors, setErrors] = useState<FormError[]>([]);
  const [attempt, setAttempt] = useState(0);
  const [reporterEntity, setReporterEntity] = useState("");
  useEffect(() => {
    setMediaKey(value => preferredMediaId ? `media:${preferredMediaId}` : value.startsWith("media:") ? "" : value);
  }, [preferredMediaId]);
  const command = useCommand(`${context.identity.session.session_id}:${context.identity.session.generation}:${kind}`);
  const simulatedSubmit = context.identity.participant.role === "dispatcher" && kind === "citizen";
  const role = simulatedSubmit ? "dispatcher" : kind === "driver" ? "driver" : "contributor";
  const denied = accessReason(context, "reports:submit", role) ?? (simulatedSubmit ? accessReason(context, "simulation:submit_as", "dispatcher") : null);
  const blocked = submissionBlockedReason ?? accessReason(context, "reports:submit", role, true);
  if (denied) return <Denied reason={denied} />;
  function submit() {
    const media = mediaChoices.find(choice => `${choice.kind}:${choice.id}` === mediaKey);
    const candidate = { kind, ...(simulatedSubmit ? { reporter_entity_id: reporterEntity.trim() } : {}), segment_id: segment.trim() || null, coordinate: longitude.trim() || latitude.trim() ? [longitude.trim() ? Number(longitude) : NaN, latitude.trim() ? Number(latitude) : NaN] : null, captured_at: capturedAt,
      captured_sim_minute: minute.trim() ? Number(minute) : NaN, vehicle_types: vehicle ? [vehicle] : [], description,
      ...(kind === "driver" ? { input_mode: mode, quick_condition: mode === "quick" ? condition : null }
        : { media_id: mediaKey && media?.kind === "media" ? media.id : null, fixture_photo_id: mediaKey && media?.kind === "fixture" ? media.id : null }),
    };
    const result = (kind === "driver" ? DriverReportInputSchema : CitizenReportInputSchema).safeParse(candidate);
    const next: FormError[] = [];
    if (simulatedSubmit && !reporterEntity.trim()) next.push({ fieldId: `${prefix}-reporter`, message: "Nhập entity giả lập được scenario cho phép." });
    if (!segment.trim()) next.push({ fieldId: `${prefix}-segment`, message: "Chọn đoạn đường thủ công." });
    if (kind === "citizen" && (!mediaKey || !media)) next.push({ fieldId: `${prefix}-media`, message: "Chọn ảnh đã được server cấp hoặc fixture cho phép." });
    if (!result.success) for (const issue of result.error.issues) {
      const name = String(issue.path[0]);
      const fields: Record<string, string> = { reporter_entity_id: "reporter", captured_at: "capture", captured_sim_minute: "minute", description: "description", segment_id: "segment", coordinate: "coordinate", vehicle_types: "vehicle" };
      const messages: Record<string, string> = { reporter_entity_id: "Nhập ID entity giả lập hợp lệ.", captured_at: "Thời gian ghi nhận cần đúng RFC3339.", captured_sim_minute: "Phút mô phỏng cần là số không âm.", description: "Mô tả dài tối đa 2000 ký tự.", segment_id: "Nhập ID đoạn đường hợp lệ trong phiên.", coordinate: "Nhập đủ kinh độ −180…180 và vĩ độ −90…90 theo WGS84.", vehicle_types: "Chọn loại xe quan sát hợp lệ." };
      next.push({ fieldId: `${prefix}-${fields[name] ?? "description"}`, message: messages[name] ?? "Kiểm tra nội dung báo cáo." });
    }
    setErrors([...new Map(next.map(error => [error.fieldId, error])).values()]); setAttempt(value => value + 1);
    if (!blocked && result.success && !next.length) void command.run(() => onSubmit(result.data));
  }
  const fieldError = (name: string) => errors.find(error => error.fieldId === `${prefix}-${name}`)?.message;
  return <section className="grid max-w-3xl gap-4"><SimulationBanner session={context.identity.session} provenance={context.provenance} />
    <header className="grid gap-1"><h1>{kind === "driver" ? "Báo cáo đường" : "Gửi báo cáo ảnh"}</h1>
    <p className="text-muted-foreground">Chưa gửi. Server quyết định validation/review; ảnh và báo cáo chưa cấp quyền mở đường hoặc cộng điểm.</p></header>
    <Form aria-label="Gửi báo cáo" errors={errors} submissionKey={attempt} onSubmit={submit} className="rounded-xl border bg-card p-4 sm:p-5">
      {simulatedSubmit && <TextField id={`${prefix}-reporter`} label="Contributor giả lập (theo scenario)" hint="Simulation submit-as; backend giữ nguyên participant thực đã gửi." error={fieldError("reporter")} value={reporterEntity} onChange={event => setReporterEntity(event.target.value)} required />}
      {graph && <LocationPicker graph={graph} segmentId={segment} longitude={longitude} latitude={latitude} disabled={!!blocked}
        onStreet={name => setDescription(value => value.trim() ? value : `Vị trí: ${name}`)}
        onPick={picked => { setLongitude(String(picked.longitude)); setLatitude(String(picked.latitude)); setCapturedAt(value => value || new Date().toISOString());
          if (picked.segmentId) setSegment(picked.segmentId); setErrors(list => list.filter(error => !/-(segment|coordinate|capture)$/.test(error.fieldId))); }} />}
      {graph ? <SelectField id={`${prefix}-segment`} label="Đoạn đường" error={fieldError("segment")} value={segment} required
        onValueChange={value => { setSegment(value); setErrors(list => list.filter(error => !error.fieldId.endsWith("-segment"))); }}
        hint="Tự điền khi bạn chọn trên bản đồ; có thể đổi tay." options={[{ value: "", label: "Chọn đoạn đường" },
          ...graph.segments.map(item => ({ value: item.segment_id, label: `${item.segment_id} · ${Math.round(item.length_m)} m` }))]} />
        : <TextField id={`${prefix}-segment`} label="Đoạn đường" error={fieldError("segment")} value={segment} onChange={event => setSegment(event.target.value)} required />}
      <TextField id={`${prefix}-coordinate`} label="Kinh độ WGS84" type="number" min="-180" max="180" step="any" error={fieldError("coordinate")} hint="Nhập, chọn trên bản đồ hoặc bấm Dùng vị trí của tôi; thiếu tọa độ có thể cần clarification." value={longitude} onChange={event => setLongitude(event.target.value)} />
      <TextField id={`${prefix}-latitude`} label="Vĩ độ WGS84" type="number" min="-90" max="90" step="any" value={latitude} onChange={event => setLatitude(event.target.value)} />
      <TextField id={`${prefix}-capture`} label="Thời gian chụp RFC3339" error={fieldError("capture")} hint="Ví dụ định dạng: YYYY-MM-DDTHH:mm:ssZ" value={capturedAt} onChange={event => setCapturedAt(event.target.value)} required />
      <TextField id={`${prefix}-minute`} label="Phút mô phỏng lúc ghi nhận" error={fieldError("minute")} type="number" min="0" step="any" value={minute} onChange={event => setMinute(event.target.value)} required />
      <SelectField id={`${prefix}-vehicle`} label="Loại xe quan sát" error={fieldError("vehicle")} value={vehicle} onValueChange={setVehicle} options={[
        { value: "", label: "Chưa xác định" }, { value: "motorbike", label: "Xe máy" }, { value: "car", label: "Ô tô" }, { value: "truck", label: "Xe tải" },
      ]} />
      {kind === "driver" ? <>
        <SelectField label="Cách báo cáo" value={mode} onValueChange={setMode} options={[{ value: "text", label: "Văn bản" }, { value: "quick", label: "Báo nhanh" }]} />
        {mode === "quick" && <SelectField label="Tình trạng quan sát" value={condition} onValueChange={setCondition} options={[
          { value: "unknown", label: "Chưa rõ" }, { value: "normal", label: "Khô / đi được" }, { value: "caution", label: "Cần thận trọng" }, { value: "impassable", label: "Nước sâu / không đi được" },
        ]} />}
      </> : <SelectField id={`${prefix}-media`} label="Ảnh được phép" error={fieldError("media")} value={mediaKey} onValueChange={setMediaKey} options={[
        { value: "", label: "Chọn ảnh" }, ...mediaChoices.map(media => ({ value: `${media.kind}:${media.id}`, label: `${media.label} (${media.kind})` })),
      ]} />}
      <TextArea id={`${prefix}-description`} label="Mô tả" error={fieldError("description")} maxLength={2000} value={description} onChange={event => setDescription(event.target.value)} />
      <Button type="submit" pending={command.pending} pendingLabel="Đang gửi báo cáo…" {...(blocked ? { disabled: true, disabledReason: blocked } : { disabled: false })}>Gửi báo cáo</Button>
    </Form>{command.message && <Alert title="Kết quả gửi">{command.message}</Alert>}
  </section>;
}
