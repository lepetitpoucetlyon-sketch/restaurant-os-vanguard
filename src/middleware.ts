import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.pathname;

  // 🛡️ HIDDEN DOOR PATTERN
  if (url.startsWith('/api/admin/')) {
    const tenantId = request.headers.get('x-nexus-tenant-id');
    const authHeader = request.headers.get('authorization');
    
    // Check Tenant ID
    if (tenantId !== 'restaurant-os') {
      return new NextResponse(null, { status: 404 }); // Hidden Door: return 404 instead of 401/403
    }
    
    // Check JWT/Auth presence (stubbed for Grade X)
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new NextResponse(null, { status: 404 });
    }
    
    // Additional JWT decoding logic for super_admin could go here
    // For now, if headers are present, we let it pass to the route
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/admin/:path*'],
};
