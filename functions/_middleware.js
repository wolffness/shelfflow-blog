export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (url.hostname === 'blog.shelfflow.com.br' && !/^\/(?:admin|api\/auth)(?:\/|$)/.test(url.pathname)) {
    // Keep old addresses working until the primary route is actually healthy.
    try {
      const primary = await fetch('https://shelfflow.com.br/aprenda/', { method: 'HEAD', redirect: 'manual', signal: AbortSignal.timeout(4000) });
      if (primary.ok && primary.headers.get('X-ShelfFlow-Learn') === 'true') {
        return Response.redirect('https://shelfflow.com.br/aprenda' + url.pathname + url.search, 301);
      }
    } catch { /* The current blog remains available during migration or rollback. */ }
  }
  return context.next();
}
