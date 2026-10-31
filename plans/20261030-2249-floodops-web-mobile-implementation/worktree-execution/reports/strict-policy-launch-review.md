# Strict policy launch review

## Result

**High/Critical actionable findings: 0.**

**Overall correctness:** correct within the assigned document-only launch/policy scope. **Confidence:** 0.96.

## Scope and evidence

Read the exact repository-root `AGENTS.md`, `start-here.md`, `orchestrator.md`, all 13 role prompts in `roles/`, the complete `roles.json` and `handoff-schemas.json`, `work-items-and-handoff.md`, and `worktree-runbook.md`. Cross-referenced `agent-bootstrap.md`, `ownership.md`, `execution-waves.md`, `README.md`, `shared-contracts.md`, `producer-interfaces.md`, and the root plan for the specified startup, ordering, source, and writer contracts. This was a static document review, not a repeat of the earlier general worktree review.

- **Run order:** The operator table, manifest waves, and role prerequisites agree: Lead bootstrap → ContractsClient → parallel DesignSystem/SimulationData/SessionPlatform → SourcesMedia → parallel PlannerSafety/ReviewRewards → ResultsEvaluation and Lead backend composition → parallel WebConsole/ExpoMobile → Lead combined configuration → QualitySecurity → ReleaseOps. SourcesMedia does not wait for DesignSystem; both clients explicitly wait for backend-ready and ui-libraries-ready through their required startup read. Dependencies require integrated gate commits rather than unmerged producer branches.
- **Shared writers:** The manifest and ownership matcher reserve central manifests, lockfile, entrypoint, Wrangler/EAS configuration, and gate/launch metadata for IntegrationLead. Root `AGENTS.md` is explicitly protected; bootstrap/injection documents, prompts, manifest, and receipt schemas fall within the Lead-owned role-pack subtree. Review subtrees and native release files are partitioned by explicit exclusions. Unassigned or ambiguous writes are denied.
- **Startup and source consistency:** Every role prompt links to the same repository-root policy, exact run order, bootstrap/recovery document, and injection rules. The relative policy and PRD links resolve to the root sources, and referenced phase/spec/contract targets are present. `LaunchReceipt.policy_ref` fixes `path` to `AGENTS.md`, requires commit and SHA-256 fields, and is itself required. Both SourceEvidence and DeliveryReceipt require `policy_sha256`; the handoff preflight requires comparison against the approved source and checkout rather than accepting a worker-supplied hash as authority.
- **Bootstrap, amendment, and legitimate continuation:** The Lead has an explicit user-authorized bootstrap exception to the worker-receipt requirement. Documentation-only work and bounded document reviewers are separately permitted. Policy revisions require authorized publication and affected-worker amendment; resume reloads actual policy/task/receipt/Git state. In-flight baseline updates preserve owned work through checkpoint and an authorized merge of NEW_LAUNCH_SHA. Suspicious embedded instructions block the unverifiable action, not all safe work. Preview/dev-build/model permissions can precede QA, so evidence collection is not gated on the evidence it must produce.

## Limits

No application code was audited, and no implementation, worktrees, branches, Git writes, package installation, builds, tests, formatters, deployment, account operations, or injection payload execution were performed. No automated link/schema validation or runtime security pass is claimed. Only this assigned review report was written; the main agent retains final document integration and validation.
