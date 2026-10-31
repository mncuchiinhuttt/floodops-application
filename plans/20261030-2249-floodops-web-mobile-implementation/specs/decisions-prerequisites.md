# Quyết định, external prerequisites và chênh lệch PRD

## Những gì user vừa chốt
React web, React Router, Tailwind CSS v4, shadcn, isometric icons, Hono API, Expo/React Native mobile, Cloudflare Workers, feature-based architecture, full contracts/rules/tests, không chia thời gian. Không triển khai ứng dụng ở bước plan.

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
| A09 | English UI keys + Vietnamese reports + i18n strings | D06 còn đề xuất; mặc định EN không hardcode toàn app, VI localization namespace |
| A10 | Model runtime configured via env, Responses strict tools | Không đồng nhất Codex build với runtime; models change without package rewrite |

## External prerequisite register
| ID | Cần có | Owner role | Khi thiếu / không được bịa |
|---|---|---|---|
| E01 | Khu vực TP.HCM, geometry snapshot/licence, mapping real road aliases | Product/data owner | Functional fixture có label; D04 release gate blocked |
| E02 | Travel/service/traffic/vehicle/workload/capacity/SLA/H/TTL/source-quality/location tolerance independent samples và sai số chốt | Domain/data owner | `Calibration incomplete`; không số tự đặt để “đạt” K1/K2 |
| E03 | Quyền ảnh/fixtures/community và retained routing/traffic snapshot | Data/privacy owner | Dùng synthetic/có phép, không scrape camera hay restricted portal |
| E04 | Cloudflare account, Workers/DO/R2 permissions, domain, Images transform capability nếu chọn | Release owner | Local Worker smoke có thể làm; chưa deploy thì không ghi deploy success |
| E05 | OpenAI runtime key/model structured tools/spend cap | AI owner | Deterministic stub suite có nhãn; model eval và K4 chưa pass |
| E06 | Expo/EAS project, iOS signing/Apple team, Android keystore/store access | Mobile release owner | Dev build/emulator evidence, store release blocked, không giả EAS account |
| E07 | Isometric icon asset/package licence confirmed | Design owner | SVG export licensed + native adapter, no nonexistent import |
| E08 | Reviewer quyết scope high-risk authority/source profiles/retention | Product/security owner | Default deny/low-confidence, không grant quyền từ provider name |

## Scope parity và exclusions
- Website/mobile/API đều có kịch bản rain/tide/combined, report-review-reward-replan, plan approval/execute, clock/reset/results.
- Không live external provider connectors trong release này (catalog/fixture adapters vẫn đầy đủ), không payout tiền thật, push notification vận hành thật, community acquisition platform, background GPS, production auth/OMS.
- Native app không cần auth account SaaS để xem/gửi demo reports nhưng API capability thực vẫn enforce quyền và phiên.
- Không đưa lại tranh luận pre-build vào logic sản phẩm; tài liệu giữ source compliance ở PRD, plan không ràng buộc schedule 7h.

## Decision closure workflow
- Implementation bắt đầu bằng freeze A01–A10 với package versions capability proof, không hỏi lại stack user đã nêu.
- E01/E02/E03 là information/data prerequisites, không thể giải bằng architecture; assign owner và evidence paths.
- Không đổi PRD P1/P2 priority chỉ để cắt application. Plan phases có dependency order thay vì duration.
- Nếu source update scope, sửa coverage/contracts/specs cùng lần; log ADR ngắn, không duplicate PRD nguyên file.
