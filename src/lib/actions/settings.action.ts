"use server";

import { NexusEventBus } from '@orchestration/NexusEventBus';
import { toError } from '@/lib/toError';

import { createSafeAction } from "@/lib/server/actionWrapper";
import { z } from "zod";

const SettingsPayloadSchema = z.record(z.string(), z.unknown());

const ProductUpdatePayloadSchema = z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    description: z.string().optional(),
    priceInMicrounits: z.number().int().min(0).optional(),
    taxRate: z.string().optional(),
    categoryId: z.string().optional(),
    isAvailable: z.boolean().optional(),
}).passthrough();

export type SettingsPayload = z.infer<typeof SettingsPayloadSchema>;
export type ProductUpdatePayload = z.infer<typeof ProductUpdatePayloadSchema>;

export const updateTenantSettingsAction = createSafeAction(
    z.tuple([z.string().min(1, 'section requise'), SettingsPayloadSchema]),
    { page: "settings", action: "modify_identity" },
    async (tenantId, section: string, settings: SettingsPayload) => {
        try {
            await NexusEventBus.emitDurable('system.settings.updated', {
                v: 1,
                tenantId,
                section,
                settings,
                timestamp: Date.now(),
            });
            return { success: true };
        } catch (err) {
            return { success: false, error: toError(err).message };
        }
    }
);

export const updateProductAction = createSafeAction(
    z.tuple([z.string().min(1, 'productId requis'), ProductUpdatePayloadSchema]),
    { page: "menu_builder", action: "edit_name" },
    async (tenantId, productId: string, productData: ProductUpdatePayload) => {
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
