# AM-C01 - Chiến dịch và nhiệm vụ người đóng góp

## 1. Trạng thái và phạm vi

- Ngày 31/10/2026, user chốt bổ sung chiến dịch, nhiệm vụ cấp S-A-B-C-D-E-F, bảng xếp hạng khu vực và quyền lợi/phần thưởng cho contributor trên web và native.
- Đây là amendment sản phẩm/tài liệu của PRD v0.3: giữ US-01..US-34, bổ sung US-35..US-38; T01..T15 giữ mã, thêm T16..T20. Tổng 38 US: 35 P0, 2 P1, 1 P2.
- Điểm từng cấp, ngưỡng phân loại tự động, số lượt xác minh, ngân sách, nhà tài trợ và giá trị quà còn TBD. Ví dụ điểm giảm dần trước đây không là luật đã chốt.
- Wire baseline hiện có 64 API operations và 8 LLM tools chưa mô tả các entity/operations mới. OpenAPI, client và receipts cũ vẫn là baseline đã freeze, không được coi là đã có campaign API. Cutover ở mục 10 là prerequisite trước implementation phần mới.
- Không thêm app thứ ba, live GPS, dẫn đường cho người đóng góp, thanh toán hoặc quyền production/account/provider từ amendment này.

## 2. Chiến dịch theo khu vực

Campaign có region xác định, mục tiêu dữ liệu từ gap/coverage hoặc nhu cầu xác minh, khoảng hoạt động và hạn review. Các mốc nghiệp vụ trong demo dùng simulation time; wall-clock review latency ghi riêng.

| Trạng thái | Hành vi |
|---|---|
| draft | Người có quyền chuẩn bị khu vực, nhiệm vụ, quy tắc điểm, quà và tiêu chí review. Contributor chưa nhận nhiệm vụ. |
| active | Công bố nội dung, nhiệm vụ còn mở, tiến độ, điều kiện thưởng và bảng hạng tạm thời. |
| paused | Ngừng nhận submission mới; giữ lịch sử và xử lý report đã nhận theo phiên bản chính sách đã ghi. |
| closing | Hết thời gian nhận; hoàn tất review các report đúng hạn và xử lý tranh chấp theo chính sách đã công bố. |
| closed | Chốt kết quả, bảng hạng và quyền lợi sau khi report đủ điều kiện còn pending đã được giải quyết. |

Server kiểm capability quản lý campaign; dispatcher chỉ tạo/sửa/publish/pause/close khi được cấp quyền tương ứng. Contributor chỉ đọc, chọn nhiệm vụ và gửi báo cáo của mình. UI role picker không cấp quyền quản lý.

Publish yêu cầu region, thời gian, data need, mission capacity, grade/reward policy version, điều kiện review/đồng hạng và budget/inventory hợp lệ. Campaign dùng demo fixtures vẫn ghi Simulation. Thiếu cấu hình thì giữ draft/disabled kèm lý do; không hiển thị điểm hoặc quà chưa được bảo đảm như đã có.

Mission chỉ mời quan sát từ vị trí đang an toàn. Gap/unknown không chứng minh có thể đi tới; không tạo tuyến đưa người dùng vào đường đóng/ngập, không thưởng theo độ sâu nước hoặc mức nguy hiểm. Được bỏ qua nhiệm vụ mà không bị phạt điểm hay mất chuỗi.

## 3. Nhiệm vụ và cấp S-F

Mission gắn campaign/region, segment, vehicle scope, data need/knowledge epoch, occurrence, work type, thời hạn, yêu cầu ảnh, số completion đủ điều kiện và phiên bản chính sách.

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
- Server gán cấp từ tác động tới đơn/tuyến, thời hạn quyết định, độ mới và nhu cầu dữ liệu theo config đã duyệt. Ngưỡng tự động còn TBD; có thể phân loại thủ công bởi người có quyền, bắt buộc reason, actor, timestamp và version.
- Với cùng work type và policy, điểm cấu hình giảm theo thứ tự S > A > B > C > D > E > F. Không có số mặc định 10 điểm hoặc lịch 50/30/0. Thiếu policy/budget thì nhiệm vụ chưa được publish để nhận thưởng.
- Khi server nhận report hoàn chỉnh, lưu snapshot mission/grade/reward policy version và thời gian nhận. Đổi cấp/thưởng về sau chỉ áp dụng submission mới; không tự hạ quyền lợi report đã nhận đúng điều kiện.
- Thẻ kiểu bảng treo thưởng hiển thị cấp bằng chữ và màu, lý do cần dữ liệu, yêu cầu ảnh/vị trí/vehicle/time, thời hạn, reward/eligibility, số lượt cần và trạng thái. Không dùng màu làm cách duy nhất phân biệt cấp.

## 4. Ba loại công việc

| Work type | Điều kiện tạo giá trị | Điều kiện thưởng |
|---|---|---|
| collect | Bổ sung observation đủ dùng lấp gap đang mở. | Giữ first-fill uniqueness cho gap occurrence; một ảnh dư thừa không tạo award mới. |
| verify | Có yêu cầu xác minh độc lập được mở rõ, còn slot và cần thêm evidence. | Report accepted, fresh, đúng scope/epoch, có ích theo tiêu chí review; không bắt buộc lấp gap mới. Chỉ là ảnh thứ hai hoặc đồng ý số đông chưa đủ. |
| update | Data need mới do expiry hoặc điều kiện/epoch thay đổi đã được kiểm tra. | Mission occurrence mới, evidence mới; không tự mở lại nhiệm vụ chỉ để farm điểm. |

