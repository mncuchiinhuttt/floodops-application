# AI hỗ trợ review ảnh — US-30, advisory-only

## Quyết định và phạm vi
- Mở rộng US-30 hiện có; giữ34 US, POL-01–08, I1–I5, T01–T15 và8 Commander tools. Thêm bộ acceptance IR-01–IR-12 bên dưới, không biến AI ảnh thành nguồn road authority.
- Dispatcher trên **web và Expo native** mở report ảnh cộng đồng, chủ động bấm `AI nhận xét`. Không tự gọi model khi upload, không auto-retry. Một app mobile vẫn có workspace theo capability.
- Khối AI mô tả điều nhìn thấy, chất lượng, đối chiếu mô tả và lý do; Accept/Reject thủ công luôn độc lập. Model chậm/lỗi/unavailable không đổi report pending, không khóa thao tác review.
- Không xác nhận ảnh thật, đúng vị trí/thời gian; không đo chính xác độ sâu hoặc kết luận xe đi an toàn; không nhận diện người/biển số. Hash/metadata checks và điểm thưởng thuộc code server.

## Rubric và đầu ra định lượng
Điểm là **mức chất lượng quan sát theo rubric**, không phải xác suất ảnh thật, confidence của Observation hay phần trăm đường an toàn. UI ghi `Chất lượng ảnh: 75/100`, không `75% an toàn`.
- Rubric đánh giá **ảnh normalized thực sự đưa vào model**, không hứa chấm ảnh gốc không bị resize; provider có thể resize. Thử trên bộ ảnh human-labelled trước khi diễn giải độ tin cậy, không biến100-score thành phần trăm rủi ro.

| Dimension trong quality_ratings | 0 | 1 | 2 |
|---|---|---|---|
| sharpness | Không đọc được chi tiết | Mờ nhưng thấy một phần | Chi tiết tương đối rõ |
| lighting | Không đủ sáng để nhận xét | Sáng/tối không đều, thấy một phần | Đủ sáng cho nội dung nhìn thấy |
| scene_visibility | Không thấy cảnh đường/che hết | Chỉ thấy một phần cảnh | Cảnh liên quan tương đối rõ |
| detail | Không đủ chi tiết nhận xét | Có ít chi tiết liên quan | Có chi tiết hỗ trợ mô tả nội dung |

- Model chỉ trả bốn integer0–2. Server tính `quality_score = floor(100 * sum(ratings) / 8 + 0.5)`; kết quả0–100. Không dùng Python bankers-rounding khi sinh oracle; không nhận quality_score từ model/client.
- `report_match`: `yes` / `no` / `unclear` = nội dung nhìn thấy có phù hợp **mô tả** hay không. Thiếu mô tả/ảnh không đủ thông tin → unclear. Không suy địa điểm, thời điểm, tính xác thực hoặc passability từ yes.
- Server derive `recommendation`: score<50 **hoặc** match=unclear → `insufficient_evidence`; còn lại match=no → `needs_manual_check`; còn lại score>=75 → `looks_consistent`; còn lại → `needs_manual_check`.
- Mốc50/75 là đề xuất UX của rubric version `image-quality-v1`, không phải safety threshold/calibration D04. Đổi rubric phải version/hash mới và cập nhật contracts/examples/tests cùng cutover; không sửa ngầm để làm đẹp điểm.
- Ví dụ ratings(1,2,1,2) →75, match=yes →looks_consistent. Ratings(2,2,2,2) →100 nhưng match=no →needs_manual_check. Điểm cao không tự nâng confidence, Accept, award hoặc mở đường.
- Chưa có kết quả hợp lệ: `result=null`, status/reason riêng; không dùng0 để biểu diễn timeout/unavailable. Điểm0 chỉ có nghĩa model đã trả rubric hợp lệ với tổng0.

## Strict wire schemas
Tất cả object `additionalProperties:false`, các trường nêu dưới là required; string bounded, arrays unique khi là enum. Dùng snake_case, Id/date-time/common Error envelope hiện có.

