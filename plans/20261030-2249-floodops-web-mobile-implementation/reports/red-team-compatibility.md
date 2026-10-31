# Red-team review — Assumption Destroyer / Compatibility

## Kết luận

- Critical/high findings còn tồn tại trong phạm vi lens: **0**.
- Verdict cho lens: **correct**, confidence **0.90**. Đánh giá này chỉ áp dụng cho tính nhất quán của tài liệu đã đọc, không phải xác nhận application chạy, package đã cài, deployment thành công hoặc D04 đạt.
- Bản OpenAPI đã thay đổi trong lúc review. Hai blocker cụ thể ban đầu đã có contract khắc phục ở lần đọc cuối nên không được phát hành như findings còn mở.

## Phạm vi và evidence

Đối chiếu `FloodOps/prd.md` v0.3, đặc biệt §3.2, §4.3–4.4, US-01–US-34, §6.1, §7.1–7.5, §8.2–8.5 và §9.1, với `plan.md`, phase 01/02/04/05/06/09/10/11/12, architecture, feature recipes, requirements coverage, design system, web/mobile surfaces, security, concurrency, operational limits và deployment specifications. Đọc các schema/operation liên quan trong `contracts/openapi.json` và tool contracts; trace từ client screen tới API/credential/event/media consumer, không chỉ từ producer.

| Boundary đã kiểm | Evidence hiện hành / lý do không phát hành finding |
|---|---|
| Expo Router và parity dispatcher | `specs/web-mobile-feature-surfaces.md` §Route / screen matrix và `phase-10-expo-mobile-application.md` §Implementation steps yêu cầu native dispatcher đầy đủ, không chỉ reporting companion. `InviteInput`, `Invite`, `createInvitation` hiện cho owner có `manage_dispatchers` mời dispatcher cùng session; `claimSession` cố định role phía server. Vì vậy blocker không có đường pairing web↔native dispatcher đã được khắc phục trong contract hiện hành. |
| Shared client, credentials và SSE | Phase 01 inject fetch/credential provider; `CredentialDelivery` tách web HttpOnly cookie khỏi native bearer; security spec yêu cầu SecureStore và CSRF/Origin cho web. `concurrency-realtime.md` §Chosen stream dùng Event.type chuẩn, gồm `advance_changed`/`capability_revoked`, heartbeat comment, cursor catch-up, abort foreground/background và polling fallback. Không yêu cầu native EventSource hoặc token trong URL. |
| Offline và Reset | `web-mobile-feature-surfaces.md` §Mobile offline draft-only semantics chỉ lưu report draft/ảnh app-private; refresh session/generation/capability và explicit Send trước submit. Không queue Approve/Reject/Execute/Reset/Advance; draft phiên cũ không auto-relink. Reset credential replay có ngoại lệ cùng owner/key, không chuyển quyền bằng stream. |
| Native SVG và package assumptions | `design-system.md` §Mục tiêu và ranh giới/Storybook, phase 02 và research compatibility tách ui-web/ui-native, CSS/native token adapters và icons web/native entrypoints. Workspace `@floodops/icons` là artwork riêng có manifest; native dùng `react-native-svg`. Không còn giả định import public `@muxa/ui-isometric` hoặc shadcn/Radix chạy native. |
| Hono/static SPA/EAS boundary | `cloudflare-deployment.md` §3–4, §8 và phase 12 chọn một Vite client build, Wrangler/Hono Worker với `../web/dist`, SPA fallback và `run_worker_first: ["/api/*"]`; API JSON 404 tách HTML fallback. EAS sở hữu binary/signing; Worker chỉ host web/API/assets. |
| Fixture request/response và media dispatch | `ScenarioConfig` hiện có `incident_fixtures`, `source_fixtures`, `fixture_assets`, `source_policy_profiles`, `feature_flags`. Operation `getFixtureAsset` nhận asset ID trong frozen manifest và trả JPEG/PNG có auth. Vì vậy blocker không có catalogue cho fixture IDs / không có đường đọc ảnh private đã được khắc phục; không cần client đoán ID hoặc R2 key. |
| PRD parity | `specs/requirements-coverage.md` map đủ US-01–US-34 và POL/I/T; surface matrix yêu cầu cùng committed revision/outcome trên web/native, P1 defer/hub và P2 reroute-only vẫn trong scope. US-26 được giữ là repository evidence, không biến thành runtime screen giả. |

## Đối chiếu tài liệu nền tảng

- [Expo fetch API](https://docs.expo.dev/versions/latest/sdk/expo.md): có response streaming và `body.getReader()`; đây là documented API, không phải bằng chứng device runtime của FloodOps.
- [Expo react-native-svg](https://docs.expo.dev/versions/latest/sdk/svg.md): có native SVG drawing primitives; không chứng minh artwork cụ thể đã render trên iOS/Android.
- [Expo monorepos](https://docs.expo.dev/guides/monorepos/): workspace support có thật; exact Expo/React/RN/native dependency versions vẫn là implementation compatibility gate trong plan.
- [Cloudflare SPA routing](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/): hỗ trợ SPA assets và explicit `run_worker_first` patterns đã chọn.
- [Cloudflare Images binding](https://developers.cloudflare.com/images/transform-images/bindings/): nhận raw image streams; entitlement, transformation/metadata behavior và thực nghiệm vẫn là release gates, không được coi là đã kiểm chứng.

## Ranh giới kết quả review

Không chạy application, install package, build, lint, formatter, tests, device smoke hay deploy. Chỉ đọc tài liệu/contract và tài liệu chính thức. D04/licence, model credits, Images entitlement, signing và native/device acceptance vẫn cần evidence theo prerequisite register; việc chúng chưa được thực hiện không được báo lại thành missing mitigation của plan.
