# Feature implementation recipes và packages

## Feature boundary recipe
`apps/api/src/features/<feature>/{routes.ts,schemas.ts,service.ts,ports.ts,tests}`; `schemas.ts` imports contracts, no duplicate wire types. Service receives session runtime/ports, cannot mutate a global map.
`apps/web/src/features/<feature>/{api,model,components,routes,tests,index.ts}`; React Router route module small, server state via typed query client.
`apps/mobile/src/features/<feature>/{api,model,components,screens,tests,index.ts}`; Expo `app/` files only navigation adapters, business logic stays feature folder.
`packages/domain/src/<feature>` owns pure reducer/guards/value types. `packages/simulation` owns graph/clock/projections, never React state.

## Feature ownership and observable completion
| Feature | Domain/API | Web | Mobile | Complete |
|---|---|---|---|---|
| session | scoped capabilities/invites/revoke/reset/expiry | join/create + session boundary | create/claim + SecureStore/rejoin | isolated state and no role elevation |
| scenario | manifest/schema/hash/provenance/calibration | catalog/calibration inspector | scenario select + config detail | fixture vs calibrated distinct |
| operations-map | graph/load/route/driver progress | SVG map+accessible table | react-native-svg+list/safe pan | same real geometry and server state |
| incidents | rain/tide/combined fixtures/impact ranking | trigger/impact priority | overview trigger + detail | context never closes road |
| planning | tools/job/plan/diff/approval/execute | full plan comparison/group gates | full plan detail and group actions | no change before Execute |
| sources | source/context/measurement/replay | source registry/tide datum panels | sources stacks | source unavailable not fake truth |
| reports | driver+citizen input/media/normalization | report form/own history | image picker/drafts/report form | verified own media, explicit send |
| knowledge | validation/epochs/conflict/freshness | review/conflict resolution | review/evidence detail | accepted vs route authorization separate |
| rewards | gaps/useful coverage/exactly-once ledger | gap progress/points/review result | contributor points + dispatcher ledger | one award/report + first-fill gap |
| simulation | explicit advance/event ordering/reset hooks | clock/trace playback | clock controls/render replay | wall speed never changes physics |
| results | H-completion metrics/branches/model eval | results/evaluation table | same raw metrics lists | raw observed≠projected |
| evidence-log | Codex/design/data provenance artifacts | read labels/trace links | labels/redacted traces | human decisions/test logs repo |

## Packages to pin at implementation
- React + React DOM + React Router compatible releases; Vite web build; Tailwind CSS v4 via `@tailwindcss/vite`; shadcn copied component source remains ui-web-owned.
- Hono + Zod + Hono Zod/OpenAPI adapter after confirming OpenAPI3.1 support; Wrangler + Cloudflare Vite/plugin or deterministic Wrangler static assets build according deployment spec. No node server adapter in production Worker.
- Expo compatible React/RN versions from selected Expo SDK; Expo Router, SecureStore, ImagePicker, FileSystem, react-native-svg, safe-area/navigation peers via `expo install` not arbitrary newest patch.
- TanStack Query shared transport/cache semantics; no duplicate UI state store for server snapshot. Form stack React Hook Form + Zod where applicable; native field adapter.
- `@floodops/icons` internal vector package with web and native entrypoints; controls via licensed vector icon adapter. No invented `@muxa/ui-isometric` public API or unpurchased assets.
- Vitest/Workerd pool/Testing Library/Jest RN/Playwright/Maestro/axe/fast-check: verify supported versions together, licence/advisories before install.
- bun.lock frozen CI, Bun toolchain pinned (Node exceptions trong docs/architecture/bun-toolchain.md), `expo-doctor` and peer deps check; never force-ignore peer mismatch.

## Data/loading pattern
- Query key begins session+generation+feature+filters. Response revision stored, not overwritten by older response. On reset abort all requests/query cache, clear old credential.
- Route loaders prefetch same TanStack query options; no duplicate loader fetch + hook fetch storms.
- Mutations server-first, no optimistic assignment/points/safety. Local loading flags/error field state okay. Retry GET bounded; mutation retry **same idempotency key/payload**, never stale revision rebase automatically.
- Infinite list cursor session scoped. Map graph cache immutable by graph_hash; dynamic knowledge per revision; selectors memoized.
- Hono middleware order request_id→limit/auth/CSRF→schema→session ownership→feature→typed error, using exact operationId and role contract.

## No scaffolding-only delivery
- Feature done means API, domain transition, both client surfaces, unauthorized/error state, tests and actual smoke path. No empty screen/mock numbers/no-op “future integration”.
- Fixtures real operational code exercises synthetic input; no pretending fixture output is calibrated/live provider.
- Missing external credentials/data block relevant acceptance only; implement all reachable functional behavior and record exact evidence required.