1. `ImageReviewQualityRatings`: sharpness, lighting, scene_visibility, detail — integer0..2.
2. `ImageReviewModelOutput`: quality_ratings; visible_summary (string1..600); report_match (yes/no/unclear); mismatch_notes (0..5 strings1..200); reasons (1..5 strings1..200). Đây là output model-only, **không** quality_score/recommendation/confidence/condition/points/accept/execute.
3. `ImageReviewAdvice`: toàn bộ fields ModelOutput cộng quality_score (integer0..100), recommendation (looks_consistent/needs_manual_check/insufficient_evidence). Dùng flat properties strict, không allOf làm lỏng unknown-property validation. Server recompute các derived fields, không chỉ tin schema.
4. `ImageReviewJobInput`: empty object `{}`; không nhận image_url, model, report identity, ratings, score, status, role hoặc threshold từ client.
5. `ImageReviewJob`: job_id, session_id, generation, report_id, input_digest (64 lowercase hex), model (string1..100), model_config_hash (64 lowercase hex), rubric_version (const image-quality-v1), status (queued/running/completed/failed/superseded), result (Advice|null), error_code (MODEL_TIMEOUT/MODEL_REFUSED/MODEL_INVALID_OUTPUT/MODEL_UNAVAILABLE/STORAGE_UNAVAILABLE|null), created_at, deadline_at, completed_at (date-time|null).
   - completed: result nonnull, error_code null, completed_at nonnull. failed: result null, error_code nonnull, completed_at nonnull. queued/running: result/error/completed_at null. superseded: result/error null, completed_at nonnull. Enforce with schema conditionals.
6. `ImageReviewState`: report_id, job (ImageReviewJob|null). Null job = chưa yêu cầu, không phải thất bại hoặc điểm0.
7. `ImageReviewJobResponse` và `ImageReviewStateResponse`: success/data/error/meta envelope theo convention hiện có.

## API contracts — hai operations mới
| Method / path (prefix /api/v1) | operationId / response | Quyền và preconditions |
|---|---|---|
| POST /sessions/{session_id}/reports/{report_id}/image-review-jobs | createReportImageReview; body{};202 ImageReviewJobResponse | dispatcher only; Idempotency-Key, web CSRF+Origin; không operational If-Match. Report citizen/photo pending_review, normalized owned media hoặc approved normalized fixture sẵn sàng. |
| GET /sessions/{session_id}/reports/{report_id}/image-review | getReportImageReview;200 ImageReviewStateResponse | dispatcher only; current report/session access; no-store; chưa có job trả job=null. |

- Không thêm quyền vào submitReport/reviewReport/getReport. Driver/contributor tiếp tục chỉ thấy own human decision/points, không có quyền gọi model hoặc đọc AI advice người khác.8 Commander tools không được cấp vision/review/execute quyền mới.
- Existing errors:403 FORBIDDEN;404 NOT_FOUND cho wrong-session/owner reference;410 SESSION_RESET/SESSION_EXPIRED;409 STATE_CONFLICT nếu report không còn pending hoặc409 MEDIA_NOT_READY;422 INVALID_IMAGE/DUPLICATE_IMAGE nếu thiếu ảnh hợp lệ/known duplicate;429 RATE_LIMITED;503 MODEL_UNAVAILABLE/STORAGE_UNAVAILABLE. Không fake result khi model disabled/unsupported.
- Same idempotency key + request digest replay cùng outcome; key reused sai scope/payload →409. Với key mới, cùng input_digest đang queued/running **hoặc completed hợp lệ** thì reuse job/result, không gọi model lại. Sau failed, retry cần user chủ động và key mới; mọi call thật tính budget.
- API hiện có64 operations/59 paths; bổ sung hai path này thành66 operations/61 paths. Không đổi signature của Report/ReviewInput hoặc nâng API version giả như đã deploy; artifact vẫn planning contract, phải publish new hash/amend consumers.

