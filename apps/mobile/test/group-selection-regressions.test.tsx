import { fireEvent, render, screen } from "@testing-library/react-native";
import type { Plan } from "@floodops/contracts";
import { groupClosure } from "../src/features/planning/group-selection";
import { PlanScreen } from "../src/features/planning/plan-screen";
import { fixtureContext, fixturePlan } from "../preview/fixture-data";

function mixedPlan(): Plan {
  const plan = fixturePlan();
  const action = plan.actions[0]!;
  plan.status = "blocked"; // One blocked sibling must not poison an independent Ready closure.
  plan.actions.push({ ...action, action_id: "act_ready002", dependency_group_id: "grp_ready002", depends_on_action_ids: [action.action_id], status: "ready" });
  plan.actions.push({ ...action, action_id: "act_blocked1", dependency_group_id: "grp_blocked1", status: "blocked" });
  plan.groups.push({ group_id: "grp_ready002", action_ids: ["act_ready002"], depends_on_group_ids: ["grp_fixture01"] });
  plan.groups.push({ group_id: "grp_blocked1", action_ids: ["act_blocked1"], depends_on_group_ids: [] });
  return plan;
}

test("selected Ready closure includes transitive dependencies and excludes blocked siblings", async () => {
  const plan = mixedPlan();
  expect(groupClosure(plan, ["grp_ready002"])).toEqual(["grp_fixture01", "grp_ready002"]);
  expect(groupClosure(plan, ["grp_blocked1"])).toBeNull();
  const onExecute = jest.fn();
  await render(<PlanScreen context={{ ...fixtureContext(), online: true }} plan={plan}
    currentPlan={{ planId: plan.plan_id, planningJobId: plan.planning_job_id }} onExecute={onExecute} />);
  expect(screen.getByRole("button", { name: "Execute plan" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Select group grp_blocked1" })).toBeDisabled();
  await fireEvent.press(screen.getByRole("button", { name: "Select group grp_ready002" }));
  expect(screen.getByRole("button", { name: "Execute plan" })).toBeEnabled();
  await fireEvent.press(screen.getByRole("button", { name: "Execute plan" }));
  expect(onExecute).toHaveBeenCalledWith({ group_ids: ["grp_fixture01", "grp_ready002"] });
  expect(onExecute).toHaveBeenCalledTimes(1);
});

test("dependency cycles fail closed without returning a partial closure", () => {
  const plan = mixedPlan();
  plan.groups[0]!.depends_on_group_ids = ["grp_ready002"];
  expect(groupClosure(plan, ["grp_ready002"])).toBeNull();
});

test("missing dependency, missing action and mismatched action ownership fail closed", () => {
  const missingDependency = mixedPlan();
  missingDependency.groups[1]!.depends_on_group_ids = ["grp_missing1"];
  expect(groupClosure(missingDependency, ["grp_ready002"])).toBeNull();
  const missingAction = mixedPlan();
  missingAction.groups[1]!.action_ids = ["act_missing1"];
  expect(groupClosure(missingAction, ["grp_ready002"])).toBeNull();
  const wrongOwner = mixedPlan();
  wrongOwner.actions[1]!.dependency_group_id = "grp_fixture01";
  expect(groupClosure(wrongOwner, ["grp_ready002"])).toBeNull();
});

test.each(["missing", "cycle"] as const)("a %s dependency makes that group unselectable and cannot invoke Execute", async kind => {
  const plan = mixedPlan();
  if (kind === "missing") plan.groups[1]!.depends_on_group_ids = ["grp_missing1"];
  else plan.groups[0]!.depends_on_group_ids = ["grp_ready002"];
  const onExecute = jest.fn();
  await render(<PlanScreen context={{ ...fixtureContext(), online: true }} plan={plan}
    currentPlan={{ planId: plan.plan_id, planningJobId: plan.planning_job_id }} onExecute={onExecute} />);
  const unavailable = screen.getByRole("button", { name: "Select group grp_ready002" });
  expect(unavailable).toBeDisabled();
  await fireEvent.press(unavailable);
  await fireEvent.press(screen.getByRole("button", { name: "Execute plan" }));
  expect(onExecute).not.toHaveBeenCalled();
});
