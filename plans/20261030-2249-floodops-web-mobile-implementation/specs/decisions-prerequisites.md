# Quyết định, external prerequisites và chênh lệch PRD

## Những gì user vừa chốt

Integration theo PRD v0.5: AM-AI02/D11 giữ US-39/T21 forecast; AM-M01/D12 đặt M1 web core 31 US, M2 10 extension US (gồm student US-40/41), M3 calibration/pilot. Student D13/T22..T24 không đòi forecast hoặc normal bounty gates. 66 operations/8 tools và linked phase/role metadata là legacy pending cutover; không cấp model planning/classification authority hoặc mark application complete.
React web, React Router, Tailwind CSS v4, shadcn, isometric icons, Hono API, Expo/React Native mobile, Cloudflare Workers, feature-based architecture, full contracts/rules/tests, không chia thời gian. Không triển khai ứng dụng ở bước plan.

- New advisory image-review scope is fixed by [ai-assisted-image-review.md](ai-assisted-image-review.md); planning text is not implementation, provider-call or deployment evidence.

Ngày 31/10/2026, user chốt [AM-C01](contributor-campaigns.md): contributor có campaign theo vùng/kỳ, collect/verify/update mission cấp S-F, regional leaderboard và benefit/prize design. Thêm US-35..US-38/T16..T20/D10, giữ mã cũ. Chưa chốt số điểm, ngưỡng cấp, capacity/budget hoặc quà thật; không mặc định lịch điểm theo thứ tự tới.

Workflow user làm rõ: dispatcher DataRequest -> code tất định grade S-F -> validated publication -> contributor ảnh/thông tin -> dispatcher ReviewResult -> ContributorRewardEngine xét điểm -> feedback. Module cùng backend; classification tất định khác optional US-30 vision advice, không manual/default grade hoặc direct upload award.

AM-C02 ngày 31/10/2026: user chọn student_volunteer_demo hoàn toàn mô phỏng, không chờ trường thật duyệt. [Đặc tả](student-volunteer-demo.md) dùng cấu hình demo mặc định student-recognition-demo-v1: HCMUT-Demo +2 cap4/6, HCMUS-Demo +3 cap6/9, UIT-Demo +5 cap10/15; các số do thiết kế demo lựa chọn, không số từ quy chế trường. Thêm US-40/US-41 P0, T22..T24, D13; tổng 41 US (M1: 31; M2: 10), T01..T24/IR-01..IR-12.

## Proposed technical decisions (không giả làm yêu cầu cũ)
| ID | Quyết định | Lý do / hệ quả |
|---|---|---|
| A01 | Bun workspace, TypeScript strict, web SPA data-router | Một API Hono và static origin, không SSR trùng server |
| A02 | DO SQLite per session, private R2 assets | Delta PRD “no DB”: multi-device consistency/durability, không thêm account DB |
| A03 | Single-team sessions + scoped opaque capabilities | Bảo vệ public demo và role thật trên server, không SaaS tenancy |
| A04 | Full mobile dispatcher/driver/contributor | User explicitly requested mobile, không reporting-only foundation |
| A05 | Web shadcn/Tailwind, native StyleSheet/shared tokens | DOM/Radix không chạy native; share semantic design not JSX |
| A06 | SSE fetch + polling catch-up | Unidirectional state stream, commands qua HTTP CAS; verify Expo transport |
| A07 | API /api/v1, OpenAPI 3.1.1, strict typed schema | Generate shared clients/types, future implementation diffs canonical artifact |
| A08 | All P1/P2 specified, flags only enable after acceptance/config | Không giảm scope “full application”; missing defer calibration stays disabled until filled |
| A09 | English UI keys + Vietnamese reports + i18n strings | D06 remains proposed; default EN with VI localization namespace |
| A10 | Runtime AI chỉ optional US-30 photo advice và gated US-39 historical forecast; planner/S-F là code | Model/provider secrets server-side, compatible image/structured output và scoped grant/budget; không model-callable planning hoặc classification |