## Authority, persistence và stale result
1. Server authorize → load report + safe image derivative → hash immutable report context. input_digest bind session/generation/report, normalized image digest, description/segment/capture/vehicle input, pending review state, model config và rubric/prompt version; không dùng untrusted hash từ caller.
2. Trong DO transaction ngắn: kiểm current binding, reserve quota/job, persist latest job pointer per report và deadline; không await R2/LLM trong transaction. Idempotency replay không reserve budget/call lần hai.
3. Đọc đúng normalized owned R2/approved fixture bytes ngoài transaction; gửi một ảnh bằng Responses `input_image` data URL và text context tối thiểu, không public R2/raw media URL/File API upload/extra external provider. Recheck pending/current binding ngay trước paid call nếu đã bị superseded.
4. Provider port dùng self-contained strict `ImageReviewModelOutput` schema do ContractsClient publish (resolve local refs/compatible provider subset, không network refs hoặc gửi nguyên Job/Advice/OpenAPI document). Server luôn revalidate full bounded ModelOutput; refusal, timeout, malformed/unknown/forbidden fields → failed/null result. Không nới wire validation vì provider compatibility. Server tính score/recommendation; model không có tools, execute/review/reward port hay secrets trong input.
5. Sau response: transaction recheck session/generation/report/input_digest/latest job/pending status/deadline. Human Accept/Reject, changed input/model/rubric, Reset/expiry hoặc supersession → không publish current advice; mark superseded/discard. Unrelated operational revision alone không biến một ảnh bất biến thành ảnh mới.
6. AI metadata chỉ đổi job/audit/event_sequence, **không operational revision hoặc report.status/knowledge/gap/award/route/ETA**. Event.type thêm `image_review_changed`, projection dispatcher-only, resource IDs an toàn; no raw image/advice text/capability trong SSE/log. SSE chỉ invalidate/refetch, không cấp quyền.
7. Crash/eviction: persisted deadline + lease/job state; chỉ **queued/running** quá deadline mới fail MODEL_TIMEOUT hoặc superseded, unlock slot, không tự provider-retry sau crash. Late response không publish. GET reconcile overdue/current-binding; completed advice đúng binding không mất hiệu lực chỉ vì deadline của provider call đã qua. Scheduled cleanup không giữ job running vô hạn.
8. Human review route không đòi AI job completed, score threshold hoặc advice ID; Accept/Reject thực vẫn dùng deterministic checks + atomic observation/gap/award transition hiện có. Human decision hoàn tất invalidate pending/current AI advice.

## Budget, config, privacy và frontend
- Reuse OPENAI_API_KEY server secret; `OPENAI_IMAGE_REVIEW_MODEL` phải hỗ trợ image input + strict structured output sau compatibility check. Không silent fallback sang text-only Commander hoặc hardcoded canned advice.
- Resource policy đề xuất: IMAGE_REVIEW_CONCURRENCY_PER_SESSION=1, MAX_IMAGE_REVIEW_CALLS_PER_SESSION=50, MODEL_DEADLINE_SECONDS hiện có20, IMAGE_REVIEW_MAX_OUTPUT_TOKENS=1000; một normalized image theo upload size/dimension limits hiện có. Provider/account hard cap + killswitch bắt buộc; không claim global distributed billing ledger.
- Explicit scoped preview/model budget grant trước live provider evaluation; không tạo key/account hoặc chạy paid call trong task cập nhật tài liệu. Provider-image data handling/consent/retention phải kiểm theo account thực; dùng ảnh synthetic/được phép, không PII/registration data. Không claim zero retention chưa có evidence.
- Web+native cùng Review detail có button, pending/running, score/4 ratings, Có/Không/Chưa đủ thông tin, visible summary, mismatch/reasons, label AI advisory và limitation. Accept/Reject ở ngoài AI card, vẫn thao tác khi AI pending/lỗi; không default Accept/Reject theo recommendation.
- Clear pending/null/error/stale states, no fake percentages/green safe-road badge. Text escaped, no raw HTML; OCR/caption instructions là untrusted data, không commands. Native offline không queue AI request; explicit online action, existing report draft behavior giữ nguyên.

