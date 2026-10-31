import { Hono } from "hono";
import { parseOperationInput, parseSchema } from "@floodops/contracts";
import type { Execution, Incident, Notification, Plan, PlanningJob, Route } from "@floodops/contracts";
import { createSessionRuntimeClient, fail, invoke, jsonBody, runtimeCall, send } from "../../shared/index";
import type { AppContext, AppEnv, Reply } from "../../shared/index";
import type { PlanningReservation } from "./drive-planning";
import { PLAN_START, PLAN_CANCEL, PLAN_DECIDE, PLAN_DRY_RUN, PLAN_EXECUTE, PLANNING_VIEW, OPERATIONS_VIEW, INCIDENT_VIEW, IMPACT_VIEW } from "./runtime-types";
import { ROUTES_VIEW } from "./views";
import { INCIDENT_TRIGGER } from "../incidents/runtime";
async function view(c: AppContext, name = PLANNING_VIEW): Promise<Reply> { return invoke(c, runtimeCall(c, "view", { name })); }
function dataReply(reply: Reply, data: unknown, status = reply.status): Reply { return { ...reply, status, body: { ...reply.body, data } }; }
function page<T>(c: AppContext, reply: Reply, items: T[], resource: "plans" | "incidents" | "notifications", id: (item: T) => string) {
  const op = resource === "plans" ? "listPlans" : resource === "incidents" ? "listIncidents" : "listNotificationPreviews";
  const query = { ...(c.req.query("cursor") ? { cursor: c.req.query("cursor") } : {}),
    ...(c.req.query("limit") ? { limit: Number(c.req.query("limit")) } : {}) };
  const input = parseOperationInput(op, { path: { session_id: c.req.param("session_id") }, query });
  let after = ""; const m = reply.body.meta;
  if (input.query?.cursor) {
    try {
      const cursor = JSON.parse(atob(input.query.cursor)) as string[];
      if (cursor.length !== 4 || cursor[0] !== m.session_id || cursor[1] !== String(m.generation) || cursor[2] !== resource) fail(422, "INVALID_SCHEMA");
      after = cursor[3]!;
    } catch { fail(422, "INVALID_SCHEMA"); }
  }
  const ordered = [...items].sort((a, b) => id(a) < id(b) ? -1 : id(a) > id(b) ? 1 : 0).filter(i => id(i) > after);
  const selected = ordered.slice(0, input.query?.limit ?? 50), more = selected.length < ordered.length;
  return dataReply(reply, { items: selected, page: { has_more: more, next_cursor: more
    ? btoa(JSON.stringify([m.session_id, String(m.generation), resource, id(selected.at(-1)!)])) : null } });
}
export function createPlanningRouter(): Hono<AppEnv> {
  const router = new Hono<AppEnv>();
  router.get("/sessions/:session_id/operations", async c => send(c, await view(c, OPERATIONS_VIEW), "getOperations"));
  router.get("/sessions/:session_id/impact", async c => send(c, await view(c, IMPACT_VIEW), "getImpact"));
  router.get("/sessions/:session_id/incidents", async c => {
    const r = await view(c, INCIDENT_VIEW); return send(c, r.status === 200 ? page(c, r, r.body.data as Incident[], "incidents", i => i.incident_id) : r, r.status === 200 ? "listIncidents" : undefined);
  });
  router.post("/sessions/:session_id/incidents", async c => {
    const r = await invoke(c, runtimeCall(c, "command", { name: INCIDENT_TRIGGER, payload: parseSchema("TriggerIncidentInput", await jsonBody(c.req.raw)) }));
    return send(c, r.status === 200 ? { ...r, status: 201 } : r, r.status === 200 ? "triggerIncident" : undefined);
  });
  router.post("/sessions/:session_id/planning-jobs", async c => {
    const call = runtimeCall(c, "command", { name: PLAN_START, payload: { input: parseSchema("PlanningJobInput", await jsonBody(c.req.raw)), etag: c.req.header("If-Match") ?? null } });
    const r = await invoke(c, call);
    if (r.status !== 200) return send(c, r);
    await createSessionRuntimeClient(c.env).startDriver("planning", call, r);
    return send(c, dataReply(r, (r.body.data as PlanningReservation).job, 202), "createPlanningJob");
  });
  router.get("/sessions/:session_id/planning-jobs/:job_id", async c => {
    const id = parseSchema("Id", c.req.param("job_id")), r = await view(c); if (r.status !== 200) return send(c, r);
    const job = (r.body.data as { jobs: PlanningJob[] }).jobs.find(j => j.job_id === id); if (!job) fail(404, "NOT_FOUND");
    return send(c, dataReply(r, job), "getPlanningJob");
  });
  router.post("/sessions/:session_id/planning-jobs/:job_id/cancellations", async c => {
    if (c.req.raw.body) fail(422, "INVALID_SCHEMA");
    return send(c, await invoke(c, runtimeCall(c, "command", { name: PLAN_CANCEL, payload: parseSchema("Id", c.req.param("job_id")) })), "cancelPlanningJob");
  });
  router.get("/sessions/:session_id/plans", async c => {
    const r = await view(c); if (r.status !== 200) return send(c, r);
    return send(c, page(c, r, (r.body.data as { plans: Plan[] }).plans, "plans", p => p.plan_id), "listPlans");
  });
  router.get("/sessions/:session_id/plans/:plan_id", async c => {
    const id = parseSchema("Id", c.req.param("plan_id")), r = await view(c); if (r.status !== 200) return send(c, r);
    const plan = (r.body.data as { plans: Plan[] }).plans.find(p => p.plan_id === id); if (!plan) fail(404, "NOT_FOUND");
    return send(c, dataReply(r, plan), "getPlan");
  });
  for (const [path, name, schema, op] of [["decisions", PLAN_DECIDE, "PlanDecisionInput", "decidePlanActions"],
    ["dry-runs", PLAN_DRY_RUN, "CandidateInput", "dryRunPlan"], ["executions", PLAN_EXECUTE, "CandidateInput", "executePlan"]] as const) {
    router.post("/sessions/:session_id/plans/:plan_id/" + path, async c => {
      const r = await invoke(c, runtimeCall(c, "command", { name, payload: { etag: c.req.header("If-Match") ?? null,
        input: { plan_id: parseSchema("Id", c.req.param("plan_id")), request: parseSchema(schema, await jsonBody(c.req.raw)) } } }));
      return send(c, name === PLAN_EXECUTE && r.status === 200 ? { ...r, status: 201 } : r, op);
    });
  }
  router.get("/sessions/:session_id/routes/:route_id", async c => {
    const id = parseSchema("Id", c.req.param("route_id")), r = await view(c, ROUTES_VIEW); if (r.status !== 200) return send(c, r);
    const route = (r.body.data as Route[]).find(r => r.route_id === id); if (!route) fail(404, "NOT_FOUND");
    return send(c, dataReply(r, route), "getRoute");
  });
  router.get("/sessions/:session_id/executions/:execution_id", async c => {
    const id = parseSchema("Id", c.req.param("execution_id")), r = await view(c); if (r.status !== 200) return send(c, r);
    const execution = (r.body.data as { executions: Execution[] }).executions.find(e => e.execution_id === id);
    if (!execution) fail(404, "NOT_FOUND"); return send(c, dataReply(r, execution), "getExecution");
  });
  router.get("/sessions/:session_id/notifications", async c => {
    const r = await view(c); if (r.status !== 200) return send(c, r);
    return send(c, page(c, r, (r.body.data as { notifications: Notification[] }).notifications, "notifications", n => n.notification_id), "listNotificationPreviews");
  });
  return router;
}
