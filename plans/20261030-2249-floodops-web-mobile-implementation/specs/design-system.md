# Đặc tả design system Web + Native

## Mục tiêu và ranh giới

- Mục tiêu tuân thủ web: WCAG 2.2 Level AA. Native phải được kiểm riêng với VoiceOver (iOS) và TalkBack (Android); không gọi tuân thủ WCAG web là bằng chứng native đã đạt.
- Web dùng `packages/ui-web` (React DOM + shadcn/ui + Tailwind v4 CSS). Native dùng `packages/ui-native` (React Native primitives + `StyleSheet`). `packages/icons` sở hữu original vetted SVG assets và explicit `web` / `native` entrypoints; native adapter dùng `react-native-svg` primitives per Expo SDK documentation. Chỉ token data, contracts, domain và view-model thuần được chia sẻ; không chia sẻ Radix, DOM, Tailwind class hay component web sang native.
- UI luôn cho thấy `Simulation`; từng nguồn / input mang nhãn Reference data, Replayed hoặc Simulated; điểm thưởng luôn Simulated. Hiện `Calibration incomplete` khi seed thiếu căn cứ / kiểm chứng D04. Không dùng màu, icon isometric hoặc animation làm nguồn duy nhất cho trạng thái.

## Hợp đồng token

Nguồn chuẩn: `packages/design-tokens/tokens.json`. Dùng tên token semantic ở feature UI; primitive chỉ được dùng trong adapter hoặc token alias. Build artifacts: `packages/design-tokens/src/tokens.css` cho CSS/Tailwind và `packages/design-tokens/src/tokens.native.ts` cho React Native. Không viết lại màu / spacing trong từng app.

### Primitive tokens (giá trị đề xuất)

| Nhóm | Token | Giá trị |
|---|---|---|
| Màu neutral | `neutral.0`, `neutral.50`, `neutral.100`, `neutral.600`, `neutral.700`, `neutral.950` | `#FFFFFF`, `#F4F7F8`, `#E7EDF0`, `#52636D`, `#3A4A54`, `#12212B` |
| Màu brand | `brand.50`, `brand.700`, `brand.900` | `#EAF5F8`, `#0B5D72`, `#154458` |
| Màu trạng thái | `green.900`, `amber.900`, `red.900`, `blue.800` | `#0B4F44`, `#713B00`, `#8D1E23`, `#174A8B` |
| Nền trạng thái | `green.50`, `amber.50`, `red.50`, `blue.50` | `#E1F3EC`, `#FFF4DB`, `#FCE8E7`, `#EAF1FB` |
| Spacing | `space.1..8` | `4, 8, 12, 16, 24, 32, 40, 48` CSS px / RN dp |
| Typography | `type.xs/sm/body/lg/title/titleLg` | `12/14/16/18/24/32` px; body line-height `1.5`; headings `1.2` |
| Shape | `radius.sm/md/lg`, `border.default`, `focus.width/offset` | `6/10/14` px, `1` px, `2/2` px |
| Elevation / motion | `shadow.panel`, `duration.fast/standard`, `motion.reduce` | Subtle overlay only; `120/180` ms; obey reduced-motion preference |

Color values above are proposed primitives, not a claim of verified conformance. See contrast release gate below. Product code must never use a primitive status color directly; semantic alias carries meaning and contrast pairing.

### Semantic tokens

| Token | Meaning / default mapping |
|---|---|
| `surface.canvas`, `surface.panel`, `surface.raised`, `surface.inverse` | App, card, modal, high-emphasis surface: neutral 50 / 0 / 0 / neutral 950. |
| `text.primary`, `text.secondary`, `text.inverse`, `text.disabled` | Default neutral 950; secondary neutral 700; inverse neutral 0. Disabled actions are also programmatically disabled and explained, not conveyed by low contrast alone. |
| `border.default`, `border.strong`, `focus.ring` | Neutral 600 / neutral 700 / blue 800; focus ring visible on both surface and component boundary. |
| `action.primary.{bg,fg,hover}`, `action.secondary.{bg,fg,border}`, `action.danger.{bg,fg}` | Brand 900 + white; surface + brand 900; red 900 + white. |
| `status.closed`, `status.congestion`, `status.unknown`, `status.conflict`, `status.ready`, `status.pending`, `status.blocked`, `status.executed`, `status.replan` | Each is `{fg,bg,border,icon}`; closed/blocked red, congestion/pending amber, unknown neutral, conflict purple-pattern + explicit text, ready/executed green, replan blue. Icon + label + pattern distinguish categories without color. |
| `provenance.reference`, `provenance.replayed`, `provenance.simulated` | Separate provenance labels, not severity. `Simulated` remains present beside points and simulation results. |
| `priority.critical`, `priority.food`, `priority.standard` | Explicit text labels / stable symbols; keep critical > food > standard ordering and never present as route safety. |
| `map.road.closed`, `map.road.congestion`, `map.road.unknown`, `map.route.primary`, `map.route.alternative` | Status aliases mapped to color + line pattern + accessible label. Route color must not imply legal passability beyond gate state. |

