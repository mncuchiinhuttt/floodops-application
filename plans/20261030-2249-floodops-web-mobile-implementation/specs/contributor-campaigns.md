# AM-C01 - Chiến dịch và nhiệm vụ người đóng góp

## 1. Trạng thái và phạm vi

- Ngày 31/10/2026, user chốt bổ sung chiến dịch, nhiệm vụ cấp S-A-B-C-D-E-F, bảng xếp hạng khu vực và quyền lợi/phần thưởng cho contributor trên web và native.
- Luồng được user làm rõ: **dispatcher phát hiện thiếu dữ liệu -> gửi DataRequest -> code tất định đánh giá và phân cấp S-F -> đăng bảng nhiệm vụ -> contributor gửi ảnh/thông tin -> dispatcher review và trả ReviewResult -> ContributorRewardEngine xét điểm từ kết quả đó -> phản hồi**.
- AM-C01 giữ US-35..US-38/T16..T20 ở M2. PRD v0.5/AM-AI02 giữ US-39/T21/D11 forecast, AM-M01/D12 giữ M1 web core 31 US. [AM-C02](student-volunteer-demo.md) thêm US-40/US-41/T22..T24/D13 ở M2; roadmap 41 US (M1 31; M2 10). Native/campaign parity là M2; calibration/pilot claims M3.
- Điểm từng cấp, ngưỡng phân loại tự động, số lượt xác minh, ngân sách, nhà tài trợ và giá trị quà còn TBD. Ví dụ điểm giảm dần trước đây không là luật đã chốt.
- Wire baseline hiện có 66 API operations và 8 LLM tools chưa mô tả các entity/operations mới. OpenAPI, client và receipts cũ vẫn là baseline đã freeze, không được coi là đã có campaign API. Cutover ở mục 10 là prerequisite trước implementation phần mới.
- Baseline này đã gồm US-30 AI hỗ trợ review ảnh và IR-01..IR-12. Giữ nguyên jobs/DTO/events dispatcher-only và manual fallback; quality score 0-100 không là campaign points, mission grade, confidence hoặc authority. AI job/result metadata tách khỏi human completion/award atomic commit.
- Không thêm app thứ ba, live GPS, dẫn đường cho người đóng góp, thanh toán hoặc quyền production/account/provider từ amendment này.

### Ranh giới ba vai trò xử lý

Trong cùng backend authoritative, `DispatcherReviewService` tạo ReviewResult từ quyết định người điều phối và checks của code; `code tất định` phân loại nhiệm vụ trước khi công bố; `ContributorRewardEngine` tính eligibility/points sau ReviewResult. Đây là module nghiệp vụ, không ba server hoặc multi-agent chat.

AM-C01 dưới đây quy định bounty/ranking/prize cho mode thông thường. `student_volunteer_demo` giữ cùng request/classification/review, nhưng ContributorRewardEngine rẽ sang DemoRecognitionEngine/ledger ĐRL mô phỏng theo AM-C02, không bounty award hoặc quà tiền tệ kép. Không chuyển điểm game hoặc S-F thành ĐRL; campus ranking tách regional ranking.

Ba đại lượng riêng: **cấp khẩn S-F của mission do policy classification đề xuất**, **quality score 0-100 của optional US-30 vision advice**, **điểm thưởng do reward engine tính từ ReviewResult và bounty policy**. Không chuyển một đại lượng thành đại lượng kia hoặc thành confidence/quyền đi đường.

## 2. Chiến dịch theo khu vực

Campaign có region xác định, khoảng hoạt động và hạn review. Dispatcher xác định nhu cầu từ gap/coverage hoặc yêu cầu xác minh rồi gửi DataRequest có version vào hệ thống contributor; không tự chọn cấp S-F hoặc mint award. Các mốc nghiệp vụ trong demo dùng simulation time; wall-clock classification/review latency ghi riêng.

