/**
 * POST /api/admin/mcc/system-tenants/reset-test
 * Réinitialise un tenant TEST : purge toutes collections + re-seed depuis DNA REFERENCE.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { ensureServerNexus } from '@/lib/nexus/serverNexus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { TenantSeeder } from '@/lib/TenantSeeder';
import { getSystemTenantId } from '@/lib/mcc/SystemTenantRegistry';
import { PlatformVariantSchema } from '@/modules/system';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { toError } from "@/lib/toError";

const BodySchema = z.object({ variant: PlatformVariantSchema });

const PURGEABLE = [
    'orders', 'reservations', 'quotes', 'analytics', 'haccpLogs',
    'categories', 'products', 'floors', 'zones', 'tables',
    'users', 'connectors', 'accounts', 'brandingTokens',
];

export async function POST(req: NextRequest) {
    const caller = await requireMccLevel(req, 'fleet_admin');
    if (isDenied(caller)) return caller;
    ensureServerNexus();

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }
    const { variant } = parsed.data;
    const tenantId = getSystemTenantId(variant, 'TEST');

    try {
        // 1. Purge complète (sauf NF525 immuables)
        for (const col of PURGEABLE) {
            const items = await Nexus.adapter.query(`tenants/${tenantId}/${col}`);
            await Promise.all(
                items.map((item: { id: string }) =>
                    Nexus.adapter.delete(`tenants/${tenantId}/${col}/${item.id}`).catch(() => {})
                )
            );
        }
        // Force suppression de tenantConfig pour que TenantSeeder re-sème
        await Nexus.adapter.delete(`tenants/${tenantId}/tenantConfig`).catch(() => {});

        // 2. Re-seed depuis le DNA (comme un bootstrap neuf)
        const result = await TenantSeeder.seed({
            tenantId,
            name:       `${variant.charAt(0).toUpperCase() + variant.slice(1)} TEST`,
            adminEmail: 'system@restaurantos.internal',
            variant,
            adminPin:   process.env.SYSTEM_ADMIN_PIN,
        });

        // 3. Re-patcher le tier TEST
        await Nexus.adapter.set(`tenants/${tenantId}/tenantConfig`, { tier: 'TEST' }, { merge: true });

        logger.info(`[MCC/reset-test] ${tenantId} réinitialisé`, result.seededPaths);
        return NextResponse.json({ success: true, tenantId, seededPaths: result.seededPaths });

    } catch (err) {
        logger.error('[MCC/reset-test] Échec', err);
        return NextResponse.json({ error: toError(err).message }, { status: 500 });
    }
}