### Component tokens and inventory

| Component / public surface | Required variants and state contract |
|---|---|
| `Button`, `IconButton`, `LinkButton` | Primary, secondary, destructive, disabled, pending; name, role and state; separate approve/reject/execute styling; icon button always has text alternative and consumes only the platform-specific `packages/icons` entrypoint. Web hit area defaults to `44×44` CSS px; this exceeds WCAG minimum and is a product design target. Native minimum is `44×44` dp as a project usability target, not a WCAG measurement. |
| `TextField`, `TextArea`, `SelectField`, `ImagePickerField` | Label, optional/required, hint, invalid, disabled, pending; error linked to field; never placeholder-only label. Native picker control exposes selected file count and removal action. |
| `StatusBadge`, `ProvenanceBadge`, `PriorityBadge`, `RuleId` | Text + icon/shape; never color-only; distinguish simulated/source state from safety/risk state. |
| `Card`, `MetricCard`, `KeyValueList`, `DataTable` / native `AccessibleList` | Heading, description, empty/loading/error states; mobile table has equivalent labeled row list, not clipped horizontal-only content. |
| `Dialog` / native confirmation sheet, `Toast` / live status | Modal labels/descriptions, focus containment/restoration on web; native accessibility focus and announcement. Destructive Execute / Reset requires explicit confirmation or clear review step, never auto-commit. |
| `SimulationBanner`, `CalibrationStatus`, `SourceCard`, `EvidenceSummary` | Persistent simulation label; unavailable/stale/replayed/simulated; provider/type/observed time/expiry/vehicle scope; calibration gap stated without invented values. |
| `MapCanvas`, `MapLegend`, `MapEntityMarker`, `RouteSummary` | Same state/scale contract across platforms; web SVG and native `react-native-svg` `Svg`/`Path` adapter render the same edge geometry; line patterns, labeled markers, scale and list/table alternative. Markers are controls only when explicitly exposed as accessible actions. |
| `PlanActionCard`, `PlanDiff`, `GateReasonList` | Projected vs committed values; proposed/pending/blocked/ready/executed/needs-replan; targets, reason, evidence IDs, dependency group, risk and rule IDs. Approval is not Execute. |
| `ReportForm`, `ReviewDecision`, `GapCoverage`, `PointsLedger` | Draft/pending/rejected/accepted distinct; reason code; gap by segment+vehicle; points exactly-once and Simulated; no cash/payout language. |
| `EventTimeline`, `ResultComparison`, `ResetControl` | Simulation time + event sequence + actor; same H/static baseline/FloodOps; projected metrics separate; Reset confirms new session and rejoin. |

## Layout / responsive behavior

- Web operations console: persistent left navigation, top `SimulationBanner`, responsive main canvas with map + impact/plan side panel. At narrow width, map and panels become single-column; actions remain visible and focus is not covered by sticky nav/banner.
- Native: respect safe areas/system bars; tab navigation for Overview, Map, Plan, Sources, Results; detail stacks for reports/review/timeline. Dispatcher's critical actions remain reachable by labeled buttons; do not rely on swipe-only controls or hidden hover state.
- At 320 CSS px / 200% zoom, no required action or value disappears; map can scroll/zoom but also exposes a non-spatial ordered list. Reflow all forms and plan comparisons rather than forcing page-level horizontal scrolling.
- Reduced-motion preference suppresses non-essential transitions, animated route replay and decorative movement. Playback speed never changes simulation time or data.

## Accessibility requirements

### Web: WCAG 2.2 AA release gate

