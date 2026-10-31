import { expect, test } from "bun:test";
import { compileCandidate, selectDependencyGroups, checkProposalIdentity } from "../../../../packages/domain/src/planning/index.ts";
import { authority, makeAction, makePlan, runFixture } from "./planning-context.ts";
function fixture() {
  const actions = [makeAction("act_first001", "grp_first001"), makeAction("act_second01", "grp_second01"), makeAction("act_third001", "grp_third001")];
  actions[1]!.depends_on_action_ids = [actions[0]!.action_id];
  return makePlan(actions);
}
test("pending dependency excludes its dependent group; independent group remains selectable", () => {
  const p = fixture(), result = selectDependencyGroups(p.actions, p.groups, ["grp_second01", "grp_third001"],
    { act_first001: "pending_approval", act_second01: "ready", act_third001: "ready" });
  expect(result.closure).toEqual(["grp_first001", "grp_second01", "grp_third001"]);
  expect(result.eligible).toEqual(["grp_third001"]); expect(result.excluded).toEqual(["grp_first001", "grp_second01"]);
});
test("action and explicit group closure is computed even if client selects only a dependent", () => {
  const p = fixture(); p.groups[1]!.depends_on_group_ids = ["grp_first001"];
  expect(selectDependencyGroups(p.actions, p.groups, ["grp_second01"],
    { act_first001: "ready", act_second01: "ready" }).actionIds).toEqual(["act_first001", "act_second01"]);
});
test.each(["missing_action", "action_cycle", "group_cycle", "missing_group", "duplicate_owner", "ungrouped", "wrong_owner", "duplicate_request"] as const)(
  "invalid dependency graph %s is rejected", kind => {
    const p = fixture(), requested = ["grp_second01"];
    if (kind === "missing_action") p.actions[0]!.depends_on_action_ids = ["act_missing1"];
    if (kind === "action_cycle") p.actions[0]!.depends_on_action_ids = ["act_second01"];
    if (kind === "group_cycle") p.groups[0]!.depends_on_group_ids = ["grp_second01"];
    if (kind === "missing_group") p.groups[0]!.depends_on_group_ids = ["grp_missing1"];
    if (kind === "duplicate_owner") p.groups[1]!.action_ids.push("act_first001");
    if (kind === "ungrouped") p.groups.pop();
    if (kind === "wrong_owner") p.actions[0]!.dependency_group_id = "grp_third001";
    if (kind === "duplicate_request") requested.push(requested[0]!);
    expect(() => selectDependencyGroups(p.actions, p.groups, requested, {})).toThrow();
  });
test("a group self-cycle, unknown selection and duplicate action ID are rejected", () => {
  const p = fixture(); p.groups[0]!.depends_on_group_ids = ["grp_first001"];
  expect(() => selectDependencyGroups(p.actions, p.groups, ["grp_first001"], {})).toThrow();
  p.groups[0]!.depends_on_group_ids = [];
  expect(() => selectDependencyGroups(p.actions, p.groups, ["grp_unknown1"], {})).toThrow();
  p.actions.push(p.actions[0]!); expect(() => selectDependencyGroups(p.actions, p.groups, [], {})).toThrow();
});
test("wire ready statuses never substitute for trusted action readiness", () => {
  const p = fixture();
  expect(selectDependencyGroups(p.actions, p.groups, ["grp_first001"], {}).eligible).toEqual([]);
});
test.each(["session", "generation", "revision", "plan", "job"] as const)("stale %s fails even when other fields match", field => {
  const a = authority(runFixture()), current = structuredClone(a.current);
  if (field === "session") current.session_id = "ses_other001"; if (field === "generation") current.generation++;
  if (field === "revision") current.revision++; if (field === "plan") current.latest_plan_id = "pln_newer001";
  if (field === "job") current.latest_requested_job_id = "job_newer001";
  expect(checkProposalIdentity(a.identity, current).status).toBe("needs_replan");
});
test("current trusted identity passes; malformed counters fail closed", () => {
  const a = authority(runFixture()); expect(checkProposalIdentity(a.identity, a.current).status).toBe("ready");
  a.identity.input_revision = NaN; expect(checkProposalIdentity(a.identity, a.current).status).toBe("blocked");
});

test("public compiler rejects a selection that omits mandatory action closure", () => {
  const run = runFixture(), p = fixture();
  const selection = selectDependencyGroups(p.actions, p.groups, ["grp_second01"], { act_first001: "ready", act_second01: "ready" });
  expect(() => compileCandidate(p, { ...selection, actionIds: ["act_second01"] }, [], run)).toThrow("Selection omitted");
});
