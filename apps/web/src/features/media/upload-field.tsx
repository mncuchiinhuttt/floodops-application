import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Alert, Button, ImagePickerField } from "@floodops/ui-web";
import type { WebRuntime } from "../../app/runtime";
import { accessReason } from "../../shared/access";
import { MediaUploadTask, type UploadState } from "./upload-task";

export function MediaUploadField({ runtime, onChange }: { runtime: WebRuntime; onChange: (state: UploadState) => void }) {
  const task = useMemo(() => new MediaUploadTask(runtime), [runtime]);
  const state = useSyncExternalStore(task.subscribe, task.snapshot, task.snapshot);
  const [selectionError, setSelectionError] = useState("");
  useEffect(() => () => task.dispose(), [task]);
  useEffect(() => { onChange(task.snapshot()); return task.subscribe(() => onChange(task.snapshot())); }, [onChange, task]);
  const context = runtime.context(), denied = accessReason(context, "media:write", context.identity.participant.role, true);
  const pending = ["reading", "reserving", "uploading", "normalizing"].includes(state.phase);
  const labels = { idle: "Chưa chọn ảnh", reading: "Đang đọc ảnh", reserving: "Đang giữ chỗ upload", uploading: "Đang tải ảnh", normalizing: "Server đang chuẩn hóa ảnh", failed: "Upload chưa hoàn tất", ready: "Ảnh đã chuẩn hóa" };
  return <section aria-label="Upload ảnh thật"><ImagePickerField label="Chọn một ảnh PNG/JPEG" images={state.phase === "idle" ? [] : [{ id: "selected-image", label: "Ảnh của báo cáo" }]}
    hint="Tối đa 5 MiB. Chỉ media đã chuẩn hóa được chọn để gửi report; ảnh gốc không được dùng làm preview an toàn."
    pending={pending} disabledReason={denied ?? undefined} error={selectionError || (state.phase === "failed" ? state.message : undefined)}
    onRemove={() => { setSelectionError(""); task.clear(); }} onFilesSelected={files => {
      if (files.length !== 1) { task.clear(); setSelectionError("Chỉ chọn một ảnh cho báo cáo này."); return; }
      setSelectionError(""); void task.select(files[0]!);
    }} />
    <p role="status">{labels[state.phase]}</p>
    {state.phase === "ready" && <p>Media server: {state.media.media_id} · {state.media.width}×{state.media.height} · {state.media.byte_length} bytes</p>}
    {state.phase === "failed" && <><Alert title="Ảnh chưa ready">{state.message}</Alert>{state.canRetry &&
      <Button {...(denied ? { disabled: true, disabledReason: denied } : { disabled: false })} onClick={() => void task.retry()}>Thử lại cùng bước upload</Button>}</>}
  </section>;
}