- Semantic landmarks/headings, visible labels, descriptive page title, skip link, correct button/link distinction, keyboard access and predictable focus order. Dialogs restore focus; inline results announce `role=status` / appropriate alert severity without repeated announcements.
- Contrast: normal text ≥4.5:1, large text ≥3:1; meaningful component boundaries/graphics ≥3:1. Verify every foreground/background pair including badges, disabled states, focus, map legend and error states. Color alone cannot encode closed/congested/unknown, priority, approval or provenance.
- Reflow at 320 CSS px, text zoom, keyboard-only route/incident/report/plan flows, visible focus, and Focus Not Obscured (Minimum) with sticky banner/panels. WCAG 2.2 AA Target Size (Minimum) is 24×24 CSS px subject to criterion exceptions; product defaults above 44×44. Any drag interaction has single-pointer non-drag alternative (move-up/down, buttons, or fields).
- Forms identify errors in text, link hint/error descriptions, preserve values on validation failure, and focus an error summary after failed submit. Do not ask users to infer a reason from color or icon.

### Native: VoiceOver / TalkBack

- All actionable controls have platform label, role, value/state, hint where needed, and stable accessibility order. Group headings and reading order follow the visual sequence; decorative isometric art is hidden from AT, informative imagery gets concise alt/label text.
- Announce capability denial, pending upload, stale session, report accepted/rejected, gate blocked/ready, and Reset/rejoin outcomes. Avoid announcing every map geometry node; expose a concise selected-route summary and accessible segment/driver/order list.
- Verify at least one current iOS device/simulator with VoiceOver and one Android device/emulator with TalkBack. Test enlarged text/display size, system contrast setting where available, keyboard/switch navigation where supported, safe areas and target sizing. No native ARIA.

## Storybook, testing and governance

- Web Storybook: `packages/ui-web/.storybook/main.ts` and `packages/ui-web/src/**/*.stories.tsx`. Every component gets stories for normal, empty, loading, invalid, blocked, stale/offline and narrow layout where applicable; the `MapCanvas` story includes closed, congestion, unknown, conflict, vehicle scope, legend, scale and text alternative; icon stories cover decorative vs informative labels and status-independent illustrations.
- Native component review surface: `apps/mobile/src/dev/DesignSystemGalleryScreen.tsx` renders production `ui-native` components and actual `packages/icons/src/native` SVG assets; do not import web stories or add a cross-platform Storybook dependency just to share examples.
- Tests to add: `packages/design-tokens/test/token-parity.test.ts` (all semantic names map in CSS/native); `packages/design-tokens/test/contrast.test.ts` (all documented text/UI pairings meet thresholds); `packages/icons/test/platform-entrypoints.test.ts` and `packages/icons/test/native-svg.test.tsx` (platform exports, original asset manifest, native vector rendering); `packages/ui-web/test/accessibility/*.test.tsx` (axe + labels/roles/keyboard); `packages/ui-web/test/visual/*.spec.ts` (responsive and map/status variants); native screen-reader scenarios in `apps/mobile/test/accessibility/` (VoiceOver/TalkBack manual checklist + stable automated accessible-role assertions). Run the SVG/map rendering checks on iOS + Android; Expo Go support is documented, not app-tested here. Automated checks do not replace manual AT passes.
- Governance: token change edits `tokens.json` and both adapters in one change; no literal color/spacing in feature screens except data-driven geometry; every component has a public entrypoint and story/gallery example; every exception records rationale, affected WCAG/native behavior, owner and removal condition. `packages/icons/src/assets/isometric/*.svg` are original vetted source artwork; `packages/icons/src/assets/isometric/asset-manifest.json` stores project-approved SPDX license/source/attribution, viewBox and alt policy. `packages/icons/src/web/index.ts` and `packages/icons/src/native/index.tsx` are the only app-facing icon entrypoints. Review source/license, viewBox, alt policy, bundle size and web/native rendering before merge; do not import `@muxa/ui-isometric`.

## Cited standards

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/) (including 1.4.3, 1.4.11, 2.4.7, 2.4.11, 2.5.7 and 2.5.8).
- [Tailwind CSS theme variables](https://tailwindcss.com/docs/theme) and [shadcn Tailwind v4](https://ui.shadcn.com/docs/tailwind-v4); [React Native Style](https://reactnative.dev/docs/style); [Expo SVG / `react-native-svg`](https://docs.expo.dev/versions/latest/sdk/svg.md).
