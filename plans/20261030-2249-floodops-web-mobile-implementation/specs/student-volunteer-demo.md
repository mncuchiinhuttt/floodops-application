# AM-C02 - Chiến dịch sinh viên và điểm rèn luyện mô phỏng

## 1. Quyết định và phạm vi

Ngày 31/10/2026, user chốt `student_volunteer_demo` là mode contributor trong M2, không app/main role/backend mới. AM-C02 thêm US-40/US-41, T22..T24, D13; giữ US-39/T21/D11 forecast và D12 milestones của PRD v0.5. Tổng 41 US (M1 31; M2 10); M1 web core không đòi campaign/native. 66 API operations/8 tools vẫn là legacy baseline pending cutover; invariants giữ nguyên.

Đây là demo hoàn toàn. Không có trường tham gia duyệt hoặc cam kết công nhận. Tên HCMUT/Bách Khoa HCM (Demo), HCMUS/KHTN TP.HCM (Demo), UIT (Demo) chỉ là nhãn profile với chính sách hư cấu; không dùng logo, con dấu, giấy chứng nhận hay quy chế thật để tạo cảm giác chính thức. Không gọi quyền lợi này là tín chỉ học phần, ngày CTXH hoặc tín chỉ rèn luyện.

Mọi màn hình campaign, nhiệm vụ, kết quả, ledger và bảng hạng student mode giữ nhãn: **Điểm rèn luyện mô phỏng - không có giá trị công nhận của trường**. Tổng chỉ phản ánh đóng góp hoạt động trong FloodOps demo, không phải tổng ĐRL 0-100 của trường, GPA hoặc điều kiện tốt nghiệp.

## 2. Hai mode và luồng chung

| Mode | Đầu ra sau ReviewResult | Policy cần trước publish |
|---|---|---|
| Contributor thông thường của AM-C01 | ContributorRewardEngine xét bounty, committed points, regional ranking và quyền lợi Simulated | Grade/bounty policy, slot, review window và budget/inventory tương ứng theo AM-C01; số điểm thường vẫn TBD |
| `student_volunteer_demo` | ContributorRewardEngine chọn nhánh DemoRecognitionEngine; ghi ledger ĐRL mô phỏng khi đủ điều kiện | Current policy classification, một campus profile, academic period fixture, `student-recognition-demo-v1`, activity/attendance fixtures và review policy hợp lệ; không cần bảng bounty thường, voucher budget, sponsor hoặc trường thật duyệt |

Mode và campus profile được server fixture/policy bind vào campaign và enrollment, không do client tự đổi để chọn thưởng. Student mode không tạo bounty award, điểm regional AM-C01 hoặc voucher/phần thưởng tiền tệ cho cùng submission/activity. Mode thường giữ nguyên hành vi; không quy đổi điểm game sang ĐRL, không nhân ĐRL theo S-F hoặc rank.

1. Dispatcher xác định thiếu dữ liệu và gửi DataRequest theo AM-C01, chọn campaign student demo trong quyền quản lý được cấp.
2. Code tính MissionClassification S-F từ bound request/trusted context và deterministic rules/policy version; service validate current request-policy binding trước board. Missing rules/threshold/config hoặc stale giữ draft/recompute, không model/client/default grade.
3. Contributor có StudentDemoEnrollment fixture phù hợp xem campaign, lý do công khai, cấp S-F, hoạt động và điều kiện ĐRL mô phỏng; gửi ảnh/thông tin đúng mission.
4. Dispatcher review thủ công; DispatcherReviewService trả ReviewResult có decision/reasons/validated facts đúng binding. Optional US-30 vision advice vẫn riêng, không quyết định điểm.
5. ContributorRewardEngine rẽ theo mode server-bound. DemoRecognitionEngine kết hợp current ReviewResult với xác nhận tham gia synthetic tin cậy, kiểm điều kiện/unique/caps rồi ghi nhận nguyên tử hoặc trả trạng thái có reason.
6. Web/native hiển thị review decision/nhận xét và trạng thái, số ĐRL mô phỏng đã commit, hạn mức campaign/kỳ và bảng hạng đúng campus profile/kỳ.

