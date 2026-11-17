import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const port=34671,base='http://127.0.0.1:'+port,dir=mkdtempSync(join(tmpdir(),'low-api-test-'));
let child,output='';
before(async()=>{
 child=spawn(process.execPath,['--import','tsx','server/index.ts'],{cwd:process.cwd(),env:{...process.env,PORT:String(port),NODE_ENV:'test',LOW_DATA_DIR:dir},stdio:['ignore','pipe','pipe']});
 child.stdout.on('data',b=>output+=b.toString());child.stderr.on('data',b=>output+=b.toString());
 let ready=false;
 for(let i=0;i<60;i++){try{const r=await fetch(base+'/api/health');if(r.ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}
 assert.equal(ready,true,'API server should become healthy. Process output: '+output);
});
after(()=>{child?.kill('SIGTERM');rmSync(dir,{recursive:true,force:true});});
test('health endpoint is available',async()=>{const r=await fetch(base+'/api/health');assert.equal(r.status,200);assert.equal((await r.json()).app,'LOW ONE');});
test('registration rejects passwords longer than the supported bound',async()=>{const r=await fetch(base+'/api/auth/register',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:'long-'+Date.now()+'@example.test',name:'Long Password',password:'x'.repeat(201)})});assert.equal(r.status,400);});
test('registration creates a session and isolates vault records',async()=>{
 const email='smoke-'+Date.now()+'@example.test';
 const r=await fetch(base+'/api/auth/register',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email,name:'Smoke Test',password:'this is a long test password'})});
 assert.equal(r.status,201);
 const cookie=(r.headers.get('set-cookie')||'').split(';')[0];assert.match(cookie,/^low_session=/);
 const me=await fetch(base+'/api/auth/me',{headers:{cookie}});assert.equal((await me.json()).user.email,email);
 const vault=await fetch(base+'/api/vault',{headers:{cookie}});assert.equal(vault.status,200);assert.deepEqual((await vault.json()).records,[]);
 const save=await fetch(base+'/api/vault',{method:'POST',headers:{cookie,'content-type':'application/json'},body:JSON.stringify({title:'test',salt:'AAAAAAAAAAAAAAAAAAAAAA==',iv:'AAAAAAAAAAAAAAAA',ciphertext:'Y2lwaGVydGV4dA=='})});
 assert.equal(save.status,201);
 const saved=await save.json();assert.ok(saved.record?.id);assert.equal(saved.record.title,'test');
 const listed=await fetch(base+'/api/vault',{headers:{cookie}});const records=(await listed.json()).records;
 assert.equal(records.length,1);assert.equal(records[0].id,saved.record.id);assert.equal(records[0].ciphertext,'Y2lwaGVydGV4dA==');
 const other=await fetch(base+'/api/auth/register',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:'other-'+Date.now()+'@example.test',name:'Other User',password:'another long test password'})});
 const otherCookie=(other.headers.get('set-cookie')||'').split(';')[0];const otherVault=await fetch(base+'/api/vault',{headers:{cookie:otherCookie}});
 assert.deepEqual((await otherVault.json()).records,[]);
});
test('API keys authenticate, expose models and can be revoked',async()=>{
 const email='keys-'+Date.now()+'@example.test';
 const login=await fetch(base+'/api/auth/register',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email,name:'Key Test',password:'this is another long password'})});
 const cookie=(login.headers.get('set-cookie')||'').split(';')[0];
 const created=await fetch(base+'/api/keys',{method:'POST',headers:{cookie,'content-type':'application/json'},body:JSON.stringify({label:'test agent'})});
 assert.equal(created.status,201);const value=(await created.json()).apiKey;assert.match(value,/^low_/);
 const models=await fetch(base+'/v1/models',{headers:{authorization:'Bearer '+value}});assert.equal(models.status,200);assert.equal((await models.json()).data[0].id,'low-core');
 const completion=await fetch(base+'/v1/chat/completions',{method:'POST',headers:{authorization:'Bearer '+value,'content-type':'application/json'},body:JSON.stringify({model:'low-core',messages:[{role:'user',content:'Hola'}]})});assert.equal(completion.status,503);
 const denied=await fetch(base+'/v1/models',{headers:{authorization:'Bearer low_invalid'}});assert.equal(denied.status,401);
 const listed=await fetch(base+'/api/keys',{headers:{cookie}});const keyId=(await listed.json()).keys[0].id;
 const second=await fetch(base+'/api/auth/register',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:'other-key-'+Date.now()+'@example.test',name:'Other Key User',password:'this is a long test password'})});const otherCookie=(second.headers.get('set-cookie')||'').split(';')[0];
 const forbidden=await fetch(base+'/api/keys/'+keyId,{method:'DELETE',headers:{cookie:otherCookie}});assert.equal(forbidden.status,404);
 const revoked=await fetch(base+'/api/keys/'+keyId,{method:'DELETE',headers:{cookie}});assert.equal(revoked.status,200);
 const after=await fetch(base+'/v1/models',{headers:{authorization:'Bearer '+value}});assert.equal(after.status,401);
});
test('media status rejects unknown or unauthenticated job tokens',async()=>{const r=await fetch(base+'/api/guest/media/not-a-job',{headers:{'x-low-job-token':'bad'}});assert.equal(r.status,404);});
test('creator requires an account before using paid provider credentials',async()=>{const r=await fetch(base+'/api/guest/media',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({prompt:'A paper crane in a sunlit room',kind:'image'})});assert.equal(r.status,401);});
test('creator reports a clear configuration error without ComfyUI workflows',async()=>{const login=await fetch(base+'/api/auth/register',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:'creator-'+Date.now()+'@example.test',name:'Creator Test',password:'this is a long test password'})});const cookie=(login.headers.get('set-cookie')||'').split(';')[0];const r=await fetch(base+'/api/guest/media',{method:'POST',headers:{cookie,'content-type':'application/json'},body:JSON.stringify({prompt:'A paper crane in a sunlit room',kind:'image'})});assert.equal(r.status,503);assert.match((await r.json()).error,/LOW_COMFYUI_VIDEO_WORKFLOW|LOW_COMFYUI_IMAGE_WORKFLOW/);});
test('research reports missing provider configuration and enforces a persistent rate limit',async()=>{for(let i=0;i<8;i++){const r=await fetch(base+'/api/guest/research',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({query:'OWASP Top 10'})});assert.equal(r.status,503);assert.match((await r.json()).error,/TAVILY_API_KEY/);}const limited=await fetch(base+'/api/guest/research',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({query:'OWASP Top 10'})});assert.equal(limited.status,429);});
test('vault rejects malformed encryption metadata',async()=>{const login=await fetch(base+'/api/auth/register',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:'bad-vault-'+Date.now()+'@example.test',name:'Vault Test',password:'this is a long test password'})});const cookie=(login.headers.get('set-cookie')||'').split(';')[0];const bad=await fetch(base+'/api/vault',{method:'POST',headers:{cookie,'content-type':'application/json'},body:JSON.stringify({title:'bad',salt:'bad',iv:'bad',ciphertext:'bad'})});assert.equal(bad.status,400);});
test('defensive review requires an authenticated account',async()=>{const r=await fetch(base+'/api/cyber/review',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({projectName:'LOW',scope:'My own application',authorizationConfirmed:true})});assert.equal(r.status,401);});
test('defensive review reports missing model provider without claiming success',async()=>{const login=await fetch(base+'/api/auth/register',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:'shield-'+Date.now()+'@example.test',name:'Shield Test',password:'this is a long test password'})});const cookie=(login.headers.get('set-cookie')||'').split(';')[0];const r=await fetch(base+'/api/cyber/review',{method:'POST',headers:{cookie,'content-type':'application/json'},body:JSON.stringify({projectName:'LOW',scope:'My own application',context:'Defensive smoke test',objective:'Review controls',authorizationConfirmed:true})});assert.equal(r.status,503);});
test('logout invalidates the server session',async()=>{const login=await fetch(base+'/api/auth/register',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:'logout-'+Date.now()+'@example.test',name:'Logout Test',password:'this is a long test password'})});const cookie=(login.headers.get('set-cookie')||'').split(';')[0];const logout=await fetch(base+'/api/auth/logout',{method:'POST',headers:{cookie,'content-type':'application/json'},body:'{}'});assert.equal(logout.status,200);const me=await fetch(base+'/api/auth/me',{headers:{cookie}});assert.equal((await me.json()).user,null);});
test('private vault rejects anonymous requests',async()=>{const r=await fetch(base+'/api/vault');assert.equal(r.status,401);});
