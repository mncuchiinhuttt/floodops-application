import { Hono } from "hono";
import type { Knowledge } from "@floodops/contracts";
import type { AppEnv } from "../../shared/index";
import { mapped, page, view } from "../scenario/index";
export function createKnowledgeRouter(): Hono<AppEnv> {
  const router = new Hono<AppEnv>();
  router.get("/sessions/:session_id/knowledge", async c => mapped(c, await view(c, "source-knowledge"), "getKnowledge", data => data));
  router.get("/sessions/:session_id/observations", async c => {
    const reply = await view(c, "source-observations");
    return mapped(c, reply, "listObservations", data => page(c, (data as Knowledge).observations,
      JSON.stringify([reply.body.meta.session_id, reply.body.meta.generation, "observations"])));
  });
  router.get("/sessions/:session_id/restrictions", async c => {
    const reply = await view(c, "source-restrictions");
    return mapped(c, reply, "listRestrictions", data => page(c, (data as Knowledge).restrictions,
      JSON.stringify([reply.body.meta.session_id, reply.body.meta.generation, "restrictions"])));
  });
  return router;
}
