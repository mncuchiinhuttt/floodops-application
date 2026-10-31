# Wave 0 — repo và Bun bootstrap

Tooling source commit C: `aea042b5fdb5100e826672111f326d3a03847ee7`; document publication D: `097daad8d137b9e3fcec40a0033c6e89131701eb`. Host: `mncuchiis-Macbook-Pro.local`.

- Repo: `/Users/vominhlong/seahackathon/floodops-application`; GitHub: https://github.com/mncuchiinhuttt/floodops-application (đã xác minh PRIVATE).
- Integration worktree: `/Users/vominhlong/seahackathon-worktrees/00-integration`, branch `integration/floodops-application`.
- Bun 1.4.0, một bun.lock; giữ Node cho Wrangler/Expo khi cần; Workers chạy workerd.
- Check ở cả repo chính và integration: install frozen + typecheck + lint + 5 tests pass. Audit: 0 vulnerability sau bản vá minimatch; licence summary đã kiểm.
- Workerd smoke: health 200, application route chưa triển khai 404, loopback 8760; server đã tắt.
- Git identity/signing được giữ, source commit ký SSH. Không model call, deploy hoặc implementation agent.

## Tài liệu mới đã review và publish

Sau khi user xác nhận chỉnh xong, đã đọc lại PRD §3.4, screen matrix, phases09/10/11 và hai UI-role prompts; đồng bộ 12 tài liệu thay đổi bằng commit riêng. Giữ 34 US rows và 64 API operations không đổi. Web ưu tiên dispatcher; một Expo app iOS/Android có workspace theo capability, driver chỉ own committed state sau Execute. Các semantics mới đã giữ cùng Bun/path amendments.

Hash/status của originals, snapshot đã commit và working copy nằm ở `docs/decisions/document-baseline.json`; source hashes đã đối chiếu lại sau review. Cả `workspace-bootstrap` và `plan-published` passed trong phạm vi init. Chưa có ContractsClient/runtime contract freeze, launch receipt, implementation agent hay application/device acceptance. Parent nhận handoff rồi mới điều phối wave1.

## Role order

IntegrationLead → ContractsClient → DesignSystem/SimulationData/SessionPlatform → SourcesMedia → PlannerSafety/ReviewRewards → ResultsEvaluation + Lead backend composition → WebConsole/ExpoMobile → QualitySecurity → ReleaseOps. Gates và exact ownership ở role manifest; production/store/main promotion vẫn cần authority riêng.

Model preference đã ghi: gpt-6.1-sol/max; helper hẹp gpt-6-luna/max, triển khai sâu gpt-6.1-terra/max; chưa agent nào được khởi chạy.

Push được xác minh riêng sau metadata commit; report này không chứa SHA của chính nó.
