const ORIGIN = 'https://shelfflow-blog.pages.dev';
const PRIMARY = 'https://shelfflow.com.br/aprenda';

export function primaryUrl(value) {
  if (value.startsWith('/aprenda/') || value === '/aprenda') return value;
  if (value.startsWith('/') && !value.startsWith('//')) return '/aprenda' + value;
  return value.replace(/^https:\/\/(?:blog\.shelfflow\.com\.br|shelfflow-blog\.pages\.dev)(?=\/|$)/, PRIMARY);
}

export function rewriteContent(body, type) {
  let text = body.replaceAll('https://blog.shelfflow.com.br', PRIMARY)
    .replaceAll(ORIGIN, PRIMARY);
  if (type.includes('text/html')) {
    text = text.replace(/\b(href|src|action|poster|data-backurl)=(['"])(\/[^'"]*)\2/g,
      (_, attr, quote, value) => `${attr}=${quote}${primaryUrl(value)}${quote}`);
  }
  if (type.includes('text/css') || type.includes('text/html')) {
    text = text.replace(/url\(\s*(['"]?)(\/[^)'"\s]+)\1\s*\)/g,
      (_, quote, value) => `url(${quote}${primaryUrl(value)}${quote})`);
  }
  // Pagefind is loaded dynamically by the existing search page.
  if (type.includes('javascript') || type.includes('text/html')) {
    text = text.replaceAll('"/pagefind/', '"/aprenda/pagefind/')
      .replaceAll("'/pagefind/", "'/aprenda/pagefind/")
      .replace(/setItem\((['"])backUrl\1,\s*(['"])\/\2\)/g, 'setItem("backUrl","/aprenda/")');
  }
  return text;
}

export function addLearnNav(body) {
  return body.replace(/(<nav\b[^>]*class=['"][^'"]*\bnav-links\b[^'"]*['"][^>]*>)([\s\S]*?)(<\/nav>)/,
    (_, opening, links, closing) => opening + links +
      (/href=['"](?:https:\/\/shelfflow\.com\.br)?\/aprenda(?:\/|['"])/.test(links)
        ? '' : '<a href="/aprenda/">Aprenda</a>') + closing);
}

function transformed(response, body) {
  const headers = new Headers(response.headers);
  for (const name of ['Content-Length', 'Content-Encoding', 'ETag', 'Last-Modified', 'Set-Cookie']) headers.delete(name);
  headers.set('X-ShelfFlow-Learn', 'true');
  return new Response(body, { status: response.status, statusText: response.statusText, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/') {
      const response = await env.MARKETING.fetch(request);
      if (request.method !== 'GET' || !response.headers.get('Content-Type')?.includes('text/html')) return response;
      return transformed(response, addLearnNav(await response.text()));
    }
    if (url.pathname === '/aprenda') return Response.redirect(url.origin + '/aprenda/' + url.search, 301);
    if (!url.pathname.startsWith('/aprenda/')) return fetch(request);
    if (!['GET', 'HEAD'].includes(request.method)) return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    const upstream = new URL(ORIGIN + url.pathname.slice('/aprenda'.length) + url.search);
    try {
      // Public articles must not forward credentials from the application domain.
      const response = await fetch(upstream, { method: request.method, redirect: 'manual', headers: { Accept: request.headers.get('Accept') || '*/*' } });
      if (response.headers.has('Location')) {
        const headers = new Headers(response.headers);
        headers.delete('Set-Cookie');
        const destination = new URL(headers.get('Location'), upstream);
        headers.set('Location', primaryUrl(destination.href));
        return new Response(null, { status: response.status, headers });
      }
      const type = response.headers.get('Content-Type') || '';
      if (request.method === 'HEAD') return transformed(response, null);
      if (/text\/|javascript|json|xml/.test(type)) return transformed(response, rewriteContent(await response.text(), type));
      const headers = new Headers(response.headers);
      headers.delete('Set-Cookie');
      headers.set('X-ShelfFlow-Learn', 'true');
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
    } catch {
      return new Response('Conteúdo temporariamente indisponível.', { status: 502, headers: { 'Cache-Control': 'no-store' } });
    }
  },
};
