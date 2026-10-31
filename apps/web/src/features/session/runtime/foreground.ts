import { ApiError, RequestScope, watchEvents } from "@floodops/api-client";
import type { WebRuntime } from "../../../app/runtime";

export async function followSession(runtime: WebRuntime, streamScope: RequestScope, onStatus: (message: string) => void): Promise<void> {
  const captured = runtime.snapshot(), initialMeta = runtime.eventMeta;
  if (!captured.identity || !initialMeta) return;
  const { session, participant } = captured.identity;
  try {
    onStatus("Đang kết nối cập nhật phiên…");
    for await (const event of watchEvents(runtime.api, { scope: streamScope, initialMeta,
      refresh: async signal => { await runtime.ensureIdentity(session.session_id, signal, true); return runtime.eventMeta!; } })) {
      if (streamScope.signal.aborted || runtime.snapshot().epoch !== captured.epoch) return;
      if (["session_reset", "session_expired", "capability_revoked"].includes(event.type)) {
        if (event.type !== "capability_revoked" || event.resource_ids.includes(participant.participant_id)) {
          runtime.clear(); onStatus("Phiên hoặc capability đã đổi. Cần ghép nối lại."); return;
        }
      }
      await runtime.refresh(streamScope.signal);
      await runtime.queries.invalidateQueries({ queryKey: ["session", session.session_id, session.generation, participant.participant_id] });
      onStatus(`Đã nhận cập nhật #${event.event_sequence}`);
    }
  } catch (error) {
    if (!streamScope.signal.aborted && runtime.snapshot().epoch === captured.epoch && error instanceof ApiError && [401, 403, 410].includes(error.status)) runtime.clear();
    if (!streamScope.signal.aborted && runtime.snapshot().epoch === captured.epoch) onStatus("Luồng cập nhật gián đoạn. Dùng Làm mới để kiểm tra trạng thái."); }
}