## External prerequisite register
| ID | Cần có | Owner role | Khi thiếu / không được bịa |
|---|---|---|---|
| E01 | Khu vực TP.HCM, geometry snapshot/licence, mapping real road aliases | Product/data owner | Functional fixture có label; D04 release gate blocked |
| E02 | Travel/service/traffic/vehicle/workload/capacity/SLA/H/TTL/source-quality/location tolerance independent samples và sai số chốt | Domain/data owner | `Calibration incomplete`; không số tự đặt để “đạt” K1/K2 |
| E03 | Rights for photos/fixtures/community and retained routing/traffic snapshots, including permission/consent for external image-model processing | Data/privacy owner | Use synthetic/explicitly permitted images; document actual provider-account data handling and retention, no zero-retention assumption |
| E04 | Cloudflare account, Workers/DO/R2 permissions, domain, Images transform capability if selected | Release owner | Local Worker smoke may run; no deployment success claim until actual evidence |
| E05 | OpenAI runtime key/model compatibility/structured output/spend cap; for image review, image-input + strict-output support, `OPENAI_IMAGE_REVIEW_MODEL`, account hard cap and operator kill switch | AI owner | Same `OPENAI_API_KEY`; if missing/unsupported/disabled, return unavailable; deterministic stubs do not pass model evaluation |
| E06 | Expo/EAS project, iOS signing/Apple team, Android keystore/store access | Mobile release owner | Dev build/emulator evidence, store release blocked, không giả EAS account |
| E07 | Isometric icon asset/package licence confirmed | Design owner | SVG export licensed + native adapter, no nonexistent import |
| E08 | Reviewer resolves high-risk authority/source profiles and provider image-data retention/consent policy | Product/security owner | Default deny/low-confidence; verify actual account terms before live evaluation, never claim zero retention without evidence |
| E09 | M2 deterministic S-F rules/thresholds/input-policy hashes, bound DataRequest/current MissionClassification và typed ReviewResult; mode-specific config/review windows | Product/rules/review owners theo Lead assignment | Missing valid rules/classification/config thì draft/recompute, không model gate/default/client grade; reward chờ current authenticated human result |
| E10 | Region/ranking period, tie policy, inventory/budget, sponsor/giá trị/quy trình nhận quà thật | Product/benefit owner, cần user giao | Demo catalog/entitlement Simulated; không hứa voucher hoặc cấp payout/provider quyền mới |
| E11 | AM-C01 delta/refreeze, migration/Reset/events/access/client, producer và cả hai consumers/tests cùng SHA/hash | Lead + ContractsClient phối hợp owners | Baseline 66 operations/8 tools gồm AI review chưa hỗ trợ campaign; giữ IR-01..IR-12 và chờ cutover |
| E12 | AM-C02 mode/enrollment/profile/period/activity/attendance/recognition contracts và synthetic fixtures, counter aggregate/unique/report binding/campus projection | Lead + ContractsClient, SimulationData03, SourcesMedia05, ReviewRewards07, Web09/Native10/QA11 theo ownership | Freeze/cutover cùng candidate trước implementation; thiếu config/fixture thì pending/disabled đúng reason, không trường thật duyệt/SSO hoặc sponsor làm blocker cho demo |

## Scope parity và exclusions
- Website/mobile/API đều có kịch bản rain/tide/combined, report-review-reward-replan, plan approval/execute, clock/reset/results; AM-C01 thêm campaign/mission S-F/ranking/benefit parity sau contract cutover.
- Không live external provider connectors trong release này (catalog/fixture adapters vẫn đầy đủ), không payout tiền thật, push notification vận hành thật, community acquisition platform, background GPS, production auth/OMS.
- Native app không cần auth account SaaS để xem/gửi demo reports nhưng API capability thực vẫn enforce quyền và phiên.
- Student demo là mode contributor: cùng request/policy S-F/ReviewResult rồi DemoRecognitionEngine xét activity >=120 synthetic minutes + quality report, flat +2/+3/+5 và caps. Nhãn không có giá trị công nhận trường luôn hiện; không real PII/SSO/MOU/institution API, voucher/payout, normal award kép hoặc S-F/game-point conversion. Mode thường không đổi.
- E09 deterministic rules và current MissionClassification áp dụng student board; không model gate. General bounty/verification-award-slot/voucher budget không chặn recognition. Phase03 server fixture enrollment/profile/kỳ/canonical nonoverlap attendance; fixture120 phút không đổi clock/physics/D04, không chờ thật.
- Không đưa lại tranh luận pre-build vào logic sản phẩm; tài liệu giữ source compliance ở PRD, plan không ràng buộc schedule 7h.

## Decision closure workflow
- Implementation bắt đầu bằng freeze A01–A10 với package versions capability proof, không hỏi lại stack user đã nêu.
- E01/E02/E03 là information/data prerequisites, không thể giải bằng architecture; assign owner và evidence paths.
- Không đổi PRD P1/P2 priority chỉ để cắt application. Plan phases có dependency order thay vì duration.
- Nếu source update scope, sửa coverage/contracts/specs cùng lần; log ADR ngắn, không duplicate PRD nguyên file.
- AM-C01 hiện là approved product/doc amendment. Cutover mới phải review wire/examples/client/capability/storage/producers/web/native/tests cùng candidate; không sửa historical gate/baseline/role receipt để giả đã pass. Worker đang chạy nhận amendment/resync từ Lead trước đổi contract.
- D13/AM-C02 ghi nhận mode demo được user yêu cầu và các profile/default scores được thiết kế cụ thể để review; real-school recognition nằm ngoài scope, không external gate của demo. Trước implementation freeze mode-specific schemas/fixtures/producers/clients/tests và Reset cùng SHA/hash, giữ 66 API/8 tools/US-30/IR baseline; tài liệu không cấp account/model/remote grant.
