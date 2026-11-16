import { writeFileSync } from 'node:fs';

const token = process.env.CLOUDFLARE_API_TOKEN;
if (!token) throw new Error('CLOUDFLARE_API_TOKEN is required');
const api = 'https://api.cloudflare.com/client/v4';
async function call(path, method = 'GET', body) {
  const response = await fetch(api + path, {
    method, headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(15000),
  });
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(`Cloudflare ${method} ${path}: ${data.errors?.map(error => error.message).join('; ') || response.status}`);
  return data.result;
}
const zones = await call('/zones?name=shelfflow.com.br');
if (zones.length !== 1) throw new Error('Expected one ShelfFlow zone');
const routePath = '/zones/' + zones[0].id + '/workers/routes';
const routes = await call(routePath);
const patterns = ['shelfflow.com.br/aprenda*', 'shelfflow.com.br/'];
const backup = routes.filter(route => patterns.includes(route.pattern));
writeFileSync('edge-route-backup.json', JSON.stringify(backup, null, 2) + '\n');
const changes = [];
async function assign(pattern) {
  const previous = routes.find(route => route.pattern === pattern);
  if (previous?.script === 'shelfflow-learn') return;
  const current = await call(routePath + (previous ? '/' + previous.id : ''), previous ? 'PUT' : 'POST', { pattern, script: 'shelfflow-learn' });
  changes.push({ previous, id: current.id });
}
async function probe(path, validate) {
  const response = await fetch('https://shelfflow.com.br' + path, { redirect: 'follow', signal: AbortSignal.timeout(20000), headers: { 'Cache-Control': 'no-cache' } });
  if (!response.ok || !validate(response, await response.text())) throw new Error('Primary URL validation failed: ' + path);
}
try {
  await assign(patterns[0]);
  await probe('/aprenda/posts/compre-junto-nuvemshop/', (response, body) => response.headers.get('X-ShelfFlow-Learn') === 'true' && body.includes('shelfflow.com.br/aprenda/posts/compre-junto-nuvemshop') && body.includes('Compre junto'));
  await assign(patterns[1]);
  await probe('/', (_response, body) => body.includes('href="/aprenda/"') && body.includes('sf-meta-proof'));
  process.stdout.write('Primary Aprenda page, canonical URL, main navigation and Meta badge verified.\n');
} catch (error) {
  for (const change of changes.reverse()) {
    if (change.previous) await call(routePath + '/' + change.id, 'PUT', { pattern: change.previous.pattern, script: change.previous.script ?? null });
    else await call(routePath + '/' + change.id, 'DELETE');
  }
  throw error;
}
