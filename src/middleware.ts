import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * 🛡️ Pré-filtre Edge des routes /api/admin.
 *
 * Le middleware tourne en Edge runtime (pas de firebase-admin ici) : il ne
 * fait qu'un rejet rapide des requêtes sans Bearer token. La VRAIE
 * vérification (signature JWT + rôle via custom claims) est faite dans
 * chaque route par `src/lib/server/adminAuthGuard.ts`.
 *
 * Sémantique « hidden door » conservée : refus = 404, jamais 401/403.
 */
export function middleware(request: NextRequest) {
  const url = request.nextUrl.pathname;

  if (url.startsWith('/api/admin/')) {
    // Les routes git sont un outillage de dev local — jamais exposées en prod.
    if (url.startsWith('/api/admin/git/') && process.env.NODE_ENV === 'production') {
      return new NextResponse(null, { status: 404 });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new NextResponse(null, { status: 404 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/admin/:path*'],
};
