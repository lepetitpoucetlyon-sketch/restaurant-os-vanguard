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

export function middleware(request: NextRequest) {
  const url = request.nextUrl.pathname;

  // --- APP_MODE route gating ---
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
