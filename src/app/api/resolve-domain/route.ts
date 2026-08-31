/**
 * GET /api/resolve-domain?domain=bistro.com
 * Route interne utilisée par le middleware pour résoudre un domaine custom → slug.
 * Pas d'auth — accessible uniquement depuis le middleware (interne).
 * Cache-Control: 60s pour limiter les requêtes Nexus depuis le middleware.
 */
import 'server-only';
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { Nexus } from '@/lib/nexus/NexusAdapter';

function encodeDomainKey(domain: string) {
  return domain.replace(/\./g, '__');
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const domain = req.nextUrl.searchParams.get('domain')?.toLowerCase().trim();

  if (!domain) {
    return NextResponse.json({ slug: null }, { status: 400 });
  }

  try {
    const record = await Nexus.adapter.get(
      `platform/customDomains/${encodeDomainKey(domain)}`
    ) as { slug?: string; tenantId?: string; removed?: boolean } | null;

    if (!record || record.removed || !record.slug) {
      return NextResponse.json({ slug: null }, {
        headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' },
      });
    }

    return NextResponse.json({ slug: record.slug, tenantId: record.tenantId }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' },
    });
  } catch {
    return NextResponse.json({ slug: null }, { status: 500 });
  }
}
