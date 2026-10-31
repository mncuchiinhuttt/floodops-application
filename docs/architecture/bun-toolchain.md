# Bun toolchain — quyết định Wave 0

User xác nhận host `mncuchiis-Macbook-Pro.local` và yêu cầu ưu tiên Bun. Source repo là `/Users/vominhlong/seahackathon/floodops-application`; repo tài liệu cha được giữ nguyên. Quyết định này thay các ví dụ pnpm/Node mặc định trong bản plan; không đổi API, domain invariants hay release authority.

## Commands và runtime

| Surface | Tooling / runtime | Ghi chú |
| --- | --- | --- |
| Workspace, installs, scripts, unit tests | Bun 1.4.0 | Root workspaces `apps/*`, `packages/*`; `bun.lock` duy nhất; installs dùng `--frozen-lockfile --ignore-scripts`. |
| TypeScript và ESLint | Bun chạy local binaries | Dùng `bun --bun run tsc` / `bun --bun run eslint`; TypeScript 6.0.3 đáp ứng peer range `<6.1.0` của typescript-eslint 8.72.1. |
| Hono / Cloudflare API | Workers `workerd` | Bun phục vụ tooling; DO/SQLite/R2 semantics cần actual Workerd tests ở SessionPlatform gate. |
| Wrangler CLI | Node được Cloudflare hỗ trợ | `bun run api:dev` giữ Wrangler shebang Node; Node v26.8.1 hiện có trên máy đáp ứng Wrangler 4.156.0 `node >=22`. |
| Expo package manager / EAS | Bun; pin từng build profile | Root `bun.lock` để EAS nhận package manager. SDK/native peers do ExpoMobile + Lead chốt sau. |
| Expo template/prebuild | Node LTS vẫn cần | Expo dùng npm để tải template. Native JS chạy trong React Native engine do Expo cấu hình; không chuyển thành Bun runtime. |

`bunfig.toml` dùng isolated linker; Expo hỗ trợ isolated installs từ SDK 54. Nếu native package gây lỗi thực, Lead review evidence rồi đổi linker, không force-ignore peer mismatch. Không bật global `run.bun=true`, vì nó sẽ alias `node` và đổi runtime của các CLI ngoại lệ.

Node hiện có chưa là chứng cứ đã kiểm Expo bằng Node LTS. Trước mobile prebuild phải chọn Node LTS phù hợp SDK và chạy native checks; Wave 0 không tự cài/đổi Node toàn máy.

## Phạm vi bootstrap

Root tooling và Worker health entrypoint có checks chạy thật. Package chưa có source không có script `typecheck` giả hoặc export tới file rỗng. ContractsClient và các role sau gửi dependency/export requests cho Lead khi cần, rồi nhận baseline/lockfile mới qua receipt.

Mọi package là private. Dependency patches được pin từ registry, giữ peer constraints và kiểm advisory. Chưa trust lifecycle script nào (`trustedDependencies: []`); chỉ Lead duyệt nhu cầu native/postinstall trước khi cho chạy.

Lint-tool override `minimatch: 11.0.1` xử lý [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249). Upstream ESLint/typescript-eslint vẫn yêu cầu major 10 nên đây là override có chủ đích cho dev tooling; phải giữ lint/typecheck và các negative import-boundary tests xanh khi cập nhật. Gỡ override khi upstream dùng bản đã vá phù hợp.

## Nguồn chính thức

- [Bun workspaces](https://bun.sh/docs/pm/workspaces), [isolated installs](https://bun.sh/docs/pm/isolated-installs) và [bunfig](https://bun.sh/docs/runtime/bunfig).
- [Expo với Bun](https://docs.expo.dev/guides/using-bun/) và [Expo monorepos](https://docs.expo.dev/guides/monorepos/).
- [Wrangler system requirements](https://developers.cloudflare.com/workers/wrangler/install-and-update/) và [Hono trên Workers](https://hono.dev/docs/getting-started/cloudflare-workers).
