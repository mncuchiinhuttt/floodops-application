# Nghiên cứu tương thích Web / Expo / design system

> Phạm vi: quyết định giao diện và runtime cho web + native của FloodOps; không thay hợp đồng API / deploy của plan chính. Trạng thái: tài liệu đề xuất dựa trên PRD v0.3, không phải bằng chứng triển khai.

## Kết luận kỹ thuật

| Chủ đề | Kết luận cho plan | Căn cứ / ranh giới |
|---|---|---|
| Web routing | Chọn React Router **Data Mode** (`createBrowserRouter` + `RouterProvider`) cho SPA. Route `loader`/`action` chạy ở client và chỉ gọi `/api/v1/*`; Hono xử lý API, không render route React. | React Router tách Data Mode khỏi Framework Mode. Hướng dẫn SPA chính thức mô tả `ssr: false` cho Framework Mode; không dùng hướng dẫn đó để tuyên bố Data Mode có server loaders. [React Router Data Mode](https://reactrouter.com/start/data/installation), [createBrowserRouter](https://reactrouter.com/api/data-routers/createBrowserRouter), [SPA mode](https://reactrouter.com/how-to/spa). |
| Hono + static SPA | Worker route `/api/*` vào Hono; Workers Static Assets phục vụ file hiện có và `index.html` cho browser navigation deep-link miss. API phải được ưu tiên chạy Worker; tài sản hash-named không rơi vào API fallback. Hono không chạy React Router loaders. | [Cloudflare SPA fallback](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/), [Hono on Cloudflare Workers](https://hono.dev/docs/getting-started/cloudflare-workers). Chốt `assets.run_worker_first` / routing ở deployment spec; không tạo hai SPA fallback độc lập. |
| Native navigation | Chọn Expo Router file-based navigation, root `Stack`, nhóm tab native, stack chi tiết bên trong tab. Màn hình dispatcher là first-class, không giới hạn app ở form báo cáo. | [Expo Router introduction](https://docs.expo.dev/router/introduction/) xác nhận file-based routing cho React Native/Expo; layout định nghĩa navigation. Không dùng web `BrowserRouter` trong app native. |
| Live session updates | Web client uses the shared stream contract; native uses `expo/fetch` response streaming with `Accept: text/event-stream` and `body.getReader()` where supported, with polling fallback on unsupported/interrupted streams. Reconnect always refreshes authorized session state; offline commands remain forbidden. | Expo SDK docs document streaming `fetch` response bodies and the SVG module; this is API documentation, not evidence that this app has been device-tested. [Expo fetch](https://docs.expo.dev/versions/latest/sdk/expo/), [Expo SVG](https://docs.expo.dev/versions/latest/sdk/svg/). |
| Styling / UI | Web: Tailwind CSS v4 + shadcn/ui; native: React Native `StyleSheet` + platform primitives trong `packages/ui-native`. Không import DOM, Radix, shadcn hay class Tailwind vào native. | Tailwind v4 dùng CSS-first `@theme`; [shadcn Tailwind v4](https://ui.shadcn.com/docs/tailwind-v4) là tích hợp phía web. React Native có style props / `StyleSheet` riêng: [React Native Style](https://reactnative.dev/docs/style). Không có bằng chứng các component web shadcn/Radix chạy native. |
| Token chia sẻ | Một nguồn token dữ liệu trung lập (JSON/TS primitive + semantic values); xuất adapter CSS cho Tailwind và adapter JS cho RN. Chia sẻ giá trị / tên semantic, không chia sẻ component hay cơ chế render. | `@theme` tạo token/utilities CSS trong Tailwind; `StyleSheet` cần object style native. Cùng một file CSS không phải hợp đồng runtime chung cho native. |
| Isometric icons / vector rendering | No public third-party isometric pack is selected. Use the workspace `packages/icons` with separate web/native exports and original vetted SVG artwork; web uses SVG DOM rendering and native uses `react-native-svg` primitives, not browser DOM components. | Exact `@muxa/ui-isometric` lookup returned E404 (may be private/unpublished/no access); no license/repo/native API can be claimed. Expo documents `react-native-svg` support in its SDK / Expo Go; this verifies native renderer compatibility as documented, not an app test. Artwork license is recorded per asset in the workspace manifest. |

## Luồng routing và ranh giới runtime

```text
Browser URL → Workers Static Assets (file hit, hoặc SPA index.html fallback)
             → React Router Data Mode (client loader/action)
             → fetch /api/v1/... → Hono Worker route → domain/session API
Expo Router screen → shared API client `fetch /api/v1/...` → Hono Worker route → domain/session API
Native session updates → `expo/fetch` stream parser (`text/event-stream`) → shared typed client events; polling fallback → same state reducer.
```

- Web không có server-side React Router loader/action trong cấu hình Data Mode này. Loader/action gọi API qua `packages/api-client`; lỗi HTTP, capability và revision vẫn do API quyết định.
- `/api/*` không được trả `index.html`; API route phải chạy Worker. Client routes dưới `/sessions/:sessionId/*` phải deep-link / reload được về SPA shell.
- `GET` đọc có thể stale khi offline và phải gắn nhãn; không cho phép cache/proposal trở thành quyền thực thi. `POST` operational command không được gửi khi offline.
- Native `Stack`/tab state chỉ là navigation state, không là authorization. Deep link hoặc URL chứa session ID không cấp quyền.
- Session join / rejoin nhận capability có scope từ server. Chọn persona trên UI chỉ mở hướng dẫn ghép nối; role được quyết định capability/server, không phải `role` body, query param, AsyncStorage value hay route name. Không tạo account SaaS / profile consumer.

## Giới hạn chia sẻ

| Dùng chung (`packages/*`) | Giữ riêng theo platform |
|---|---|
| `packages/contracts`, `domain`, `simulation`, `api-client`, `design-tokens`; validation/state machine thuần, formatting và tên semantic tokens. | `packages/ui-web` (DOM, shadcn, Radix, Tailwind, Storybook web); `packages/ui-native` (React Native primitives, `StyleSheet`, VoiceOver/TalkBack semantics); `apps/web` và `apps/mobile` routes/screens. |
| Event/status enums, route/plan/report view-model selectors, deterministic formatting/units. | Focus/modal behavior, keyboard/pointer vs touch, navigation transitions, file/image picker, native target size, map renderer adapter. |

No `apps/web` → `apps/mobile` imports or vice versa. Public entrypoints only; tests enforce package boundaries. Shared view models may not own DOM or native platform modules.

## Map / isometric asset policy

- Map is data-driven geometry from calibrated snapshot: draw the same WGS84 edge/route state, proportional scale, direction, vehicle restrictions and legend on both clients; no live tile dependency. Web renderer uses SVG; native renderer uses `react-native-svg` `Svg`/`Path` primitives through the native icon/map adapter. Provide a visible text/list alternative; do not make spatial-only maps the sole way to inspect route state.
- Original isometric art is decorative entity illustration only (hub/vehicle/parcel); never the only status cue and never a tap target. Keep curated SVG source in `packages/icons/src/assets/isometric/*.svg`; `packages/icons/src/assets/isometric/asset-manifest.json` records `asset_id`, original author/source, project-approved SPDX license identifier, viewBox, alt/hidden policy and approved platforms. Web/native exports are `packages/icons/src/web/index.ts` and `packages/icons/src/native/index.tsx`; native renders vector paths with `react-native-svg`, with no raster-only or View-segment fallback.
- `packages/icons` is the shared workspace asset adapter, not a third-party icon pack. Keep `@muxa/ui-isometric` out; its public registry lookup did not expose package metadata. Do not use a third-party asset until redistribution license, provenance, Expo/RN compatibility and device rendering are separately verified. Expo's SVG package docs establish documented native compatibility for the renderer; no app/device test is claimed here.

## Required follow-through / acceptance

1. `apps/web/src/router.tsx` uses Data Mode; browser direct-load and refresh of each nested `/sessions/:sessionId/*` path renders the SPA, while `/api/v1/*` reaches Hono and never receives HTML fallback.
2. A loader/API timeout produces an inline retryable error; no operational state is inferred from a route transition or optimistic preview. Rejected 401/403 does not reveal controls; a copied deep link without capability stays unauthorized.
3. Expo navigation uses native stack/tab primitives; dispatcher can reach map, impact, plan, approval, Execute, sources/review, timeline, results and reset. Native role/scope comes from capability; toggling a visual persona cannot invoke another role's server operation.
4. Boundary tests enforce the `packages/icons/src/web` and `packages/icons/src/native` entrypoints rather than crossing `ui-web`/`ui-native`; a token-parity test compares web CSS variables and native JS values for shared semantic names.
5. For every shared scenario T01–T15, web and native show identical server revision, plan status, accepted evidence, committed assignment/ETA and simulation results. Device-specific presentation is allowed; state/rules are not.
6. Expo stream and map/icon adapter tests cover native response-body event parsing for `text/event-stream`, polling fallback, revision/reconnect behavior and `react-native-svg` map/isometric rendering on iOS + Android; these are planned tests, not completed tests.

## Verified sources

- [React Router Data Mode installation](https://reactrouter.com/start/data/installation) · [Data Router API](https://reactrouter.com/api/data-routers/createBrowserRouter) · [SPA guidance](https://reactrouter.com/how-to/spa)
- [Cloudflare Workers SPA routing](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/) · [Hono Cloudflare Workers](https://hono.dev/docs/getting-started/cloudflare-workers)
- [Expo Router introduction](https://docs.expo.dev/router/introduction/) · [React Native Style](https://reactnative.dev/docs/style) · [Expo fetch streaming](https://docs.expo.dev/versions/latest/sdk/expo.md) · [Expo SVG / `react-native-svg`](https://docs.expo.dev/versions/latest/sdk/svg.md)
- [Tailwind theme variables](https://tailwindcss.com/docs/theme) · [shadcn Tailwind v4](https://ui.shadcn.com/docs/tailwind-v4)
- Exact package lookup: `@muxa/ui-isometric` on [npm registry](https://registry.npmjs.org/@muxa%2fui-isometric); public metadata lookup returned E404 on 2026-10-30. This negative result does not distinguish private from unpublished.
