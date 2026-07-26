import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { resolveTenantFromHost } from '@/lib/server/tenantFromHost';

const APP_MODE = process.env.NEXT_PUBLIC_APP_MODE || 'tenant';

const MCC_ROUTES = ['/admin/mcc'];
const TENANT_ONLY_ROUTES = [
  '/pos', '/kds', '/operations', '/reservations',
  '/bar', '/kitchen', '/floor-plan', '/registre', '/groups',
  '/staff', '/inventory', '/haccp', '/finance', '/crm', '/marketing', '/analytics',
];

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'restaurantos.app';

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.pathname;

  // --- APP_MODE route gating ---
  // The MCC console is a SEPARATE deployment (APP_MODE=mcc), never part of the
  // tenant application. In tenant mode the MCC routes do not exist — this must hold
  // in dev and prod alike. To work on the MCC locally, run the dedicated `dev:mcc`
  // server (NEXT_PUBLIC_APP_MODE=mcc), which serves only MCC routes and 404s the
  // tenant app.
  if (APP_MODE === 'tenant') {
    if (MCC_ROUTES.some(r => url.startsWith(r))) {
      return new NextResponse(null, { status: 404 });
    }
  }
  if (APP_MODE === 'mcc') {
    if (TENANT_ONLY_ROUTES.some(r => url.startsWith(r))) {
      return new NextResponse(null, { status: 404 });
    }
  }

  // --- Admin API auth gate ---
  if (url.startsWith('/api/admin/')) {
    if (url.startsWith('/api/admin/git/') && process.env.NODE_ENV === 'production') {
      return new NextResponse(null, { status: 404 });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new NextResponse(null, { status: 404 });
    }
  }

  // --- Custom domain → slug rewrite (res-arch-3) ---
  // bistro.com/reservations → /bistroduport/reservations
  // Only runs when the hostname is NOT a subdomain of the app domain.
  const host = (request.headers.get('host') ?? '').split(':')[0].toLowerCase();
  const isAppSubdomain = host === APP_DOMAIN || host.endsWith(`.${APP_DOMAIN}`) || host === 'localhost';
  if (!isAppSubdomain && !url.startsWith('/api/resolve-domain')) {
    try {
      const resolveUrl = new URL(`/api/resolve-domain?domain=${encodeURIComponent(host)}`, request.url);
      const res = await fetch(resolveUrl.toString());
      if (res.ok) {
        const data = await res.json() as { slug?: string | null };
        if (data.slug) {
          const rewriteUrl = request.nextUrl.clone();
          rewriteUrl.pathname = `/${data.slug}${url === '/' ? '' : url}`;
          const rewrite = NextResponse.rewrite(rewriteUrl);
          rewrite.headers.set('x-resolved-tenant-id', data.slug);
          rewrite.headers.set('x-custom-domain', host);
          return rewrite;
        }
      }
    } catch {
      // DNS lookup failed — continue normal routing
    }
  }

  // --- Subdomain → slug rewrite (platform-agnostic, no Vercel Pro required) ---
  // bistroduport.restaurant-os.app/reservations → /bistroduport/reservations
  // Works on Railway, Fly.io, Docker, Vercel free, any Node host.
  const resolvedTenant = resolveTenantFromHost(request);
  if (resolvedTenant && !url.startsWith(`/${resolvedTenant}/`)) {
    const PUBLIC_WIDGET_PATHS = ['/reservations', '/menu', '/booking'];
    const matchedPublic = PUBLIC_WIDGET_PATHS.find(p => url === p || url.startsWith(p + '/'));
    if (matchedPublic) {
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = `/${resolvedTenant}${url}`;
      const rewrite = NextResponse.rewrite(rewriteUrl);
      rewrite.headers.set('x-resolved-tenant-id', resolvedTenant);
      return rewrite;
    }
  }

  const response = NextResponse.next();
  if (resolvedTenant) response.headers.set('x-resolved-tenant-id', resolvedTenant);
  return response;
}

export const config = {
  matcher: [
    // Subdomain public widget catch-all (runs before auth gates)
    '/reservations', '/reservations/:path*',
    '/menu', '/menu/:path*',
    '/booking', '/booking/:path*',
    // Auth-gated app routes
    '/api/admin/:path*',
    '/admin/:path*',
    '/pos', '/pos/:path*',
    '/kds', '/kds/:path*',
    '/operations', '/operations/:path*',
    '/bar', '/bar/:path*',
    '/kitchen', '/kitchen/:path*',
    '/floor-plan', '/floor-plan/:path*',
    '/registre', '/registre/:path*',
    '/groups', '/groups/:path*',
    '/staff', '/staff/:path*',
    '/inventory', '/inventory/:path*',
    '/haccp', '/haccp/:path*',
    '/finance', '/finance/:path*',
    '/crm', '/crm/:path*',
    '/marketing', '/marketing/:path*',
    '/analytics', '/analytics/:path*',
  ],
};