| Trạng thái | Hành vi |
|---|---|
| draft | Người có quyền chuẩn bị khu vực, DataRequest, policy/budget/quà và tiêu chí review; classification chưa hợp lệ thì mission chưa được công bố. |
| active | Công bố nội dung, nhiệm vụ còn mở, tiến độ, điều kiện thưởng và bảng hạng tạm thời. |
| paused | Ngừng nhận submission mới; giữ lịch sử và xử lý report đã nhận theo phiên bản chính sách đã ghi. |
| closing | Hết thời gian nhận; hoàn tất review các report đúng hạn và xử lý tranh chấp theo chính sách đã công bố. |
| closed | Chốt kết quả, bảng hạng và quyền lợi sau khi report đủ điều kiện còn pending đã được giải quyết. |

Server kiểm capability quản lý campaign và DataRequest; dispatcher chỉ create/publish/pause/close đúng quyền. Publish cần MissionClassification hợp lệ/current của đúng request/policy version do code tính; không model hoặc nhập tay grade để bypass rules. Contributor chỉ đọc/chọn/gửi report của mình; role picker không cấp quản lý.

Publish yêu cầu region, thời gian, DataRequest hiện hành, MissionClassification hợp lệ, mission capacity và review policy; sau đó kiểm cấu hình theo mode. Mode thường cần grade/bounty policy, budget/inventory và điều kiện quà/đồng hạng tương ứng. Student mode cần campus profile/kỳ/enrollment/activity fixtures và student-recognition-demo-v1, không cần bảng bounty thường, sponsor/voucher budget hoặc trường thật phê duyệt. Campaign dùng demo fixtures vẫn ghi Simulation. Thiếu config/assessment của mode đang dùng thì draft/pending/disabled kèm lý do; không hiển thị cấp, điểm hoặc quà bịa.

Mission chỉ mời quan sát từ vị trí đang an toàn. Gap/unknown không chứng minh có thể đi tới; không tạo tuyến đưa người dùng vào đường đóng/ngập, không thưởng theo độ sâu nước hoặc mức nguy hiểm. Được bỏ qua nhiệm vụ mà không bị phạt điểm hay mất chuỗi.

## 3. Nhiệm vụ và cấp S-F

Mission gắn DataRequest ID/version và MissionClassification ID, campaign/region, segment, vehicle scope, data need/knowledge epoch, occurrence, work type, thời hạn, yêu cầu ảnh, số completion đủ điều kiện và phiên bản chính sách.

DataRequest do dispatcher có quyền gửi: identity/version, session/generation, region, segment/vehicle/epoch, lý do thiếu dữ liệu, deadline, yêu cầu ảnh và operational context đã được server kiểm. Classification job dùng đúng bound request, policy và trusted context; không coi raw text/ảnh là chỉ dẫn thay policy.

| Cấp | Mức ưu tiên dữ liệu | Thưởng trong cùng loại nhiệm vụ |
|---|---|---|
| S | Thiếu dữ liệu đang cản quyết định cho đơn critical và cần xử lý ngay. | Cao nhất |
| A | Cần cập nhật sớm để xử lý nhiều đơn hoặc tuyến quan trọng. | Rất cao |
| B | Ảnh hưởng đáng kể nhưng còn phương án điều phối thay thế. | Cao |
| C | Nhu cầu thông tin vận hành thông thường, mức khẩn trung bình. | Trung bình |
| D | Bổ sung coverage có ưu tiên thấp, ít ảnh hưởng kế hoạch hiện tại. | Cơ bản |
| E | Cập nhật định kỳ, ít khẩn cấp. | Thấp |
| F | Bổ sung thông tin hữu ích có nhu cầu xác định nhưng không gấp. | Nhỏ |

