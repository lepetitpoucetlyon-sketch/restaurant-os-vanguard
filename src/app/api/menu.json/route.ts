import { NextRequest, NextResponse } from 'next/server';

interface CategoryRecord {
  id: string;
  name: string;
  description?: string;
  order?: number;
  isVisible?: boolean;
}

interface ProductRecord {
  id: string;
  name: string;
  shortDescription?: string;
  longDescription?: string;
  priceTTC?: number;
  categoryId?: string;
  visibleOnMenu?: boolean;
}

/**
 * GET /api/menu.json
 *
 * Public endpoint — returns the restaurant menu as JSON, suitable for
 * schema.org ingestion, third-party integrations, or SSG pre-generation.
 *
 * Optional query param: `?tenantId=<id>`
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');

    const { Nexus } = await import('@/lib/nexus/NexusAdapter');

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });
    }

    const context = { vassalId: tenantId, actorId: 'menu-api' };

    // Guard IDOR : seuls les tenants ayant activé le menu public sont accessibles
    const publicConfig = await Nexus.adapter
      .get<{ publicMenuEnabled?: boolean }>(`tenants/${tenantId}/config/public`, context)
      .catch(() => null);
    if (!publicConfig?.publicMenuEnabled) {
      return NextResponse.json({ error: 'Menu non disponible' }, { status: 403 });
    }

    let degraded = false;
    const [categories, products] = await Promise.all([
      Nexus.adapter
        .query<CategoryRecord>('menu_categories', { orderBy: { field: 'order', direction: 'asc' } }, context)
        .catch(() => { degraded = true; return [] as CategoryRecord[]; }),
      Nexus.adapter
        .query<ProductRecord>('products', undefined, context)
        .catch(() => { degraded = true; return [] as ProductRecord[]; }),
    ]);

    // Only return visible items
    const visibleCategories = categories.filter((c) => c.isVisible !== false);
    const visibleProducts = products.filter((p) => p.visibleOnMenu !== false);

    return NextResponse.json(
      { categories: visibleCategories, products: visibleProducts, ...(degraded ? { degraded: true } : {}) },
      {
        status: degraded ? 503 : 200,
        headers: {
          'Cache-Control': degraded
            ? 'public, s-maxage=0, stale-while-revalidate=3600'
            : 'public, s-maxage=300, stale-while-revalidate=60',
        },
      }
    );
  } catch (err) {
    console.error('[api/menu.json]', err);
    return NextResponse.json(
      { categories: [], products: [], error: 'Failed to load menu' },
      { status: 500 }
    );
  }
}