Không có bước trường duyệt, SSO, tài khoản trường hoặc chờ đối tác thật trong luồng này. Contributor subtype không được cấp thêm quyền dispatcher, review, Reset hoặc tự ghi xác nhận tham gia.

## 3. Cấu hình demo mặc định v1

Policy version: **`student-recognition-demo-v1`**. Các số sau là cấu hình sản phẩm mặc định được chọn theo yêu cầu thiết kế demo của user, trình bày cụ thể để review; không là số user trích dẫn hoặc suy từ quy định của các trường.

| Profile hư cấu | Một hoạt động đủ điều kiện | Trần mỗi campaign | Trần trong một kỳ demo, cộng tất cả campaign |
|---|---|---|---|
| HCMUT/Bách Khoa HCM (Demo) | +2 ĐRL mô phỏng | 4 | 6 |
| HCMUS/KHTN TP.HCM (Demo) | +3 ĐRL mô phỏng | 6 | 9 |
| UIT (Demo) | +5 ĐRL mô phỏng | 10 | 15 |

Mỗi enrollment tối đa **2 hoạt động được cộng trong một campaign và 3 hoạt động trong cùng academic period/generation trên tất cả campaign**. Một activity 240 phút vẫn là một lần cộng cố định; không tính `floor(minutes/120)`. S-F chỉ giúp chọn ưu tiên dữ liệu, không thay +2/+3/+5. Chưa có đồng tiền, quy đổi hoặc quà tiền tệ trong mode này.

Enrollment do server association với participant synthetic, profile, academic period và generation; một participant chỉ có một enrollment hiện hành trong một demo run. Profile/period không là input tự do trong body hoặc role picker. Muốn so profile khác cần run/generation và enrollment demo mới; không chuyển ledger, tái dùng report hoặc replay attendance cũ. Không thu MSSV, giấy tờ, email, tên thật hoặc xác thực trường.

## 4. Hoạt động đủ điều kiện

Mỗi grant cần đồng thời hai điều kiện cho **một canonical volunteer activity occurrence** thuộc đúng enrollment/student campaign:

- Xác nhận synthetic từ trusted scenario fixture/server demo record cho biết **ít nhất 120 volunteer minutes** của hoạt động đó.
- Có **ít nhất một report chất lượng được dispatcher accepted qua ReviewResult hợp lệ**, hoặc validated mission completion có backing report/ReviewResult tương ứng; đúng scope/versions và freshness tại lúc review xác nhận.

Attendance fixture có canonical occurrence, participant/enrollment, campaign, interval/minutes, provenance và confirmation version. Server kiểm fixture được phép, không overlap hoặc duplicate cùng thời gian tham gia; activity trùng/overlap không được tính hai lần. Không nhận số phút do student body tự khai, app mở bao lâu, GPS, số ảnh hoặc thời gian chờ wall clock làm chứng cứ.

120 phút ở đây là giá trị attendance synthetic để diễn tập; không đổi operational simulation clock, physics, travel/service/TTL, D04 hoặc bắt người demo chờ thật hai giờ. Không cộng phút từ nhiều activity chưa đạt 120 để biến thành một grant mới.

ReviewResult phải là latest authenticated decision của backing report, khớp enrollment/session/generation/request/mission/report versions đã bind; task/request mới không tự hủy snapshot report đã nhận. Report pending/rejected/invalid/duplicate không đủ điều kiện. US-30 image quality score 0-100 không là ngưỡng, độ an toàn hoặc quyền công nhận.

Report hợp lệ, chất lượng đạt nhưng redundant theo first-fill/bounty slot thường vẫn có thể chứng minh tham gia hợp lệ; ĐRL mô phỏng không phụ thuộc first-gap award hoặc general reward slots. Điều đó không cho phép ảnh trùng, report lỗi hoặc tự nhận completion vượt qua review. Observation/evidence expiry sau review hợp lệ không thu hồi ĐRL đã ghi nhận trong run hiện hành. Reset hoặc session expiry vẫn xóa runtime theo mục 5.

