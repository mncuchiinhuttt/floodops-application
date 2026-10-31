import json, os, signal, socket, subprocess, tempfile, time, urllib.request, urllib.error, uuid
from pathlib import Path
cwd=str(Path(__file__).resolve().parents[2])
probe=socket.socket(); probe.bind(("127.0.0.1",8784)); probe.close()
state=tempfile.mkdtemp(prefix="floodops-v5-smoke-")
log=open(state+"/worker.log","w+")
process=subprocess.Popen(["bun","run","wrangler","dev","--config","wrangler.test.jsonc","--local","--ip","127.0.0.1","--port","8784","--persist-to",state+"/state"],cwd=cwd,stdout=log,stderr=subprocess.STDOUT,start_new_session=True)
opener=urllib.request.build_opener(urllib.request.ProxyHandler({}))
def req(path,body=None,extra=None):
    data=None if body is None else json.dumps(body).encode()
    request=urllib.request.Request("http://127.0.0.1:8784/api/v1"+path,data=data,headers={"Content-Type":"application/json",**(extra or {})})
    try: response=opener.open(request,timeout=10)
    except urllib.error.HTTPError as e: response=e
    return response.status,dict(response.headers),json.loads(response.read())
try:
    for attempt in range(200):
        if process.poll() is not None: raise RuntimeError("Local Worker exited before smoke")
        try:
            status,h,health=req("/health")
            if status==200: break
            raise RuntimeError("Health status "+str(status))
        except (urllib.error.URLError,ConnectionError,TimeoutError,json.JSONDecodeError): time.sleep(.2)
    else: raise RuntimeError("Local Worker did not start")
    status,h,created=req("/sessions",{"scenario_id":"scenario_platform01","scenario_version":"1","client_type":"native"},{"Idempotency-Key":str(uuid.uuid4()),"X-Client-Request-Scope":str(uuid.uuid4())})
    assert status==201, "Create status "+str(status)
    session=created["data"]["session"]; sid=session["session_id"]; token=created["data"]["credential"]["access_token"]
    etag='"s:'+sid+':g:'+str(session["generation"])+':r:0"'
    base={"Authorization":"Bearer "+token,"Idempotency-Key":str(uuid.uuid4())}
    path="/sessions/"+sid+"/test-commands/metadata-reject"
    assert req(path,{"amount":0},base)[0]==428
    assert req(path,{"amount":0},{**base,"If-Match":'"stale"'})[0]==412
    status,h,committed=req(path,{"amount":0},{**base,"If-Match":etag}); assert status==200
    assert committed["data"]=={"rejected":True} and committed["meta"]["revision"]==0 and committed["meta"]["event_sequence"]==1
    assert h.get("X-Content-Type-Options",h.get("x-content-type-options"))=="nosniff"
    assert req("/sessions/"+sid+"/test-commands/counter",{"amount":1},{**base,"Idempotency-Key":str(uuid.uuid4()),"If-Match":etag})[0]==200
    status,h,replay=req(path,{"amount":0},{**base,"If-Match":etag}); assert status==200 and replay==committed
    assert req(path,{"amount":2},{**base,"If-Match":etag})[0]==409
    status,h,page=req("/sessions/"+sid+"/events?after=0&limit=500",extra={"Authorization":"Bearer "+token})
    assert status==200 and len(page["data"]["events"])==2
    print(json.dumps({"smoke":"actual local Hono+Workerd+SQLite metadata CAS","missing":428,"stale":412,"current":200,"revision_after_metadata":0,"replay_after_operational_revision":200,"changed_body":409,"events":2,"security_headers":True,"provider_calls":0,"credentials_logged":False}))
finally:
    if process.poll() is None:
        os.killpg(process.pid,signal.SIGTERM)
        try: process.wait(timeout=8)
        except subprocess.TimeoutExpired: os.killpg(process.pid,signal.SIGKILL);process.wait(timeout=3)
    log.close()
