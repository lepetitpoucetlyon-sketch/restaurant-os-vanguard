"use server";

import { requireSession } from '@/lib/server/verifySession';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { toError } from '@/lib/toError';

export async function updateTenantSettingsAction(tenantId: string, section: string, settings: Record<string, unknown> | object) {
    try {
        await requireSession(tenantId);

        await NexusEventBus.emitDurable('system.settings.updated', {
            v: 1,
            tenantId,
            section,
            settings: settings as Record<string, unknown>,
            timestamp: Date.now(),
        });

        return { success: true };
    } catch (err) {
        return { success: false, error: toError(err).message };
    }
}

export async function updateProductAction(tenantId: string, productId: string, productData: Record<string, unknown> | object) {
    try {
        await requireSession(tenantId);

        await NexusEventBus.emitDurable('system.settings.updated', {
            v: 1,
            tenantId,
            section: `product_${productId}`,
            settings: productData as Record<string, unknown>,
            timestamp: Date.now(),
        });

        return { success: true };
    } catch (err) {
        return { success: false, error: toError(err).message };
    }
}
