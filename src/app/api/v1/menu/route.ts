import { NextRequest, NextResponse } from 'next/server';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import type { SovereignProduct } from '@/modules/ops';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId');

  if (!tenantId) {
    return NextResponse.json({ error: 'Paramètre tenantId manquant' }, { status: 400 });
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
