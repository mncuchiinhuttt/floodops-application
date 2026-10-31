import { afterEach,expect,it } from "vitest";
import { reset } from "cloudflare:test";
import { parseSchema } from "@floodops/contracts";
import { createNormalizedImagePort } from "../../src/features/media/index";
import { bindings,call,create,headers,join,key,ready } from "./helpers";
afterEach(reset);
it("reauthorizes normalized media after actual Reset during the R2 read",async () => {
  const owner=await create(),contributor=await join(owner,"contributor","contributor_functional1"),{media}=await ready(contributor);
  const submission=await call(`/sessions/${owner.id}/reports`,{method:"POST",headers:headers(contributor,{"Content-Type":"application/json","Idempotency-Key":key(),"If-Match":contributor.etag}),
    body:JSON.stringify({kind:"citizen",media_id:media.media_id,fixture_photo_id:null,segment_id:"seg_edge27",coordinate:[106.701,10.7705],
      captured_at:"2026-10-31T00:00:00Z",captured_sim_minute:0,vehicle_types:["motorbike"],description:"Synthetic race evidence"})});
  expect(submission.status).toBe(201); const report=parseSchema("ReportResponse",await submission.json()).data!;
  let release!:()=>void,started!:()=>void;const gate=new Promise<void>(resolve=>{release=resolve;}),entered=new Promise<void>(resolve=>{started=resolve;});
  const bucket=bindings.REPORT_MEDIA!,paused=new Proxy(bucket,{get(target,property){
    if(property==="get")return async(...args:Parameters<R2Bucket["get"]>)=>{const object=await target.get(...args);started();await gate;return object;};
    const value=Reflect.get(target,property);return typeof value==="function"?value.bind(target):value;
  }});
  const port=createNormalizedImagePort({...bindings,REPORT_MEDIA:paused});
  const pending=port.read({sessionId:owner.id,requestId:"request_portrace1",auth:{token:owner.token,transport:"bearer",origin:null,csrf:null}},report.report_id);
  const refused=expect(pending).rejects.toMatchObject({status:410});await entered;
  const identity=await call(`/sessions/${owner.id}/identity`,{headers:headers(owner)});
  const resetResponse=await call(`/sessions/${owner.id}/resets`,{method:"POST",headers:headers(owner,{"Content-Type":"application/json","Idempotency-Key":key(),"If-Match":identity.headers.get("ETag")!}),body:JSON.stringify({client_type:"native",confirm:true})});
  expect(resetResponse.status).toBe(201);release();await refused;
});
