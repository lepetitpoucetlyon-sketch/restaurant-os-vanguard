"use server";

import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { toError } from '@/lib/toError';

import { createSafeAction } from "@/lib/server/actionWrapper";
import { z } from "zod";

export const updateTenantSettingsAction = createSafeAction(
    z.tuple([z.string(), z.unknown()]),
    { page: "settings", action: "modify_identity" },
    async (tenantId, section: string, settings: Record<string, unknown> | object) => {
        try {
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
);

export const updateProductAction = createSafeAction(
    z.tuple([z.string(), z.unknown()]),
    { page: "menu_builder", action: "edit_name" },
    async (tenantId, productId: string, productData: Record<string, unknown> | object) => {
        try {
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
);
