/**
 * POST /api/admin/mcc/system-tenants/promote
 * Promotion TEST → REFERENCE pour une verticale donnée.
 * Server-only : lit depuis _test_*, écrit vers _ref_*.
 */

import { NextRequest, NextResponse } from 'next/server';
import { ensureServerNexus } from '@/lib/nexus/serverNexus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { getSystemTenantId } from '@/lib/mcc/SystemTenantRegistry';
import { PlatformVariantSchema } from '@/modules/system';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { toError } from "@/lib/toError";

const BodySchema = z.object({
    variant:     PlatformVariantSchema,
    collections: z.array(z.string()).min(1),
});

export async function POST(req: NextRequest) {
    // MCC-only — vérifié par le middleware (APP_MODE=mcc)
    ensureServerNexus();

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }
    const { variant, collections } = parsed.data;

    const testId = getSystemTenantId(variant, 'TEST');
    const refId  = getSystemTenantId(variant, 'REFERENCE');
    const ts     = new Date().toISOString();

    try {
        // 1. Snapshot de l'ancienne REFERENCE
        for (const col of collections) {
            const existing = await Nexus.adapter.query(`tenants/${refId}/${col}`);
            if (existing.length > 0) {
                await Promise.all(
                    existing.map((item: { id: string }) =>
                        Nexus.adapter.set(
                            `tenants/${refId}/_snapshots/${ts}/${col}/${item.id}`,
                            item
                        )
                    )
                );
            }
        }

        // 2. Copie TEST → REFERENCE
        for (const col of collections) {
            const items = await Nexus.adapter.query(`tenants/${testId}/${col}`);
            await Promise.all(
                items.map((item: { id: string }) =>
                    Nexus.adapter.set(`tenants/${refId}/${col}/${item.id}`, item)
                )
            );
        }

        // 3. Événement bus
        await NexusEventBus.emit('system.reference_promoted', {
            variant, timestamp: ts, collections, promotedBy: 'mcc-admin',
        });

        logger.info(`[MCC/promote] ${testId} → ${refId} OK (${collections.join(', ')})`);
        return NextResponse.json({ success: true, snapshot: ts });

    } catch (err) {
        logger.error('[MCC/promote] Échec promotion', err);
        return NextResponse.json({ error: toError(err).message }, { status: 500 });
    }
}
