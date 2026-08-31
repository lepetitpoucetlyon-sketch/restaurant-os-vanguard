import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { getRateLimiter } from '@/infrastructure/services/rate-limiter';
import { getCallerAuth } from '@/lib/server/adminAuthGuard';
import type { SovereignProduct } from '@/modules/ops';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId');

  if (!tenantId) {
    return NextResponse.json({ error: 'Paramètre tenantId manquant' }, { status: 400 });
  }

  // Rate Limiting : 60 requêtes par minute par IP/tenant (V3-SEC-08)
  const limiter = getRateLimiter();
  const rl = await limiter.check(`menu:${ip}:${tenantId}`, 60, 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Trop de requêtes, veuillez réessayer plus tard' }, { status: 429 });
  }

  // Si un token d'authentification est fourni, vérifier la correspondance du tenant
  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    const caller = await getCallerAuth(req);
    if (caller && caller.tenantId && caller.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Accès non autorisé pour ce tenant' }, { status: 403 });
    }
  }

  try {
    const productsMap = (await Nexus.adapter.get<Record<string, SovereignProduct>>(`tenants/${tenantId}/products`)) || {};
    const products = Object.values(productsMap).filter(Boolean);

    const categories = Array.from(new Set(products.map((p) => (p as { category?: string }).category).filter(Boolean)));

    return NextResponse.json({
      tenantId,
      categories,
      products,
      count: products.length,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Erreur récupération menu' }, { status: 500 });
  }
}