- Cấp đo urgency/impact của **dữ liệu**, không đo nguy hiểm và không là mức uy tín của người dùng. Nhiệm vụ xác minh cũng có thể cấp S.
- Code đánh giá urgency/impact/deadline/freshness từ bound DataRequest/trusted context và policy đã version hóa; trả MissionClassification gồm S-F, rationale/rule IDs, request/version/generation và input/policy hashes. Service kiểm schema/references/current binding trước publish theo config mode mục 2.
- Không gọi model để phân cấp hoặc làm publishing gate. Missing rules/threshold/config, invalid/stale request-policy binding hoặc Reset thì draft/needs clarification/recompute; không grade mặc định/client/manual bypass. Dispatcher sửa request/lý do rồi code tính lại. Optional photo advice lỗi không chặn manual review; gated US-39 forecast chỉ gợi ý nhu cầu, không tự publish.
- Với mode thường, cùng work type và policy có điểm cấu hình giảm theo S > A > B > C > D > E > F. Không có số mặc định 10 điểm hoặc lịch 50/30/0. Thiếu bounty policy/budget thì mode thường chưa publish nhận thưởng; student mode dùng flat grant/caps mặc định v1 ở AM-C02, không S-F multiplier hoặc general bounty blocker.
- Khi server nhận report hoàn chỉnh, lưu snapshot mission/grade/reward policy version và thời gian nhận. Đổi cấp/thưởng về sau chỉ áp dụng submission mới; không tự hạ quyền lợi report đã nhận đúng điều kiện.
- Thẻ kiểu bảng treo thưởng hiển thị cấp bằng chữ và màu, lý do cần dữ liệu, yêu cầu ảnh/vị trí/vehicle/time, thời hạn, reward/eligibility, số lượt cần và trạng thái. Không dùng màu làm cách duy nhất phân biệt cấp.

## 4. Ba loại công việc

| Work type | Điều kiện tạo giá trị | Điều kiện thưởng |
|---|---|---|
| collect | Bổ sung observation đủ dùng lấp gap đang mở. | Giữ first-fill uniqueness cho gap occurrence; một ảnh dư thừa không tạo award mới. |
| verify | Có yêu cầu xác minh độc lập được mở rõ, còn slot và cần thêm evidence. | Report accepted, fresh, đúng scope/epoch, có ích theo tiêu chí review; không bắt buộc lấp gap mới. Chỉ là ảnh thứ hai hoặc đồng ý số đông chưa đủ. |
| update | Data need mới do expiry hoặc điều kiện/epoch thay đổi đã được kiểm tra. | Mission occurrence mới, evidence mới; không tự mở lại nhiệm vụ chỉ để farm điểm. |

Gap/expiry/data change chỉ tạo gợi ý hoặc draft DataRequest; dispatcher phải gửi request thực sự và policy classification current/hợp lệ mới được publish occurrence collect/verify/update. Contributor chỉ nhận mission summary/reason công khai đúng quyền, không private order/driver context dùng làm input phân cấp.

Client không tự tuyên bố independence, grade, confidence hoặc points. Submission bind request/mission/session generation và pinned bounty policy. Dispatcher review ảnh/thông tin; DispatcherReviewService kết hợp quyết định manual Accept/Reject với deterministic checks về ảnh, địa điểm, capture time, duplicate, scope và giá trị bổ sung để tạo ReviewResult. Khác participant ID hay EXIF không tự chứng minh khác người hoặc đúng hiện trường; demo không claim chống giả GPS/ảnh.

ReviewResult là typed handoff do server tạo, bind report/request/mission/session generation, review ID/version, decision/reasons và validated facts. ContributorRewardEngine chỉ xét completion/eligibility/work type/pinned bounty policy/slot/budget sau khi nhận đúng ReviewResult hiện hành. Raw upload, client body, grade policy hoặc quality score vision không đủ để tạo award.

"Hiện hành" là latest authenticated review decision **của report đó**, khớp request/mission/policy versions report đã pin khi nhận. Request hoặc mission version mới ngăn assessment cũ publish mission mới, nhưng không tự hủy eligibility của report đã nhận đúng policy cũ. Report tự do giữ đường riêng; request/mission link có thể không có theo DTO đã refreeze, không ép mọi report thành mission.

