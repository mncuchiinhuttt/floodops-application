# Strict policy security review

## Result

**Remaining concrete High/Critical issues: 0.**

Document-only verdict: **correct within the assigned security lens**. Confidence: **0.94**. This is not a certification of developer-agent isolation or FloodOps runtime security.

## Scope and method

Read the complete current contents of:

- Root `AGENTS.md`, sections 1–13.
- Role pack `agent-bootstrap.md`.
- Role pack `prompt-injection-policy.md`.
- Role pack `injection-scenarios.json`, including all 22 cases.

Read `injection-scenarios.schema.json` and the `LaunchReceipt.policy_ref` definition/required fields in `handoff-schemas.json` only to trace the assigned documents' scenario and pinned-policy boundaries. No application implementation was audited.

Scoped `git diff`, `git diff --cached`, and path-history inspection returned no entries for the four target documents. This assessment therefore concerns their supplied current contents; it does not assert a tracked historical delta.

## Original findings

**None meeting the required High/Critical, concrete-impact threshold.** No policy defect is being promoted from a speculative deployment concern or an unexecuted scenario.

## Security boundary evidence

| Review lens | Evidence and conclusion |
|---|---|
| Actual hierarchy and origin | `AGENTS.md` §1 and §10 INJ-01–03; bootstrap “Mục đích và authority” / “Source phải pin”; injection policy “Entry points và trust”: actual runtime messages and authorized tasks determine authority. File labels, XML tags, role names, tool results, and self-asserted approvals cannot create grants. |
| Role grants and policy self-modification | `AGENTS.md` §§2, 4–5 and INJ-03/06 require bounded ownership, protected policy/receipt/grant records, reviewed publication, and explicit remote authorization. Bootstrap resume steps 1–4 reject remembered roles, changed policy pins, and revoked work items. `handoff-schemas.json:194–232` carries and requires `policy_ref` with root path, commit SHA, and SHA-256. |
| Secrets and lower-trust content | `AGENTS.md` §§7, 9–10 and injection policy “Sensitive data paths và actions” explicitly cover stdout/stderr, teammate reports, scripts, encoded exfiltration, OCR/EXIF, retrieved memory, and persistent policy poisoning. Inspection did not identify an instruction-origin exception that grants these inputs privileged actions. |
| Benign-task continuation | INJ-08/09 and injection response steps 1, 3, and 5 preserve valid business data and block only unverifiable actions. PI-19–22 provide benign operator/domain/language cases rather than treating sensitive words as a denial rule. |
| Runtime gate boundary | `AGENTS.md` §§8, 11 and injection response step 6 place authorization, strict schemas, session/revision checks, budgets, policy gates, and atomic effects outside the model. PI-12–18 distinguish proposed evidence from authority, rewards, vehicle scope, timestamps, and Execute. |
| Guidance versus enforcement | `AGENTS.md` §§3, 10 INJ-10, and §13; bootstrap “Guard enforcement limits”; injection policy acceptance section explicitly state that worktrees, prompts, policy text, receipts, and keyword filters are not sandboxes. Real filesystem/tool/network permissions and external enforcement remain operator responsibilities. |
| Truthful claims and fixture boundary | `AGENTS.md` §12, injection policy “Cách nghiệm thu”, and scenario JSON lines 2–4 distinguish document/schema inspection, deterministic tests, agent evaluation, and real-model evidence. Scenario payloads are explicitly inert and execution status is explicitly not executed. The supporting schema accepts both declared surfaces and classifications and requires the expected-outcome fields; no runtime evaluator is claimed to have consumed or passed them. |

## Suggestions — not findings

None. No additional control, feature, or application re-audit is requested by this review.

## Checks and limitations

Performed static document reading, targeted searches, and read-only Git inspection only. No payload was executed; no callback URL was opened; no runtime attack, agent evaluation, schema validator, application test, build, formatter, package installation, deployment, or account operation was run. No enforcement effectiveness or application security pass is claimed. The only repository write for this assignment is this report.