## Ownership và integration
- ContractsClient:8 schemas/new operations/typed client/events enum, self-contained compatible strict ModelOutput schema, unknown-property checks và new examples. Existing Report, review command, 8 tool schemas giữ nguyên.
- SourcesMedia: public authorized normalized-image read/digest port và readiness/duplicate status; không gọi model hoặc commit review/reward.
- ReviewRewards: image-review service/router/job guards/provider adapter **trong** `apps/api/src/features/reports/review/`; tests trong `apps/api/test/review/`. Port tên `ImageReviewPort`, một Responses request, không deep-import PlannerSafety OpenAI integration.
- SessionPlatform: persistent image-review metadata/lease/budget hooks, dispatch-only event projection và shared deadline cleanup thông qua request/gate amendment. Generic DO schema/runtime files vẫn owner hiện hành; ReviewRewards gửi request, không sửa ngoài scope.
- DesignSystem cung cấp primitives; WebConsole/ExpoMobile làm AI card trong Review hiện có, không thêm app/route chính mới. QA chạy IR cases qua actual service. IntegrationLead duy nhất compose central router/ports/env/DO schema requests; ReleaseOps ghi vision config/rollback prerequisites.
- Không đổi13 roles/9 waves. Lead publish contract/spec amendment trước relaunch affected ContractsClient/SessionPlatform/SourcesMedia/ReviewRewards/clients/QA; không silently sửa active pinned receipts hoặc sync repo app riêng.

## Acceptance bổ sung bắt buộc — US-30, IR-01–IR-12
| ID | Hành vi và expected outcome |
|---|---|
| IR-01 | All81 rubric rating vectors → score đúng floor-half-up, bounded0..100; tri-state match và derived recommendation theo precedence. Model/client score/recommendation/authority fields bị reject. |
| IR-02 | Valid photo + completed advice → web/native hiển thị score, yes/no/unclear, explanation và advisory label; report vẫn pending, revision/knowledge/awards/routes không đổi. |
| IR-03 | Score100 + match=no → needs_manual_check, không auto Reject; score100 + match=unclear → insufficient_evidence; no fabricated safety probability. |
| IR-04 | Timeout/refusal/malformed/unsupported/no credits → failed/unavailable/null, không0 hoặc canned success; manual Accept/Reject tiếp tục hoạt động. |
| IR-05 | Same-key retry và new-key same current input/active or completed job → một provider call/reservation; explicit retry failed bounded budget, no background retry. |
| IR-06 | Contributor/driver/wrong-session/unready media/raw URL request → denied trước provider; quota/concurrency/deadline enforce, không leak image/advice. |
| IR-07 | Human Accept/Reject trong lúc model chạy → human decision ghi một lần; late output superseded, không rollback/second award. |
| IR-08 | Reset/expiry/input hoặc rubric/model change/crash/lease expiry → old result không thành current, slot không kẹt; unrelated operational revision không auto rerun/call. Completed advice đúng binding vẫn đọc được sau provider deadline; queued/running quá deadline mới timeout. |
| IR-09 | OCR/caption chứa lệnh mở E17/cộng điểm/Execute hoặc schema có confidence/condition/points → không unauthorized effect; dangerous fields reject, genuine image content vẫn review thủ công. |
| IR-10 | Duplicate hash/invalid media/location/time deterministic failure vẫn có reason; score cao không override check, không gỡ closure hoặc đổi vehicle scope. |
| IR-11 | Mobile AI request needs online; pending/error không khóa form/review, restart/refetch đúng binding, no offline command outbox; dispatcher-only stream không leak cho field roles. |
| IR-12 | Bộ ảnh được phép có clear/dark/blur/occluded/mismatch/unclear/injection, human-labelled rubric/match; live-model run báo đủ sample IDs/model/prompt/hash/status, rating/match agreement và forbidden-claim count. Không gọi rubric score là calibrated probability hoặc dùng stub để claim vision quality. |

## Evidence và nguồn
- [OpenAI Images and vision](https://developers.openai.com/api/docs/guides/images-vision): Responses nhận image input; vision có thể mô tả sai, giới hạn spatial reasoning và không xử lý original metadata. Primary docs được đọc để thiết kế; không phải provider/live-image test.
- [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs): Responses hỗ trợ JSON Schema `text.format`/strict output, nhưng schema adherence không xác nhận nội dung ảnh đúng; compatibility/refusal/incomplete cần xử lý riêng.
- [PRD](../../../FloodOps/prd.md) · [API inventory](../contracts/api-index.md) · [OpenAPI](../contracts/openapi.json) · [Testing](testing-strategy.md).
- Artifact này là đặc tả, không implementation, model evaluation hay deployment evidence.
