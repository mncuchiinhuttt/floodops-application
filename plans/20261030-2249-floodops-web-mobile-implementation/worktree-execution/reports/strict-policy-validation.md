# Strict agent policy và role launch validation

## Kết quả và phạm vi

**PASS cho phạm vi tài liệu/schema/fixture đã kiểm tra.** Root `AGENTS.md`, thứ tự13 role và startup protocol đã đồng bộ. Đây không phải chứng nhận sandbox, không phải application test, và không chứng minh agent/model chống được injection.

- [Root policy](../../../../AGENTS.md) · [Operator start](../start-here.md) · [Bootstrap/recovery](../agent-bootstrap.md) · [Injection policy](../prompt-injection-policy.md).
- [Machine results](strict-policy-validation.json) ghi fingerprint working-tree của policy. Chưa có published policy commit hoặc LaunchReceipt thực; các commit ID trong schema fixture chỉ là dữ liệu tổng hợp.

## Kiểm tra đã chạy

| Kiểm tra | Kết quả quan sát |
|---|---|
| Role dependency/order |13 role,12 phase,9 wave; dependency prerequisite thỏa trước mỗi wave. W2 và W4/W6 hỗ trợ owners song song như manifest; SourcesMedia không đợi DesignSystem. |
| Prompt/read set | Cả13 role prompt trỏ cùng root policy, exact order, bootstrap và injection policy; branch/folder/prompt trong operator table khớp manifest. |
| Policy/ownership |12 synthetic path/role outcomes đúng: policy/receipt/config ngoài ownership bị deny; Lead policy path và PlannerSafety-owned domain path đúng owner. Chỉ kiểm tra manifest matcher, không kiểm tra OS/tool sandbox. |
| Receipt schemas |3 receipt kinds chấp nhận fixture có policy fingerprint;8 negative policy cases bị từ chối, gồm fingerprint hợp lệ hình dạng nhưng khác working tree phải fail semantic comparison. JSON schema một mình không chứng minh commit được phê duyệt. |
| Inert injection corpus |22 scenario (18 hostile,4 benign) hợp schema, ID không trùng, INJ-01–12 đều có trace và mỗi rule được khai báo một lần.4 malformed fixture variants bị reject. Không execute payload hoặc đo agent attack success. |
| Document integrity | Các JSON trong plan parse được; links nội bộ, code fences và tables không lỗi; root policy116 dòng, root plan dưới80 dòng, role prompts dưới200 dòng. |

Lượt kiểm tra đầu phát hiện fixture chưa reference INJ-08 và INJ-10; đã bổ sung trace cho redacted incident evidence và benign keyword handling, rồi kiểm tra lại đủ12 rule. Không đổi product scope/API.

## Review độc lập

- [Security review](strict-policy-security-review.md): **0 High/Critical** trong phạm vi policy origin/hierarchy, secrets, teammate/tool/OCR/memory injection, authority boundaries và giới hạn claim.
- [Launch review](strict-policy-launch-review.md): **0 High/Critical** trong phạm vi13 prompt, thứ tự chạy, shared writers, policy pins, bootstrap/resume và handoff.
- Cả hai là static document review; không được diễn giải thành application/runtime security pass.

## Giới hạn và trạng thái

Chưa triển khai application, evaluator/hook hoặc filesystem/network sandbox. Chưa tạo branch/worktree của dự án, chưa cấp remote permission, chưa commit/push/deploy. Preview/EAS/model permission cần grant thật và tách riêng QA result; production/store/main promotion vẫn cần gate/authorization riêng. Operator phải publish policy+plan và thực hiện startup acknowledgement trước khi chạy implementation workers; tài liệu này không tự cấp quyền đó.
