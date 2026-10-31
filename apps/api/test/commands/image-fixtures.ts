import { runInDurableObject } from "cloudflare:test";
import { parseSchema } from "@floodops/contracts";
import type { ImageRecord } from "../../src/shared/platform-types";
import { createSessionRuntimeClient, type SessionRequestContext } from "../../src/shared/session-client";
import { bindings, requestKey, type Fixture } from "../capabilities/helpers";
export const reportId = "report_report01";
export const metadata = createSessionRuntimeClient(bindings).imageReview;
export function context(f: Fixture): SessionRequestContext {
  return { sessionId: f.id, requestId: requestKey(), auth: { token: f.token, transport: f.cookie ? "cookie" : "bearer", origin: f.cookie ? "https://floodops.test" : null, csrf: f.csrf } };
}
export async function queued(f: Fixture) {
  const reply = await metadata.reserve(context(f), reportId, requestKey());
  if (reply.status !== 202 || !reply.effect) throw new Error(`Reserve failed ${reply.status}`);
  return { job: parseSchema("ImageReviewJob", reply.body.data), lease: reply.effect.lease as string };
}
export async function stored(f: Fixture) {
  return runInDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(f.id)), (_instance, state) => {
    const rows = state.storage.sql.exec<{ collection: string; id: string; value: string }>("SELECT collection,id,value FROM documents").toArray();
    return { calls: Number(rows.find(r => r.collection === "runtime" && r.id === "image_calls")?.value ?? 0),
      jobs: rows.filter(r => r.collection === "image_jobs").map(r => JSON.parse(r.value) as ImageRecord) };
  });
}
export async function alterJob(f: Fixture, update: (record: ImageRecord) => void) {
  await runInDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(f.id)), (_instance, state) => {
    const row = state.storage.sql.exec<{ id: string; value: string }>("SELECT id,value FROM documents WHERE collection='image_jobs' LIMIT 1").one();
    const record = JSON.parse(row.value) as ImageRecord; update(record);
    state.storage.sql.exec("UPDATE documents SET value=? WHERE collection='image_jobs' AND id=?", JSON.stringify(record), row.id);
  });
}
export async function seedCalls(f: Fixture, calls: number) {
  await runInDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(f.id)), (_instance, state) => {
    state.storage.sql.exec("INSERT OR REPLACE INTO documents(collection,id,value) VALUES('runtime','image_calls',?)", JSON.stringify(calls));
  });
}