Hai điều kiện có thể tới theo bất kỳ thứ tự nào. ReviewResult đến trước thì chờ participation, attendance đến trước thì chờ review; engine đánh giá lại khi điều kiện còn thiếu được bổ sung, không mint trước kết quả người review.

## 5. Ledger, caps và atomicity

- Grant unique theo **(enrollment, activity occurrence, generation)**, độc lập policy version. Policy version được pin trong record, không đưa vào unique key để đổi version rồi nhận lại.
- Một backing report chỉ dùng cho **một activity credit**, kể cả khác campaign; ràng buộc reuse theo report ID/generation. Nhiều ảnh/completions trong cùng activity chỉ tạo một grant.
- Counter campaign và academic-period aggregate dùng cùng enrollment/profile/period/generation; kiểm trần trước grant, kể cả hai campaign gửi đồng thời. Không tách counter theo device, report, policy version hoặc campaign cho trần kỳ.
- Commit eligibility/grant hoặc outcome, ledger, campaign counter, period counter và events/idempotency nguyên tử trong authoritative session. Khi hai điều kiện cùng đủ, transition đó nhận current bound ReviewResult và attendance fixture; không await model/network trong transaction.
- Ở trần, hoạt động hợp lệ vẫn accepted, kết quả `capped`, credited 0 kèm lý do trần campaign hoặc kỳ. API/technical error không phải 0 ĐRL hoặc `capped`; lỗi không partial commit, retry/replay không tăng ledger/counters.
- Nhánh student không ghi thêm normal bounty award/rank/prize. Observation/knowledge vẫn theo review và safety policy hiện có; công nhận demo không tự tăng confidence, gỡ closure hoặc cho phép route/Execute.
- Reset hoặc session expiry fence generation cũ, xóa runtime enrollment participation, ledger/counters/campus ranking và rehydrate fixture trong run mới. Không tuyên bố giữ thành tích học kỳ ngoài đời; event/report/attendance từ run cũ không dùng lại.

| Trạng thái | Hiển thị |
|---|---|
| `pending_review` | Đợi dispatcher review; chưa cộng ĐRL mô phỏng |
| `pending_participation` | Review đủ chuẩn nhưng chưa có xác nhận đủ 120 phút; chưa cộng |
| `recognized_demo` | Đã ghi nhận mô phỏng, hiển thị số commit và policy version |
| `ineligible` | Không đạt, hiện reason; không đổi rejection thành pending điểm |
| `capped` | Hoạt động hợp lệ nhưng chạm trần, +0 kèm trần cụ thể |

Không trạng thái nào được ghi “Đã được trường duyệt”. Nếu cả hai điều kiện còn thiếu, `pending_review` kèm participation còn thiếu; nếu report bị loại thì `ineligible` dù attendance đủ.

## 6. Ví dụ diễn tập

Ví dụ độc lập trừ chuỗi A/B bên dưới; tất cả attendance là fixture, không phải chờ thật.

| Tình huống | Kết quả |
|---|---|
| 119 phút + report accepted chất lượng | `pending_participation`, chưa cộng; cần fixture confirmation đủ 120 phút cho chính activity |
| 120 phút + report accepted chất lượng, chưa chạm trần | HCMUT-Demo +2; HCMUS-Demo +3; UIT-Demo +5 |
| Một activity 240 phút + một report hợp lệ | Một grant +2/+3/+5, không nhân đôi |
| Một activity có nhiều ảnh/completions hợp lệ | Một grant; backing report đã dùng không cấp cho activity khác |
| Hai bên cùng gửi lại result/attendance hoặc đổi policy version | Không grant thứ hai, counter giữ nguyên |

Chuỗi HCMUT-Demo cùng enrollment/kỳ/generation, mỗi activity có report riêng và attendance đủ, không overlap:

