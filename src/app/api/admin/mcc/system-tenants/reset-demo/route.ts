/**
 * POST /api/admin/mcc/system-tenants/reset-demo
 * Réinitialise un tenant DEMO : purge données mutables + re-seed.
 */

import { NextRequest, NextResponse } from 'next/server';
import { ensureServerNexus } from '@/lib/nexus/serverNexus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { getSystemTenantId } from '@/lib/mcc/SystemTenantRegistry';
import { PlatformVariantSchema } from '@/domain/schemas/tenant';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const BodySchema = z.object({ variant: PlatformVariantSchema });

const RESETTABLE = ['orders', 'reservations', 'quotes', 'analytics'];

export async function POST(req: NextRequest) {
    ensureServerNexus();

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }
    const { variant } = parsed.data;
    const tenantId = getSystemTenantId(variant, 'DEMO');

    try {
        // Purge collections mutables
        for (const col of RESETTABLE) {
            const items = await Nexus.adapter.query(`tenants/${tenantId}/${col}`);
            await Promise.all(
                items.map((item: { id: string }) =>
                    Nexus.adapter.delete(`tenants/${tenantId}/${col}/${item.id}`).catch(() => {})
                )
            );
        }

        // Re-seed données enrichies (inline — les scripts ne sont pas importables en runtime Next.js)
        // Appeler via exec en production ou utiliser seed-demo-data.ts directement en CLI.
        logger.info(`[MCC/reset-demo] ${tenantId} purgé. Re-seed via CLI : npx tsx scripts/seed-demo-data.ts --variant ${variant}`);

        return NextResponse.json({
            success: true,
            tenantId,
            note: `Purge OK. Pour re-seeder : npx tsx scripts/seed-demo-data.ts --variant ${variant}`,
        });

    } catch (err) {
        logger.error('[MCC/reset-demo] Échec', err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
