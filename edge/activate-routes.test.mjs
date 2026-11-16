import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

test('a failed home probe restores the original root worker and removes the new content route', () => {
  const directory = mkdtempSync(join(tmpdir(), 'aprenda-rollback-'));
  const moduleUrl = new URL('./activate-routes.mjs', import.meta.url).href;
  const code = `
    const calls=[];
    globalThis.fetch=async(url, options={})=>{
      const path=new URL(url).pathname;
      const method=options.method||'GET';
      calls.push({path,method,body:options.body?JSON.parse(options.body):null});
      let result=true;
      if(path==='/client/v4/zones') result=[{id:'zone'}];
      else if(path==='/client/v4/zones/zone/workers/routes' && method==='GET') result=[{id:'root',pattern:'shelfflow.com.br/',script:'shelfflow-use'}];
      else if(path.startsWith('/client/v4/')) result={id:method==='POST'?'learn':'root'};
      else if(path.startsWith('/aprenda/')) return new Response('Compre junto https://shelfflow.com.br/aprenda/posts/compre-junto-nuvemshop', {headers:{'X-ShelfFlow-Learn':'true'}});
      else return new Response('broken home',{status:503});
      return Response.json({success:true,result});
    };
    try { await import(${JSON.stringify(moduleUrl)}); process.exitCode=1; }
    catch { process.stdout.write(JSON.stringify(calls)); }
  `;
  try {
    const run = spawnSync(process.execPath, ['--input-type=module', '-e', code], { cwd: directory, encoding: 'utf8', env: { ...process.env, CLOUDFLARE_API_TOKEN: 'test-token' }, timeout: 5000 });
    assert.equal(run.status, 0, run.stderr);
    const changes = JSON.parse(run.stdout).filter(call => call.method !== 'GET');
    assert.deepEqual(changes.map(call => call.method), ['POST', 'PUT', 'PUT', 'DELETE']);
    assert.equal(changes[2].body.script, 'shelfflow-use');
    assert.ok(changes[3].path.endsWith('/learn'));
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
