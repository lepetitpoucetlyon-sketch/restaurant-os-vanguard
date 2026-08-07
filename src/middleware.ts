import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { resolveTenantFromHost } from '@/lib/server/tenantFromHost';

const APP_MODE = process.env.NEXT_PUBLIC_APP_MODE || 'tenant';

const MCC_ROUTES = ['/admin/mcc'];
const TENANT_ONLY_ROUTES = [
  '/pos', '/pos-mobile', '/kds', '/operations', '/reservations',
  '/bar', '/kitchen', '/floor-plan', '/registre', '/groups',
  '/staff', '/inventory', '/haccp', '/finance', '/crm', '/marketing', '/analytics',
  '/integrations', '/intelligence', '/leaves', '/menu-builder',
  '/migration', '/mon-espace', '/onboarding', '/planning',
  '/recruitment', '/timeclock', '/vanguard-simulator', '/welcome-staff',
];

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'restaurantos.app';

function checkAppModeGate(url: string): NextResponse | null {
  if (APP_MODE === 'tenant' && MCC_ROUTES.some(r => url.startsWith(r)))        return new NextResponse(null, { status: 404 });
  if (APP_MODE === 'mcc'    && TENANT_ONLY_ROUTES.some(r => url.startsWith(r))) return new NextResponse(null, { status: 404 });
  return null;
}

function checkAdminApiGate(request: NextRequest, url: string): NextResponse | null {
  if (!url.startsWith('/api/admin/')) return null;
  if (url.startsWith('/api/admin/git/') && process.env.NODE_ENV === 'production') return new NextResponse(null, { status: 404 });
  const auth = request.headers.get('authorization');
  if (!auth || !auth.startsWith('Bearer ')) return new NextResponse(null, { status: 404 });
  return null;
}

async function resolveCustomDomain(request: NextRequest, host: string, url: string): Promise<NextResponse | null> {
  if (url.startsWith('/api/resolve-domain')) return null;
  try {
    const resolveUrl = new URL(`/api/resolve-domain?domain=${encodeURIComponent(host)}`, request.url);
    const res = await fetch(resolveUrl.toString());
    if (!res.ok) return null;
    const data = await res.json() as { slug?: string | null };
    if (!data.slug) return null;
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = `/${data.slug}${url === '/' ? '' : url}`;
    const rewrite = NextResponse.rewrite(rewriteUrl);
    rewrite.headers.set('x-resolved-tenant-id', data.slug);
    rewrite.headers.set('x-custom-domain', host);
    return rewrite;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.pathname;

  const modeBlock = checkAppModeGate(url);
  if (modeBlock) return modeBlock;

  const adminBlock = checkAdminApiGate(request, url);
  if (adminBlock) return adminBlock;

  // Custom domain → slug rewrite (res-arch-3): bistro.com → /bistroduport/...
  const host = (request.headers.get('host') ?? '').split(':')[0].toLowerCase();
  const isAppSubdomain = host === APP_DOMAIN || host.endsWith(`.${APP_DOMAIN}`) || host === 'localhost';
  if (!isAppSubdomain) {
    const customRewrite = await resolveCustomDomain(request, host, url);
    if (customRewrite) return customRewrite;
  }

  // Subdomain → slug rewrite (platform-agnostic): bistroduport.app → /bistroduport/...
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
    '/integrations', '/integrations/:path*',
    '/intelligence', '/intelligence/:path*',
    '/leaves', '/leaves/:path*',
    '/menu-builder', '/menu-builder/:path*',
    '/migration', '/migration/:path*',
    '/mon-espace', '/mon-espace/:path*',
    '/onboarding', '/onboarding/:path*',
    '/planning', '/planning/:path*',
    '/pos-mobile', '/pos-mobile/:path*',
    '/recruitment', '/recruitment/:path*',
    '/timeclock', '/timeclock/:path*',
    '/vanguard-simulator', '/vanguard-simulator/:path*',
    '/welcome-staff', '/welcome-staff/:path*',
  ],
};
