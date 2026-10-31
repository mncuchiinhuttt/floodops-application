# Git worktree runbook — không cần helper riêng

Các lệnh dưới là **lệnh cho lần triển khai sau**, chưa chạy trên repo thật trong bước plan. Thực hiện trong terminal tương ứng, giữ signing/identity hiện tại; không disable ký commit để vượt lỗi.

## 0. Publish plan trước
- Worktree chỉ thấy committed files. Root AGENTS.md và bộ plan/role cần review+publish trước khi đặt PLAN_SHA; policy/source SHA thật, không copy untracked docs để giả baseline.
- Stage explicit AGENTS.md + plan directory khi user authorize publish; không add .agents/.claude/env/PII. Tài liệu không tự cấp quyền commit/push ngay bây giờ.
```sh
REPO_ROOT="$(git rev-parse --show-toplevel)"
PLAN_SHA="$(git rev-parse HEAD)"
PLAN_DIR="plans/20261030-2249-floodops-web-mobile-implementation"
git cat-file -e "$PLAN_SHA:AGENTS.md"
git cat-file -e "$PLAN_SHA:$PLAN_DIR/plan.md"
git cat-file -e "$PLAN_SHA:$PLAN_DIR/worktree-execution/roles.json"
```
Nếu cat-file fail thì dừng; không copy untracked plan sang từng worktree để giả committed baseline.

## 1. Chỉ tạo integration worktree đầu tiên
```sh
WORKTREE_ROOT="$(dirname "$REPO_ROOT")/seahackathon-worktrees"
git -C "$REPO_ROOT" worktree list --porcelain
mkdir -p "$WORKTREE_ROOT"
git -C "$REPO_ROOT" worktree add -b integration/floodops-application "$WORKTREE_ROOT/00-integration" "$PLAN_SHA"
```
- Nếu branch/path đã có: inspect worktree list, resume đúng worktree; không dùng -B/--force/remove để ghi đè.
- Mở session IntegrationLead tại00-integration và dùng [orchestrator](orchestrator.md).
- Source main worktree giữ nguyên. `.git` trong linked worktree là file trỏ Git common dir, không thay nó bằng directory/copy repo.

## 2. Tạo worktrees theo wave mới đủ gate
Lead đã merge dependencies, ghi/commit launch receipt metadata rồi resolve:
```sh
LAUNCH_SHA="$(git -C "$WORKTREE_ROOT/00-integration" rev-parse HEAD)"
ROLE_BRANCH="feat/floodops-contracts-client"
ROLE_PATH="$WORKTREE_ROOT/01-contracts-client"
git -C "$REPO_ROOT" worktree add -b "$ROLE_BRANCH" "$ROLE_PATH" "$LAUNCH_SHA"
pnpm --dir "$ROLE_PATH" install --frozen-lockfile
```
Đây là ví dụ wave1, chỉ chạy sau workspace-bootstrap. Sau khi ContractsClient merged và C1 frozen, **resolve LAUNCH_SHA lại** trước khi tạo wave2:
```sh
git -C "$REPO_ROOT" worktree add -b feat/floodops-design-system "$WORKTREE_ROOT/02-design-system" "$LAUNCH_SHA"
git -C "$REPO_ROOT" worktree add -b feat/floodops-simulation-data "$WORKTREE_ROOT/03-simulation-data" "$LAUNCH_SHA"
git -C "$REPO_ROOT" worktree add -b feat/floodops-session-platform "$WORKTREE_ROOT/04-session-platform" "$LAUNCH_SHA"
```
Các role khác dùng branch/path chính xác từ [manifest](roles.json), không chạy batch tạo cả13 worktrees từ PLAN_SHA. Trước add, confirm path không tồn tại và branch chưa checked out nơi khác; Git từ chối thì điều tra, không force.

