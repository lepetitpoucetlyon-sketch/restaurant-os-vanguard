import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

const DEFAULT_CATALOG = {
  'uber_eats_sync': { name: 'Synchronisation UberEats', basePrice: 29.99, category: 'Integration' },
  'click_and_collect': { name: 'Module Click & Collect Web', basePrice: 49.99, category: 'Sales' },
  'loyalty_pro': { name: 'Fidélité Avancée (NFC)', basePrice: 19.99, category: 'Marketing' },
  'advanced_analytics': { name: 'BI & Analytiques Avancées', basePrice: 39.99, category: 'Intelligence' }
};

const CatalogItemSchema = z.object({
  id: z.string().min(1).regex(/^[a-z0-9_]+$/),
  name: z.string().min(1),
  basePrice: z.number().min(0),
  category: z.string().min(1)
});

export async function GET(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'mcc_support');
  if (isDenied(caller)) return caller as NextResponse;

  try {
    let catalog = await Nexus.adapter.get('mcc/empire/plugin-catalog') as { items?: Record<string, unknown> } | null;
    
    // Auto-seed if empty
    if (!catalog || !catalog.items || Object.keys(catalog.items).length === 0) {
      await Nexus.adapter.set('mcc/empire/plugin-catalog', { items: DEFAULT_CATALOG });
      catalog = { items: DEFAULT_CATALOG };
    }

    return NextResponse.json({ catalog: catalog.items });
  } catch (err) {
    logger.error('[Catalog] Error fetching catalog:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'fleet_admin');
  if (isDenied(caller)) return caller as NextResponse;

  let body: z.infer<typeof CatalogItemSchema>;
  try {
    body = CatalogItemSchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: 'Validation failed', details: err }, { status: 400 });
  }

  const { id, name, basePrice, category } = body;

  try {
    const patch = {
      items: {
        [id]: { name, basePrice, category, updatedAt: new Date().toISOString() }
      }
    };
    
    await Nexus.adapter.set('mcc/empire/plugin-catalog', patch, { merge: true });
    logger.info(`[Catalog] Offer ${id} updated by ${caller.uid}`);

    return NextResponse.json({ success: true, item: patch.items[id] });
  } catch (err) {
    logger.error('[Catalog] Error saving offer:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'fleet_admin');
  if (isDenied(caller)) return caller as NextResponse;

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

  try {
    const catalog = await Nexus.adapter.get('mcc/empire/plugin-catalog') as { items?: Record<string, unknown> } | null;
    if (catalog && catalog.items && catalog.items[id]) {
      const updatedItems = { ...catalog.items };
      delete updatedItems[id];
      await Nexus.adapter.set('mcc/empire/plugin-catalog', { items: updatedItems });
      logger.info(`[Catalog] Offer ${id} deleted by ${caller.uid}`);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('[Catalog] Error deleting offer:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
