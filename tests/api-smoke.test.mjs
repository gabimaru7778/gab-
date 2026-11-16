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
test('registration creates a session and isolates vault records',async()=>{
 const email='smoke-'+Date.now()+'@example.test';
 const r=await fetch(base+'/api/auth/register',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email,name:'Smoke Test',password:'this is a long test password'})});
 assert.equal(r.status,201);
 const cookie=(r.headers.get('set-cookie')||'').split(';')[0];assert.match(cookie,/^low_session=/);
 const me=await fetch(base+'/api/auth/me',{headers:{cookie}});assert.equal((await me.json()).user.email,email);
 const vault=await fetch(base+'/api/vault',{headers:{cookie}});assert.equal(vault.status,200);assert.deepEqual((await vault.json()).records,[]);
 const save=await fetch(base+'/api/vault',{method:'POST',headers:{cookie,'content-type':'application/json'},body:JSON.stringify({title:'test',salt:'salt',iv:'iv',ciphertext:'ciphertext'})});
 assert.equal(save.status,201);
});
test('private vault rejects anonymous requests',async()=>{const r=await fetch(base+'/api/vault');assert.equal(r.status,401);});
