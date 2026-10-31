import { afterEach, describe, expect, it } from "vitest";
import { reset, runInDurableObject } from "cloudflare:test";
import type { Call, Reply } from "../../src/shared/index";
import type { MediaRecoveryRpc, MediaWriteTicket } from "../../src/features/media/index";
import { sha256, stableId } from "../../src/features/scenario/index";
import { bindings, call, complete, create, headers, key, png, put, reserve, seedAsset } from "./helpers";
import type { Member } from "./helpers";
afterEach(reset);
function stub(member: Member) { return bindings.SESSIONS.get(bindings.SESSIONS.idFromName(member.id)); }
async function prepare(member: Member, uploadId: string) {
  const attemptId = `attempt_${key()}`, requestKey = key();
  const begin: Call = { kind:"command",name:"media-begin",sessionId:member.id,requestId:"request_recovery1",key:requestKey,path:`/api/v1/sessions/${member.id}/media-uploads/${uploadId}/content`,
    auth:{ token:member.token,transport:"bearer",origin:null,csrf:null },payload:{ uploadId,attemptId,kind:"raw",digest:await sha256(png()) } };
  const response = JSON.parse(await (stub(member) as unknown as MediaRecoveryRpc).prepareMediaWrite(JSON.stringify(begin))) as Reply;
  if (response.status !== 200) throw new Error(`Prepare failed ${response.status}`);
  return { ticket:(response.body.data as { ticket:MediaWriteTicket }).ticket,begin,attemptId };
}
async function resetSession(member: Member) {
  const response = await call(`/sessions/${member.id}/resets`,{ method:"POST",headers:headers(member,{ "Content-Type":"application/json","Idempotency-Key":key(),"If-Match":member.etag }),
    body:JSON.stringify({ client_type:"native",confirm:true }) }); expect(response.status).toBe(201);
}
async function alarm(member: Member, force = false) {
  await runInDurableObject(stub(member),async (instance,state) => {
    if (force) state.storage.sql.exec("UPDATE sources_media_recovery SET due=0");
    await instance.alarm();
  });
}
async function count(member: Member) { return runInDurableObject(stub(member),(_instance,state) => state.storage.sql.exec<{ count:number }>("SELECT COUNT(*) AS count FROM sources_media_recovery").one().count); }
describe("durable media failure recovery",() => {
  it("does not grow recovery rows for exact completed upload/completion retries",async () => {
    const owner = await create(), upload = await reserve(owner), uploadKey=key(),completionKey=key();
    expect((await put(owner,upload,png(),uploadKey)).status).toBe(200); expect((await complete(owner,upload,completionKey)).status).toBe(201);
    const original = await count(owner); expect(original).toBe(0);
    for(let index=0;index<10;index++) { expect((await put(owner,upload,png(),uploadKey)).status).toBe(200); expect((await complete(owner,upload,completionKey)).status).toBe(201); }
    expect(await count(owner)).toBe(original);
  });
  it("takes over an expired crashed writer with a unique key and fences its late completion",async () => {
    const owner=await create(),upload=await reserve(owner),a=await prepare(owner,upload.upload_id);
    await runInDurableObject(stub(owner),(_instance,state) => {
      const row=state.storage.sql.exec<{value:string}>("SELECT value FROM documents WHERE collection='runtime' AND id='snapshot'").one();
      const snapshot=JSON.parse(row.value) as {values:{sourcesMedia:{uploads:Record<string,{activeWriter:{deadline:number}}>}}};
      snapshot.values.sourcesMedia.uploads[upload.upload_id]!.activeWriter.deadline=Date.now()-1;
      state.storage.sql.exec("UPDATE documents SET value=? WHERE collection='runtime' AND id='snapshot'",JSON.stringify(snapshot));
    });
    const rpc=stub(owner) as unknown as MediaRecoveryRpc,bReply=JSON.parse(await rpc.prepareMediaWrite(JSON.stringify(a.begin))) as Reply;
    expect(bReply.status).toBe(200); const b=(bReply.body.data as {ticket:MediaWriteTicket}).ticket;
    expect(b.key).not.toBe(a.ticket.key);
    await bindings.REPORT_MEDIA!.put(b.key,png());
    const finishB={...a.begin,name:"media-finish",key:await stableId("finish",[a.attemptId,b.writerId]),payload:{uploadId:upload.upload_id,attemptId:a.attemptId,writerId:b.writerId,kind:"raw",digest:await sha256(png()),media:null}};
    expect((JSON.parse(await rpc.finishMediaWrite(JSON.stringify(finishB),b.recoveryId)) as Reply).status).toBe(200);
    await bindings.REPORT_MEDIA!.put(a.ticket.key,png());
    const finishA={...finishB,key:await stableId("finish",[a.attemptId,a.ticket.writerId]),payload:{...finishB.payload,writerId:a.ticket.writerId}};
    expect((JSON.parse(await rpc.finishMediaWrite(JSON.stringify(finishA),a.ticket.recoveryId)) as Reply).status).toBe(409);
    expect(await bindings.REPORT_MEDIA!.get(a.ticket.key)).toBeNull(); expect(await bindings.REPORT_MEDIA!.get(b.key)).not.toBeNull();
  });
  it("keeps an attached derivative live if recovery-row compaction crashes, then exact replay compacts it",async () => {
    const owner=await create(),upload=await reserve(owner),completionKey=key();
    expect((await put(owner,upload)).status).toBe(200);const completed=await complete(owner,upload,completionKey);expect(completed.status).toBe(201);const body=await completed.json() as {data:{media_id:string}};
    await runInDurableObject(stub(owner),(_instance,state) => {
      const row=state.storage.sql.exec<{value:string}>("SELECT value FROM documents WHERE collection='runtime' AND id='snapshot'").one();
      const snapshot=JSON.parse(row.value) as {meta:{generation:number};absoluteExpiry:number;values:{sourcesMedia:{uploads:Record<string,{derivativeKey:string;completedWriters:{normalized:{id:string;attemptId:string}}}>}}};
      const record=snapshot.values.sourcesMedia.uploads[upload.upload_id]!,writer=record.completedWriters.normalized;
      const ticket={recoveryId:writer.id,writerId:writer.id,attemptId:writer.attemptId,sessionId:owner.id,generation:snapshot.meta.generation,uploadId:upload.upload_id,
        key:record.derivativeKey,writeDeadline:Date.now()+60000,retainUntil:snapshot.absoluteExpiry,kind:"normalized"};
      state.storage.sql.exec("INSERT INTO sources_media_recovery(id,ticket,finished,due,retry) VALUES(?,?,2,?,15000)",writer.id,JSON.stringify(ticket),snapshot.absoluteExpiry);
    });
    await alarm(owner);expect(await count(owner)).toBe(1);
    expect((await call(`/sessions/${owner.id}/media/${body.data.media_id}`,{headers:headers(owner)})).status).toBe(200);
    const replay=await complete(owner,upload,completionKey);expect(replay.status).toBe(201);expect(await replay.json()).toEqual(body);expect(await count(owner)).toBe(0);
  });
  it("compensates a late R2 write after actual Reset and retries a failed delete durably",async () => {
    const owner=await create(),upload=await reserve(owner); await seedAsset();
    const {ticket,begin,attemptId}=await prepare(owner,upload.upload_id);
    await resetSession(owner); await alarm(owner);
    await bindings.REPORT_MEDIA!.put(ticket.key,png());
    await runInDurableObject(stub(owner),instance => (instance as unknown as {setDeleteFault(value:boolean):void}).setDeleteFault(true));
    const finish = { ...begin,key:key(),name:"media-finish",payload:{uploadId:upload.upload_id,attemptId,writerId:ticket.writerId,kind:"raw",digest:await sha256(png()),media:null} };
    const response=JSON.parse(await (stub(owner) as unknown as MediaRecoveryRpc).finishMediaWrite(JSON.stringify(finish),ticket.recoveryId)) as Reply;
    expect(response.status).toBe(410); expect(await bindings.REPORT_MEDIA!.get(ticket.key)).not.toBeNull(); expect(await count(owner)).toBe(1);
    await runInDurableObject(stub(owner),instance => (instance as unknown as {setDeleteFault(value:boolean):void}).setDeleteFault(false));
    await alarm(owner,true); expect(await bindings.REPORT_MEDIA!.get(ticket.key)).toBeNull(); expect(await count(owner)).toBe(0);
    expect(await bindings.SCENARIO_ASSETS!.get("assets/asset_synthetic01")).not.toBeNull();
  });
  it("retains a crash tombstone after expiry cleanup so repeated late writes cannot recreate a permanent orphan",async () => {
    const owner=await create(),upload=await reserve(owner),{ticket}=await prepare(owner,upload.upload_id);
    await resetSession(owner); await alarm(owner);
    for(let index=0;index<2;index++) {
      await bindings.REPORT_MEDIA!.put(ticket.key,png()); await alarm(owner,true); expect(await bindings.REPORT_MEDIA!.get(ticket.key)).toBeNull();
      expect(await count(owner)).toBe(1);
    }
  });
});