## 3. Launch đúng một role
- CWD là worktree của role. Dán toàn [role prompt](README.md#role-catalog) hoặc bảo agent đọc file role ở chính worktree, cộng launch receipt do Lead cấp.
- Một worktree chỉ một writer agent. Không chạy global cook plan trong mỗi worker, không để worker tự spawn các phase còn lại.
- Session không thấy local ignored skills của main là bình thường; dùng global skills nếu có và role prompt đã chứa scope/context. Không copy ignored agent configs vào Git/worktree.

## 4. Install, ports và local state
- Mỗi worktree có node_modules/output/.wrangler/.expo riêng; pnpm content store dùng cơ chế chuẩn được phép, không manually symlink node_modules.
- Frozen install chỉ sau Lead dependency commit. Không `pnpm add`, Expo install hoặc generator đổi protected manifests trong worker.
- Bind dev/test servers127.0.0.1; port assignments ở manifest. Port đang dùng thì báo Lead cấp port mới, không kill process người khác.
- Worker state path bên trong chính worktree; không dùng absolute persist-to trỏ source main/shared worktree. Preview/prod resources không dùng làm shared scratch state.
- Android USB dùng explicit adb reverse cho **port của role** nếu cần; iOS/Android physical cần approved HTTPS preview/dev build. Không mở API/Metro0.0.0.0 để xử lý nhanh.
- EAS/Cloudflare credentials cấp qua approved secret channel, không copy env tự động. Live model/remote checks chỉ khi work item cho phép.
- Preview/dev-build/model evidence dùng grant `preview-authorized` theo environment/action/budget, có thể cấp trước qa-ready. Production/store/main-promotion dùng `release-authorized` sau acceptance; permission không tự chứng minh evidence.

## 5. Commit delivery
- Stage explicit owned source, commit C và chạy focused tests/smoke trên source C. Ghi report SourceEvidence với source_sha=C rồi commit report R riêng (không source edits lẫn report-only commit).
- Sau R mới gửi exact delivery_sha=R out-of-band cho Lead; report chứa base/launch/hash/checks nhưng **không chứa SHA của chính R**. Lead merge R để code và evidence cùng đi vào integration, ghi DeliveryReceipt ở ledger sau đó. Conventional commits, keep signing.
- Worker không tự merge siblings/main/integration hoặc force-push/rebase shared history. Integration baseline amendment chỉ theo quy trình bên dưới với Lead authorization; own branch push phải được receipt cho phép.

## 6. IntegrationLead merge exact delivery
1. Integration worktree clean và không merge dở; review delivery scope/evidence và gate ancestry trước.
2. Capture integration HEAD và submitted DELIVERY_SHA; branch tip thay sau report không đổi submitted SHA.
```sh
git -C "$WORKTREE_ROOT/00-integration" merge --no-ff --no-commit "$DELIVERY_SHA"
```
3. Inspect staged delta theo ownership; conflict quay về owner hoặc abort **chính merge này**, không checkout ours/theirs toàn bộ.
4. Commit merge sau focused gate, rồi xử lý central config/dependency/export glue bằng commit riêng và smoke affected path.
5. Ghi gate receipt với resulting integration SHA+evidence. Không squash khi ancestry receipts đang dùng; không promote main trước final authorization.

## 7. Reuse worktree sau khi delivery cũ đã merged
```sh
git -C "$ROLE_PATH" status --short
git -C "$ROLE_PATH" merge --ff-only "$NEXT_LAUNCH_SHA"
```
Chỉ thực hiện khi sạch, prior delivery đã nằm trong integration và new launch receipt được cấp. Diverged/uncommitted => stop; không reset --hard/clean/stash user changes để ép sync. Không rebase giữa lúc agent khác đang tham chiếu receipt commit.

### Baseline amendment khi worker có code chưa merge
1. Worker dừng writer, báo Lead và commit/checkpoint **owned files** vào own branch; chưa gọi đây là completed delivery.
2. Lead commit central dependency/contract fix vào integration, issue work item mới với NEW_BASE_SHA/contract hash và metadata-only NEW_LAUNCH_SHA; đóng/supersede receipt cũ.
3. Chỉ sau Lead authorize, writer của role dùng `git merge --no-ff "$NEW_LAUNCH_SHA"` trong role worktree; preserve own commits, không rebase/reset hoặc merge sibling trực tiếp. Xung đột central file do Lead xử lý trong cửa sổ writer đã dừng.
4. Resume receipt mới; NEW_BASE_SHA ancestor NEW_LAUNCH_SHA ancestor HEAD. Source scope diff từ NEW_LAUNCH_SHA tới delivery chứa own contribution, inherited central/launch changes kiểm riêng. Rerun affected checks; không tính dependency commit Lead là unauthorized worker edit.
5. Đây là exception có kiểm soát, không cho phép workers tự đuổi theo moving main/latest integration giữa lúc đang làm.

## 8. Thông tin không được nhầm
- Plan-published SHA chứa tài liệu, contracts-ready SHA chứa contract code, backend-ready SHA chứa composition chạy được; ba gate khác nhau.
- Đã tạo branch/worktree không nghĩa code complete. Code-ready không là calibration/model/device/release pass.
- Gate record cần source SHA và actual evidence; không chỉ sửa status.json thành pass.
