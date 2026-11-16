import assert from 'node:assert/strict';
import test from 'node:test';
import worker, { primaryUrl, rewriteContent, addLearnNav } from './learn-worker.mjs';
import { onRequest } from './redirect-middleware.js';

test('links, canonical, fonts, XML and search use the primary path', () => {
  assert.equal(primaryUrl('/posts/example/'), '/aprenda/posts/example/');
  assert.equal(primaryUrl('//cdn.example/a'), '//cdn.example/a');
  assert.equal(primaryUrl('/aprenda/'), '/aprenda/');
  const html = '<a href="/posts/a/">A</a><a href="#b">B</a><img src="/editorial/a.svg"><link rel="canonical" href="https://blog.shelfflow.com.br/posts/a/"><a href="https://shelfflow.com.br/use">Use</a>';
  const output = rewriteContent(html, 'text/html');
  assert.ok(output.includes('href="/aprenda/posts/a/"'));
  assert.ok(output.includes('src="/aprenda/editorial/a.svg"'));
  assert.ok(output.includes('href="https://shelfflow.com.br/aprenda/posts/a/"'));
  assert.ok(output.includes('href="#b"'));
  assert.ok(output.includes('href="https://shelfflow.com.br/use"'));
  assert.equal(rewriteContent('@font-face{src:url(/_astro/font.woff2)}', 'text/css'), '@font-face{src:url(/aprenda/_astro/font.woff2)}');
  assert.equal(rewriteContent('import("/pagefind/pagefind.js")', 'application/javascript'), 'import("/aprenda/pagefind/pagefind.js")');
  assert.equal(rewriteContent('<loc>https://blog.shelfflow.com.br/posts/a/</loc>', 'application/xml'), '<loc>https://shelfflow.com.br/aprenda/posts/a/</loc>');
});

test('home delegates to the existing marketing worker and keeps one Aprenda link', async () => {
  const html = '<nav class="nav-links"><a href="#planos">Planos</a></nav><section class="sf-meta-proof">Meta</section>';
  assert.equal(addLearnNav(addLearnNav(html)), addLearnNav(html));
  const response = await worker.fetch(new Request('https://shelfflow.com.br/'), { MARKETING: { fetch: async () => new Response(html, { headers: { 'Content-Type': 'text/html', 'Content-Length': '999' } }) } });
  const body = await response.text();
  assert.ok(body.includes('href="/aprenda/"'));
  assert.ok(body.includes('sf-meta-proof'));
  assert.equal(response.headers.has('Content-Length'), false);
});

test('old public addresses redirect only after the primary route is healthy', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response('', { headers: { 'X-ShelfFlow-Learn': 'true' } });
    const response = await onRequest({ request: new Request('https://blog.shelfflow.com.br/posts/a/?utm_source=facebook') });
    assert.equal(response.status, 301);
    assert.equal(response.headers.get('Location'), 'https://shelfflow.com.br/aprenda/posts/a/?utm_source=facebook');
    assert.equal(await onRequest({ request: new Request('https://shelfflow-blog.pages.dev/posts/a/'), next: () => 'origin' }), 'origin');
    globalThis.fetch = async () => new Response('', { status: 404 });
    assert.equal(await onRequest({ request: new Request('https://blog.shelfflow.com.br/posts/a/'), next: () => 'origin' }), 'origin');
  } finally { globalThis.fetch = originalFetch; }
});

test('public proxy does not forward application cookies or authorization', async () => {
  const originalFetch = globalThis.fetch;
  let options;
  globalThis.fetch = async (_url, init) => { options = init; return new Response('<a href="/">Home</a>', { headers: { 'Content-Type': 'text/html', 'Set-Cookie': 'session=unexpected' } }); };
  try {
    const response = await worker.fetch(new Request('https://shelfflow.com.br/aprenda/posts/a/', { headers: { Cookie: 'private=1', Authorization: 'Bearer private' } }), {});
    assert.deepEqual(Object.keys(options.headers), ['Accept']);
    assert.equal(response.headers.has('Set-Cookie'), false);
    assert.ok((await response.text()).includes('/aprenda/'));
  } finally { globalThis.fetch = originalFetch; }
});