Client không tự tuyên bố independence, grade, confidence hoặc points. Review kiểm ảnh, địa điểm, capture time, duplicate, scope và giá trị bổ sung. Khác participant ID hay EXIF không tự chứng minh khác người hoặc đúng hiện trường; demo không claim chống giả GPS/ảnh.

Ảnh mâu thuẫn có thể cần review; giữ chính sách conflict trước khi dùng knowledge hoặc thưởng. Không tự nâng confidence, giải quyết conflict hoặc gỡ authoritative closure bằng số người/điểm. Accepted report, reward eligible và route approved là ba kết quả riêng.

## 5. Completion, award và exactly-once

- Mỗi report liên kết tối đa một mission/campaign/region. Báo cáo tự do vẫn dùng luật first-fill cũ nếu chưa gắn mission, không mặc định sinh mission hoặc nhận thêm thưởng.
- Một report tối đa một award. Một participant có tối đa một completion được thưởng trong một mission occurrence; nhiệm vụ mới phải có data need mới. Verification slots có giới hạn theo policy.
- Award ghi report/completion/mission/campaign/region, work type, grade/reward version đã pin, points và reason. `filled_gap_ids` có thể rỗng với verify; không bịa gap fill để trả điểm.
- Tách uniqueness của first-fill collect theo gap khỏi uniqueness completion/verification. Rule cũ "mỗi gap chỉ một award" không được dùng để loại mọi verification hữu ích, cũng không bị bỏ để thưởng ảnh trùng.
- Completion đủ điều kiện, award, budget use, leaderboard contribution, audit/idempotency/outbox commit nguyên tử. Gap fill/knowledge cùng transition khi nghiệp vụ đó thay evidence. Race giữa reviewer/participant, retry hoặc phát cùng event cho baseline/FloodOps không tăng điểm hai lần.
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

Dispatcher có surface quản lý campaign/mission được cấp quyền và review linked reports. Không tự sửa plan/route từ thao tác campaign. Gửi report -> web review -> mobile thấy completion/points/rank/benefit cùng committed outcome là luồng nghiệm thu chính.

## 9. Nghiệm thu bổ sung

| Test | Expected |
|---|---|
| T16 | Lifecycle campaign, publish thiếu config, quyền quản lý, window nhận/review, pause/close: không nhận trái phép hoặc chốt khi pending chưa giải quyết. |
| T17 | Đủ S-A-B-C-D-E-F, reason/version, client sửa grade/points bị từ chối; submission cũ giữ policy đã pin, draft refresh trước gửi. |
| T18 | collect/verify/update hợp lệ; duplicate/retry/cross-participant/concurrent/reordered review không nhân award, slot, budget hoặc gap fill. Report đến sau chờ earlier pending, incomplete upload không giữ chỗ, overdue hiện reason/resolution theo policy; verify có thể thưởng mà không fake gap. |
| T19 | Bảng hạng đúng region/campaign/committed points, đồng hạng, alias projection; không đọc ảnh/report người khác hoặc ledger dispatcher. |
| T20 | Quà mô phỏng, điều kiện/tie/budget, exactly-once entitlement, review/expiry/Reset; cross-device và offline không tự phát điểm/quà hoặc tái dùng quyền cũ. |

## 10. Contract amendment và cutover

AM-C01 chốt hành vi sản phẩm, **chưa tạo operationId, request/response hoặc endpoint mới trong baseline 64 operations**. Không tự thêm field vào strict DTO hiện tại hoặc dựng client-only campaign/leaderboard để gọi complete.

1. Lead xác nhận delta data/access: Campaign, Mission/grade policy, Submission/Completion links, Award mở rộng, RegionalLeaderboard projection, Prize catalog/entitlement và error/event/Reset semantics.
2. Producer contracts cập nhật schema/OpenAPI, examples, typed client, capability/action matrix và tests trong một candidate được review; giữ 8 LLM tools proposal-only, không cấp tool phát thưởng.
3. Domain/storage/API producer thực hiện migration có version; code cũ không đọc/ghi sai award mới. Cập nhật unique constraints collect-gap và verify-completion riêng, backfill/rollback hoặc giới hạn new sessions phải nêu rõ.
4. Phase 05/07, cả phase 09/10 và phase 11 đồng bộ theo cùng frozen contract SHA/hash. Chỉ publish gate/receipt mới sau evidence; historical gate/document-baseline/role manifests không tự đổi từ việc sửa Markdown này.
5. Cutover kiểm 38 US, POL-01..08/I1..I5/K1..K6, T01..T20 và cross-device. Exact points, thresholds, slots, budget và prize conditions chưa chốt là configuration blockers, không giá trị được phép bịa.

Mọi worker đang chạy giữ baseline cũ tới khi nhận approved amendment/resync; không dùng file uncommitted hoặc branch khác làm authority. Phase/DAG/ownership không tự mở rộng; Lead giao phần mới trong receipt phù hợp sau contract cutover.

## 11. Căn cứ thiết kế

- [PicTree - hướng dẫn chính thức](https://how-to-play.pictree.playmining.com/en/): nhiệm vụ ảnh, review, xếp hạng và reward; [một chiến dịch theo vùng năm 2026](https://pictree.greenwaygrid.global/en/news/6826/). Không sao chép mức điểm/quà hoặc coi đó là bằng chứng FloodOps đã có tài trợ.
- [Pokemon GO - Showcases](https://pokemongo.com/news/pokestop-showcase-new-feature): ví dụ thi đua có hạn tại từng địa điểm và quyền lợi theo hạng; không là yêu cầu phải dùng cùng luật trò chơi.
- [CrowdWater, PLOS ONE 2019](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0222579): kiểm ảnh mức nước qua trò chơi/đánh giá; không chứng minh đồng thuận tự cấp quyền đi qua đường ngập hoặc điểm số làm dữ liệu đúng hơn.