Ảnh mâu thuẫn có thể cần review; giữ chính sách conflict trước khi dùng knowledge hoặc thưởng. Không tự nâng confidence, giải quyết conflict hoặc gỡ authoritative closure bằng số người/điểm. Accepted report, reward eligible và route approved là ba kết quả riêng.

## 5. Completion, award và exactly-once

- Mỗi report liên kết tối đa một mission/campaign/region. Báo cáo tự do vẫn dùng luật first-fill cũ nếu chưa gắn mission, không mặc định sinh mission hoặc nhận thêm thưởng.
- Một report tối đa một award. Một participant có tối đa một completion được thưởng trong một mission occurrence; nhiệm vụ mới phải có data need mới. Verification slots có giới hạn theo policy.
- Award ghi report/completion/mission/campaign/region, work type, grade/reward version đã pin, points và reason. `filled_gap_ids` có thể rỗng với verify; không bịa gap fill để trả điểm.
- Tách uniqueness của first-fill collect theo gap khỏi uniqueness completion/verification. Rule cũ "mỗi gap chỉ một award" không được dùng để loại mọi verification hữu ích, cũng không bị bỏ để thưởng ảnh trùng.
- Trình tự logic: manual review/checks -> tạo ReviewResult -> handoff trong cùng backend -> ContributorRewardEngine evaluate -> commit review/knowledge, completion/reward outcome, award nếu đủ điều kiện, budget/rank và audit/idempotency/outbox nguyên tử. Không cần server/queue thứ hai. Technical failure không commit nửa chừng; pending/ineligible/no-slot là business result có reason, không fake 0 điểm khi API lỗi.
- Report chưa có ReviewResult hiện hành thì không evaluate/grant reward. Result forged/sai binding/superseded hoặc replay không nhân effect; reward pending do earlier slot phải được xét lại từ đúng result/policy khi dependency đã giải quyết. AI US-30 job/result vẫn metadata-only riêng, không join provider call vào reward transaction.
- Slot thưởng hữu hạn được xét theo receipt sequence ổn định của **report hoàn chỉnh cuối cùng được review là đủ điều kiện**, không theo lúc reviewer bấm duyệt. Upload chưa hoàn tất không giữ slot. Report đến sau không chốt slot cuối/budget khi còn report cạnh tranh đứng trước chưa được quyết định; UI chỉ hiện phần thưởng dự kiến. Đây là phân bổ capacity, không bonus điểm theo tốc độ hoặc bằng chứng ai có mặt đầu tiên.
- Publish phải có review deadline và chính sách xử lý timeout/escalation. Quá deadline, campaign hiện `review_overdue/needs_resolution`, báo người có quyền xử lý các report còn pending theo tiêu chí đã công bố; không tự chấp nhận, trả 0 điểm vì reviewer chậm hoặc trao slot cho người được duyệt sau. Chưa có chính sách giải quyết/closing hợp lệ thì không publish; chưa giải quyết pending thì không final rank/quà.
- Ảnh trùng normalized hash qua participant khác trong phiên, report không đạt hoặc redundant ngoài một verify task đủ điều kiện: 0 điểm, reason rõ. Chờ review chỉ hiện điểm dự kiến, không vào tổng đã ghi nhận.
- Không mặc định thưởng theo ai tới đầu hoặc ai được review trước. Nếu bổ sung chronological bonus về sau phải có amendment riêng về thứ tự server nhận, pending review và cách chốt slot.
- Expiry về sau không thu hồi award hợp lệ. Reset tạo generation/session mới và xóa runtime campaign, completions, points, ranking, simulated prize ledger; cấu hình campaign fixture được khôi phục, không mang thành tích cũ sang phiên mới.

