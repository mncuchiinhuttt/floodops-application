import { Hono } from "hono";
import type { AppEnv } from "../../shared/index";
import { fail, success } from "../../shared/index";
import { send } from "../../app/index";
import type { SourcesPorts } from "./ports";
import { mapped, resourceId, view } from "./http";
import { page } from "./pagination";
export function createScenarioRouter(ports: SourcesPorts): Hono<AppEnv> {
  const router = new Hono<AppEnv>();
  router.get("/scenarios", c => send(c, success(200, page(c, ports.scenarioCatalog.list().map(item => item.manifest.config.scenario), "public-scenarios"), c.get("requestId")), "listScenarios"));
  router.get("/scenarios/:scenario_id", c => {
    const query = c.req.query();
    if (Object.keys(query).some(key => key !== "version") || !query.version || query.version.length > 80) fail(422, "INVALID_SCHEMA");
    return send(c, success(200, ports.scenarioCatalog.get(resourceId(c, "scenario_id"), query.version).manifest.config, c.get("requestId")), "getScenario");
  });
  for (const [path, name, operation] of [["graph", "source-graph", "getSessionGraph"], ["configuration", "source-config", "getSessionConfiguration"]] as const)
    router.get(`/sessions/:session_id/${path}`, async c => mapped(c, await view(c, name), operation, data => data));
  return router;
}
