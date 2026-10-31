# US-30 AI image review — verification evidence

## Phạm vi và kết luận

PASS cho contract/schema và semantic-reference checks đã thực sự chạy dưới đây. Đây là cập nhật PRD/plan, **không implementation hoặc runtime/model/device/security certification**. [Feature spec](../specs/ai-assisted-image-review.md) và [PRD §6.3.1](../../../FloodOps/prd.md) là yêu cầu mới; không cấp quyền remote hoặc sửa active receipts.

## Contract checks đã chạy

| Hạng mục | Kết quả quan sát |
|---|---|
| API inventory |66 operations /61 paths;64 operations cũ giữ nguyên definition. |
| Component schemas |194;8 schema image-review mới. Schema cũ giữ nguyên, chỉ Event.type thêm image_review_changed. |
| Request/response examples |46 positive/negative fixtures đúng declared expectation, gồm27 image-review fixtures mới;19 fixture cũ giữ nguyên. |
| JSON references/path parameters |1,576 local OpenAPI references resolve; path parameters đủ cho66 operations. |
| Permission/command metadata | Hai operations mới dispatcher-only; POST idempotent + Idempotency-Key, không operational If-Match. |
| Forbidden model overrides |8 trường score/recommendation/acceptance/points/confidence/condition/execute/URL bổ sung đều bị ModelOutput strict schema reject. |

## Rubric và ý nghĩa con số

- Đã enumerate81 vectors của4 ratings0–2 và3 report_match outcomes, kiểm243 semantic-reference outcomes: half-up score đúng bảng0/13/25/38/50/63/75/88/100 và recommendation đúng precedence.
- Ví dụ(1,2,1,2) →75/100;100/100 + match=no →needs_manual_check;100/100 + unclear →insufficient_evidence.
- Mỗi derived Advice trong oracle hợp shape; điều này chỉ kiểm đặc tả tính điểm và dữ liệu mẫu, **không phải actual application controller hoặc ảnh/model đúng**. JSON shape không tự chứng minh score tính đúng; server phải recompute từ ratings.
- Không diễn giải75/100 thành75% ảnh thật/AI đúng/đường an toàn, không100-score thành risk probability và không gán Observation confidence từ điểm.

## Preservation checks đã chạy

13 role,9 wave,12 phase giữ nguyên; role identity/branch/dependency/ownership/port và phase checklist metadata không đổi. Root policy,8 Commander tool contracts và tool fixtures byte-for-byte giữ nguyên. Task manifest thêm một critical advisory-proof item (tổng6) và yêu cầu explicit Lead baseline amendment.

## Tài liệu/ownership và review độc lập

- 73 Markdown documents được kiểm links/fences/tables sau integration:597 local links resolve; toàn bộ JSON parse.34 US giữ IDs, chỉ US-30 row mở rộng; POL/T tables giữ nguyên.12 phase/88 checklist steps, overview<80 dòng và13 role prompts<200 dòng giữ đúng.
- 8 planned implementation paths cho review service/provider/tests, session metadata, media port, web/native card và spec khớp đúng một existing owner; không thêm scope/branch/port hoặc đổi waves.
- [Contract audit](image-review-contract-audit.md) và [Workflow audit](image-review-workflow-audit.md): **0 High/Critical** trong phạm vi static documentation review. Không chứng minh app/model/security đúng.
- Suggestion wording duy nhất đã đồng bộ vào concurrency/test summary: chỉ queued/running job mới timeout theo request deadline; completed-current advice vẫn đọc được sau deadline.

## Những gì chưa chạy

Chưa có application implementation, Worker/provider call, browser/native UI hoặc device run, image attack/model evaluation hay calibrated vision-quality evidence trong task này. IR-01–IR-12 là acceptance được yêu cầu, không phải12 runtime tests đã pass. Budget/model/ảnh được phép/data handling và external environment phải được xác minh ở implementation; manual review không phụ thuộc việc model sẵn sàng. Chưa commit/push/deploy hoặc tự sync repo app riêng; tài liệu mới chưa tự xuất hiện trong baseline đã pin của Dots/worker.