## 6. Bảng xếp hạng khu vực

- Scope bảng hạng là campaign + region + kỳ hoạt động trong cùng phiên; điểm lấy từ committed awards. Một đóng góp không cộng vào nhiều vùng hoặc nhiều campaign.
- Contributor đọc projection riêng: alias, points, rank và own position; không ảnh, report riêng, tọa độ cá nhân, capability hoặc hành trình người khác. Quyền đọc leaderboard không mở `/awards` dispatcher-only.
- Rank = 1 + số participant có điểm lớn hơn. Bằng điểm đồng hạng; thứ tự hiển thị ổn định bằng ID nội bộ, không lấy tốc độ gửi/duyệt làm người thắng. Chính sách quà khi đồng hạng và inventory phải được công bố trước publish.
- Tổng gap có coverage còn hạn, completion count và points là các đại lượng riêng. Xác minh không tự làm coverage tăng thêm; expiry có thể giảm coverage dù điểm đã ghi nhận được giữ.
- Trong active/closing, bảng hạng là tạm thời. Closed chỉ chốt sau review window và pending/dispute được giải quyết; giữ audit khi có điều chỉnh, không sửa im lặng.

## 7. Phần thưởng và quyền lợi

Thiết kế có catalog quyền lợi theo hạng/mốc: huy hiệu, voucher hoặc phần quà, điều kiện đủ chuẩn, số lượng và award status. **Điểm thi đua không tự đổi thành tiền hoặc xác nhận voucher thật đã sẵn có.**

- Demo hiển thị catalog và entitlement ledger có nhãn Simulated; trạng thái có thể là chưa đủ điều kiện, dự kiến hoặc đã ghi nhận trong mô phỏng.
- Nhà tài trợ, giá trị, inventory, ngân sách, điều kiện đồng hạng/khiếu nại, dữ liệu nhận quà và fulfillment thật còn TBD; chưa có thì không cam kết quà thật.
- Receipt nhận quyền lợi phải unique theo campaign/region/participant/benefit policy. Retry không nhân voucher/quà; trường hợp đồng hạng không vượt ngân sách đã công bố.
- Không có lệnh chi tiền, redemption/provider integration, account creation hay giao quà thật trong scope demo/amendment tài liệu này. Phát quà thật cần scope và authorization riêng.

## 8. Web và native surfaces

Contributor có campaign list/detail, mission list/detail S-F, form gắn task, own reports/points, regional leaderboard và prize/eligibility detail. Native cùng một app Expo, tối ưu thao tác chạm; web cung cấp nghiệp vụ tương đương.

Chọn khu vực thủ công; không tự thêm background GPS. Bản đồ/danh sách dùng mission scope đã công bố, không lộ lịch trình người khác. Offline chỉ lưu draft/ảnh chưa gửi và policy version đã xem; khi online refresh session/capability/mission, hiện khác biệt và người dùng chủ động gửi. Server mới pin policy tại receipt; draft không giữ slot hoặc bảo đảm thưởng. Reset làm draft cũ stale, không tự chuyển mission/campaign ID sang phiên mới.

Dispatcher có surface nhận biết data thiếu và gửi DataRequest, theo dõi classification, quản lý campaign đúng quyền và review linked reports; không tự chọn final S-F/points hoặc sửa plan/route. Contributor thấy board sau classification, gửi report, nhận decision/remarks và reward status/reason/committed points sau ReviewResult evaluation. Full loop web/native phải cùng outcome; pending points không hiện như đã nhận.

## 9. Nghiệm thu bổ sung

