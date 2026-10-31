import { Hono } from "hono";
import type { Source, InputEvent } from "@floodops/contracts";
import { parseSchema } from "@floodops/contracts";
import type { AppEnv } from "../../shared/index";
import { fail } from "../../shared/index";
import { invoke, jsonBody, runtimeCall, send } from "../../app/index";
import { mapped, page, requestKey, resourceId, successful, view } from "../scenario/index";
export function createSourcesRouter(): Hono<AppEnv> {
  const router = new Hono<AppEnv>();
  router.get("/sessions/:session_id/sources", async c => {
    const reply = await view(c, "source-list");
    return mapped(c, reply, "listSources", data => page(c, data as Source[], JSON.stringify([reply.body.meta.session_id, reply.body.meta.generation, "sources"])));
  });
  router.get("/sessions/:session_id/sources/:source_id", async c => mapped(c, await view(c, "source-list"), "getSource", data => {
    const source = (data as Source[]).find(item => item.source_id === resourceId(c, "source_id"));
    if (!source) fail(404, "NOT_FOUND"); return source;
  }));
  router.get("/sessions/:session_id/source-events", async c => {
    const reply = await view(c, "source-events");
    return mapped(c, reply, "listSourceEvents", data => page(c, data as InputEvent[], JSON.stringify([reply.body.meta.session_id, reply.body.meta.generation, "source-events"])));
  });
  for (const [path, command, operation] of [["source-events", "source-replay", "replaySourceEvent"], ["restrictions", "source-restriction", "applyRestrictionFixture"]] as const)
    router.post(`/sessions/:session_id/${path}`, async c => send(c, successful(await invoke(c, runtimeCall(c, "command", {
      name: command, key: requestKey(c), payload: parseSchema("ReplayInput", await jsonBody(c.req.raw)) })), 201), operation));
  return router;
}
