# Work item, launch receipt và delivery

## File authority
- IntegrationLead ghi `launch/<role_id>/<work_item_id>.json`, `gates/<gate_id>.json` và integration ledger trong thư mục này.
- Worker ghi own Markdown **SourceEvidence** trong worktree: source commit C trước, report commit R sau và report chỉ tham chiếu source_sha=C, không chứa SHA của chính R.
- [handoff-schemas.json](handoff-schemas.json) tách LaunchReceipt, worker SourceEvidence và Lead-owned DeliveryReceipt. Exact delivery_sha=R gửi out-of-band sau commit rồi Lead ghi vào central ledger; không yêu cầu report tự chứa enclosing SHA.

## Tránh self-referential commit SHA
1. Lead ghi BASE_SHA = current integrated code commit với upstream gates đã pass.
2. Freeze contract-index ở code BASE_SHA: danh sách repo-relative artifact paths+SHA256 và exact published public-interface refs. Contract fingerprint là SHA256 của canonical index; bootstrap-authoring dùng design artifact index, frozen-consumer dùng published C1/API/UI index, approved-amendment ghi amendment_id riêng.
3. Ghi launch receipt có BASE_SHA + required gate SHAs, rồi commit **metadata-only** receipt trên integration.
4. LAUNCH_SHA = commit metadata đó; tạo worktree từ LAUNCH_SHA. Receipt không bắt phải chứa chính commit SHA của nó.
5. Worker record observed_launch_sha=LAUNCH_SHA; BASE_SHA phải ancestor launch và launch ancestor delivery. Diff BASE→launch chỉ Lead metadata đã review. **Scope diff dùng `observed_launch_sha...delivery_sha`**, không tính launch receipt của Lead thành worker mutation.

## Preflight bắt buộc trước khi sửa code
- CWD/git root đúng manifest worktree path; branch đúng role; không dính user dirty files/merge đang dở.
- Receipt exists, role/work item đúng, state authorized và required gate SHAs là ancestors của current checkout.
- MUST verify policy_ref(path=AGENTS.md,commit_sha,sha256) khớp approved pinned source và checkout policy; hash trùng một file tự sửa không tạo authority. Startup/resume acknowledgement theo [bootstrap](agent-bootstrap.md).
- Contract-index hash+mọi entry hash match ở declared commit; contract_mode bootstrap-authoring/frozen-consumer/approved-amendment đúng role/task. Contract amendment cần amendment_id đã Lead authorize; consumer không tự sửa frozen input.
- Include/exclude ownership rõ. In-flight request tới file protected => stop/request, không auto stage/restyle.
- Port/local state/env per worktree, no copied secrets/account access. Nếu thiếu prerequisite báo blocked đúng phần, vẫn làm reachable scope được giao.

## Launch fields
- Fields gồm policy_ref riêng ngoài contract_ref, work_item/role/phase/base/mode/amendment/gates/branch/worktree; default remote permissions none. Policy revision cần actual user-authorized change + new receipt/hash, không worker tự edit để pass validation.
- Role scope lấy từ roles.json, không client/worker tự mở rộng allowed paths trong receipt.
- Lead authorizes one active work item/role worktree. Contract amendment là work item mới, không overwrite receipt đang dùng.

## Delivery report format
```text
Work item / role / branch / worktree:
Base SHA / observed launch HEAD / policy SHA256 / frozen contract hash:
Source commit(s), exact source_sha=C (report này không chứa SHA của chính report commit R):
Owned changed paths (both sides of rename):
Completed behavior + public exports/routers/binding needs:
Focused check commands + cwd + pass/fail/unavailable + evidence paths:
Smoke scenario + observed state/output (not only tests):
Unresolved prerequisite / bug / contract/dependency/export requests:
No out-of-scope writes / no secrets / no unrequested push/deploy:
```
- Bắt buộc two-commit protocol: source C → report R chỉ tham chiếu C → gửi `delivery_sha=R` qua message. Lead verify C ancestor R và C→R chỉ evidence, merge exact R rồi ghi DeliveryReceipt ở ledger tiếp theo. Không nhét enclosing delivery_sha vào report để tránh self-reference.
- Không điền “pass” cho command chưa chạy, không stub/no-op/mocks giả implementation.
- Status code-ready-for-integration không đồng nghĩa mọi PRD release acceptance đã đạt. D04/model/device limitations vẫn đi theo ledger.
- Failure implementation gửi owner/failing scenario; QA không sửa service/gate để làm suite xanh.

## Receipt acceptance của Lead
1. Exact submitted delivery_sha=R tồn tại; source_sha=C ancestor R; C→R chỉ own evidence metadata. Base/gates/launch ancestors hợp lệ; worker gửi SHA sau commit, không nhập lại SHA đó vào chính report R.
2. Verify BASE→observed launch chỉ có approved Lead metadata; sau đó `git diff observed_launch_sha...delivery_sha` phải thuộc role. Renamed old/new paths đều authorized; worker chỉnh launch/gate/central files sau launch vẫn reject. Không dùng code-base diff làm receipt của Lead bị tính là unauthorized worker edit.
3. Review source/contract changes + own focused evidence; merge dependency-ready delivery bằng exact SHA.
4. Lead xử lý glue/config/dependency requests bằng commit riêng, record parent/result SHA.
5. Run post-merge affected smoke; ghi gate **sau** merge+proof, không gate từ branch chưa integration.
6. Chỉ Lead đổi phase/plan status. Final QA/release evidence bound exact candidate, no cherry-picked happy path.
- Worker có thể embed **SourceEvidence** JSON không có delivery_sha vào own Markdown. **DeliveryReceipt** JSON có delivery_sha chỉ Lead ghi ở ledger sau khi R đã tồn tại, không cần commit self-reference.

## Không tự giải xung đột
- Dirty/diverged worktree, changed upstream contract, new package request hoặc file ngoài owner: báo Lead; không reset/rebase/cherry-pick siblings/force push để “dọn”.
- Lead mở correction/baseline-amendment work item khi cần dependency mới trong lúc worker có code: quiesce/checkpoint, merge approved NEW_LAUNCH_SHA preserving history, record new base/hash rồi resume theo [runbook](worktree-runbook.md). Không cần force/reset hoặc âm thầm trộn sibling code.