| Test | Expected |
|---|---|
| T16 | Dispatcher xác định thiếu dữ liệu và gửi DataRequest đúng scope/version; campaign lifecycle/publish thiếu config hoặc classification/quyền/window/pause/close không nhận trái phép hoặc chốt sớm. |
| T17 | Code classify đủ bảy grade/rationale/rule IDs/input-policy binding; missing config/changed request-policy/invalid/stale/Reset không default/manual grade hoặc publish. Photo/forecast outage không ảnh hưởng classifier; submission giữ policy đã pin, draft refresh. |
| T18 | Không evaluate/award trước ReviewResult hiện hành; forged/stale/replayed result, collect/verify/update, duplicate/race/reordered review không nhân completion/award/slot/budget/rank. Earlier pending và technical failure không partial commit hoặc fake zero; verify không fake gap. |
| T19 | Bảng hạng đúng region/campaign/committed points, đồng hạng, alias projection; không đọc ảnh/report người khác hoặc ledger dispatcher. |
| T20 | Full DataRequest -> policy classification -> board -> photo/info -> dispatcher ReviewResult -> RewardEngine -> contributor feedback trên web/native; quà Simulated, tie/budget/exactly-once, expiry/Reset/offline đúng, không tự phát điểm/quà hoặc tái dùng quyền cũ. |

## 10. Contract amendment và cutover

AM-C01 chốt hành vi sản phẩm, **chưa tạo operationId, request/response hoặc endpoint mới trong baseline 66 operations**. Không tự thêm field vào strict DTO hiện tại hoặc dựng client-only campaign/leaderboard để gọi complete.

1. Lead xác nhận delta data/access: DataRequest, MissionClassification, ReviewResult, Campaign, Mission/grade policy, Submission/Completion links, Award mở rộng, RegionalLeaderboard projection, Prize catalog/entitlement và error/event/Reset semantics. Giữ US-30 vision advisory/jobs/IR-01..IR-12 tách riêng.
2. Producer contracts cập nhật schema/OpenAPI, examples, typed client, capability/action matrix và tests trong một candidate được review; giữ 8 LLM tools proposal-only, không cấp tool phát thưởng.
3. Domain/storage/API producer thực hiện migration có version; code cũ không đọc/ghi sai award mới. Cập nhật unique constraints collect-gap và verify-completion riêng, backfill/rollback hoặc giới hạn new sessions phải nêu rõ.
4. Phase 05/07, cả phase 09/10 và phase 11 đồng bộ theo cùng frozen contract SHA/hash. Chỉ publish gate/receipt mới sau evidence; historical gate/document-baseline/role manifests không tự đổi từ việc sửa Markdown này.
5. Cutover hiện hành kiểm 41 US, POL-01..08/I1..I5/K1..K6, T01..T24/IR-01..IR-12 và cross-device. Exact bounty points, thresholds, slots, budget và prize conditions chưa chốt là mode-specific configuration blockers, không giá trị được phép bịa; fixed student recognition policy không đợi general bounty hoặc công nhận trường thật.

Mọi worker đang chạy giữ baseline cũ tới khi nhận approved amendment/resync; không dùng file uncommitted hoặc branch khác làm authority. Phase/DAG/ownership không tự mở rộng; Lead giao phần mới trong receipt phù hợp sau contract cutover.

## 11. Căn cứ thiết kế

- [PicTree - hướng dẫn chính thức](https://how-to-play.pictree.playmining.com/en/): nhiệm vụ ảnh, review, xếp hạng và reward; [một chiến dịch theo vùng năm 2026](https://pictree.greenwaygrid.global/en/news/6826/). Không sao chép mức điểm/quà hoặc coi đó là bằng chứng FloodOps đã có tài trợ.
- [Pokemon GO - Showcases](https://pokemongo.com/news/pokestop-showcase-new-feature): ví dụ thi đua có hạn tại từng địa điểm và quyền lợi theo hạng; không là yêu cầu phải dùng cùng luật trò chơi.
- [CrowdWater, PLOS ONE 2019](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0222579): kiểm ảnh mức nước qua trò chơi/đánh giá; không chứng minh đồng thuận tự cấp quyền đi qua đường ngập hoặc điểm số làm dữ liệu đúng hơn.