1. Campaign A: activity A1 +2, A2 +2; tổng A=4, tổng kỳ=4.
2. A3 vẫn accepted nhưng `capped`, +0 do trần campaign 4; tổng kỳ vẫn 4.
3. Campaign B: B1 +2; tổng B=2, tổng kỳ=6.
4. B2 là activity hợp lệ thứ tư có thể xét trong kỳ nhưng `capped`, +0 do trần kỳ 6; tổng kỳ vẫn 6. Không dùng A3/report cũ để nhận lại ở B.

HCMUS-Demo và UIT-Demo có cùng số tối đa activity, lần lượt tổng campaign/kỳ 6/9 và 10/15. Không dùng raw +2/+3/+5 để so người giữa các profile.

## 7. Web/native, campus ranking và privacy

- Cùng app contributor, có filter/tab student campaign với campus profile hư cấu, kỳ demo và nhãn bắt buộc; chỉ enrollment được server cho phép mới xem/gửi campaign tương ứng. Campaign một profile, không public roster sinh viên.
- Mission giữ S-F và cảnh báo quan sát an toàn; thêm activity, hai điều kiện, grant cố định, cap còn lại và trạng thái. Không yêu cầu GPS nền, giấy tờ hoặc waiting timer hai giờ.
- Own result/ledger hiện review reason, attendance status/source Demo, credited amount, policy version và campaign/kỳ counters. Counter là đọc server, không optimistic grant hoặc editable selector để né trần.
- Campus leaderboard chỉ trong **cùng campus profile + academic period + generation**, tổng từ committed demo ledger, alias/own position, đồng điểm đồng hạng/thứ tự ổn định. Không gộp so raw ĐRL giữa trường, không trộn regional bounty ranking hoặc gắn tiền thưởng.
- Không lộ ảnh, report/attendance cá nhân, định danh hoặc operational context của người khác. Client không mở ledger dispatcher hoặc ghi fixture.
- Offline chỉ lưu report draft; reconnect refresh mode/enrollment/mission/policy/generation rồi explicit Send. Không queue attendance, recognition, review hoặc Reset. Run mới không tự relink draft/evidence cũ.

## 8. Acceptance và contract cutover

Student là extension M2 riêng: completion cần mode-specific contracts/current deterministic classification/capability/config, attendance/review và web/native evidence; không đợi US-39 forecast, hub/defer/P2 hoặc normal bounty first-fill conflicts/slots/budget. Safety/evidence-conflict/manual-review guards vẫn áp dụng.

| ID | Phải chứng minh sau implementation |
|---|---|
| T22 | Ba profile/policy/caps và nhãn Demo; chỉ enrollment đúng campaign; student publish không chờ bounty/voucher/real school; AM-C01 mode thường không đổi |
| T23 | 119/120/240 phút, hai điều kiện tới hai thứ tự, report quality/reject/duplicate/pending/redundant, report reuse, activity overlap, policy retry, campaign/kỳ caps xuyên campaign và concurrency/atomicity |
| T24 | M2 full loop web/native/status/ledger/alias ranking/labels/privacy/no double normal award; observation expiry sau accepted review giữ credit trong run; Reset hoặc session expiry xóa runtime enrollment/ledger/counters/rank và fence old generation, offline không replay evidence cũ |

AM-C02 chưa sửa baseline 66 operations/8 tools. Trước implementation, Lead/ContractsClient cần freeze delta `campaign mode`, StudentDemoEnrollment/profile/period association, canonical activity/attendance fixture, eligibility/result/ledger/counters/campus ranking, access/events/Reset/errors và migration cùng producers05/07, web09/native10/QA11. Không đoán operationId hoặc gửi field lạ vào strict DTO cũ.

Cutover cùng SHA/hash và scoped ownership; kiểm 41 US, T01..T24, IR-01..IR-12 và invariants. Baseline contracts/reports/receipts giữ nguyên bằng chứng cũ, không chứng minh mode mới đã chạy. Config/fixture/classification/contract còn thiếu có thể chặn implementation hoặc publish tương ứng; **MOU, trường phê duyệt, sponsor và công nhận ĐRL thật không là prerequisite của demo**. Real-school integration/recognition cần yêu cầu và scope/grants mới.
