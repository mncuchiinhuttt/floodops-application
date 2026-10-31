# Shared contracts và đổi interface trong multi-worktree mode

## Freeze C1
Trước wave2, ContractsClient + Lead phải công bố commit/hash cho:
- Canonical OpenAPI/request-response/error/operation IDs,8 tool schemas, examples.
- packages/contracts public exports và typed api-client HTTP/cancellation/SSE/cursor interfaces.
- Roles/permissions, credential delivery/cookie/CSRF, revision vs event_sequence, idempotency/retry/Reset semantics.
- Domain value units/time/WGS84/null ETA và discriminated source/report/plan types.

Trước UI, DesignSystem + Lead công bố token names/platform adapters/icon IDs/primitive prop contracts; backend-ready chốt actual router composition/API-local configuration. Không đóng băng bằng lời nói không có commit.

## Những invariant mọi role phải giữ
- Approve không Execute; replan không tự Execute; hard closure/vehicle/capacity/conflict không override.
- Snapshot/revision/latest job+plan/generation checks nhất quán; pending preview không thành committed assignment/ETA.
- Reports accepted, useful coverage/reward và route approval là3 kết quả riêng; image/media session scope bắt buộc.
- Reward exactly-once; Reset body loss/recovery và old session fence; no credentials trong events/log/query.
- Shared physics/events/H, independent branch state, provenance/calibration labels; no fabricated KPI or live provider integration.
- API serializer/schema không fork web/native; native không import shadcn/Radix/DOM.

## Change protocol (một request, một decision owner)
1. Worker tạo request trong own report namespace, gồm work_item_id/base/contract hash, use case, minimal change, producer/consumer/tests ảnh hưởng.
2. Lead phân loại: dependency/config (Lead), wire/API/client (ContractsClient), simulator fixture/physics (SimulationData), domain feature (owner), UI primitive/token (DesignSystem).
3. Owner implement patch trên baseline mới được authorize. Worker consumer không tự write producer source hoặc private import tạm.
4. Lead merge producer trước, update contract/interface hash và launch receipts. Consumer refresh **sau** producer đã integrated; commit old work không bị discard.
5. Đổi schema/semantics cần cập nhật tests/examples/consumers cùng cutover; không để dual API alias/deprecated shim để tránh conflict.
6. Nếu amendment tác động agent đang làm, Lead gửi stop/resync notice theo tên agent; không để consumer tiếp tục trên contract cũ rồi giải sau.

## Stable feature router seam
- Platform owner: Hono factory nhận typed router/service dependencies; middleware/runtime ownership không nằm trong feature handlers.
- Mỗi API owner xuất router factory/service public entrypoint từ own subtree, kèm dependencies/binding needs trong handoff.
- Lead compose apps/api/src/index.ts sau backends ready, không mở source feature để đổi rule. ReviewRewards xuất review/conflict-review router riêng thay sửa reports parent router của SourcesMedia.
- SourceReport transition và Reward review orchestration dùng ports/result types công bố; thiếu API thì request, không mutate private state.
- Simulator/domain/LLM ports injected; tests deterministic không yêu cầu live provider để validate core safety. Real-model claims cần proof riêng.

## Commands và generated artifacts
- Role chạy scoped tests/smoke sau slice hoàn tất. Không repository-wide build/lint/formatter trong lúc nhiều owner đang sửa; final suite do Lead/QA trên frozen integration.
- Chỉ Lead cập nhật package manifests/lockfile. Worker dùng frozen install, không Expo/shadcn generator auto-edit protected files.
- App/package public export/config requests có owner; không thêm catch-all barrel để lách giới hạn file/ownership.
- Generated spec/type output phải match source và baseline hash; không regenerate bằng version khác rồi overwrite đồng đội.

## US-30 image-review contract amendment
- [Feature spec](../specs/ai-assisted-image-review.md) bổ sung2 API operations và8 typed schemas vào canonical API; giữ8 Commander tools và public Report/manual review payloads. Đây là user-approved amendment, không phải worker tự thêm API.
- C1 phải publish contract/client/event source hash mới; producers/consumers nhận approved baseline amendment trước khi implementation tiếp tục. Không sửa active receipts/gates trong working tree để giả đã được cấp quyền.
- Bốn rubric ratings0–2 do model đề xuất, quality_score0–100/recommendation do server derive; yes/no/unclear chỉ là description match. Schema-valid Advice vẫn phải semantic-check derived fields; không confidence/safety/acceptance/reward authority từ numeric score.
- Image-review event/job metadata không tăng operational revision. Client cache phải nhận cùng-revision job progress qua event_sequence/job/input_digest; stale/reset/manual-decision guard vẫn bắt buộc. IR-01–IR-12 bổ sung các acceptance hiện có.
