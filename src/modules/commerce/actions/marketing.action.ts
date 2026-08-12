"use server";

import { NexusEventBus } from '@orchestration/NexusEventBus';
import { toError } from '@/lib/toError';

import { Nexus } from '@/lib/nexus/NexusAdapter';

import { createSafeAction } from "@/lib/server/actionWrapper";
import { z } from "zod";

const PromoCodeDataSchema = z.object({
    id: z.string().optional(),
    code: z.string().optional(),
    discountType: z.enum(['percent', 'fixed']).optional(),
    value: z.number().optional(),
    isActive: z.boolean().optional(),
}).passthrough();

const LoyaltyCardDataSchema = z.object({
    id: z.string().optional(),
    points: z.number().int().min(0).optional(),
    tier: z.string().optional(),
}).passthrough();

const CustomerDataSchema = z.object({
    id: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
}).passthrough();

export type PromoCodeData = z.infer<typeof PromoCodeDataSchema>;
export type LoyaltyCardData = z.infer<typeof LoyaltyCardDataSchema>;
export type CustomerData = z.infer<typeof CustomerDataSchema>;

export const createPromoCodeAction = createSafeAction(
    z.tuple([PromoCodeDataSchema]),
    { page: "marketing", action: "manage_promotions" },
    async (tenantId, promoCodeData: PromoCodeData) => {
        try {
            const id = promoCodeData.id || Nexus.adapter.generateId('promoCodes');
            const dataWithId = { ...promoCodeData, id };

            await NexusEventBus.emitDurable('marketing.promocode.created', { tenantId, id, data: dataWithId });

            if (dataWithId.isActive) {
                await NexusEventBus.emitDurable('commerce.promotion_activated', {
                    v: 1,
                    tenantId: tenantId || 'restaurant-os',
                    promotionId: id,
                    discountBps: dataWithId.discountType === 'percent' ? Math.round((dataWithId.value || 0) * 100) : 1000,
                    productIds: [],
                });
            }

            return { success: true, id };
        } catch (err) {
            return { success: false, error: toError(err).message };
        }
    }
);

export const updatePromoCodeAction = createSafeAction(
    z.tuple([z.string().min(1, 'promoCodeId requis'), PromoCodeDataSchema]),
    { page: "marketing", action: "manage_promotions" },
    async (tenantId, promoCodeId: string, promoCodeData: PromoCodeData) => {
        try {
            await NexusEventBus.emitDurable('marketing.promocode.updated', { tenantId, id: promoCodeId, data: promoCodeData });

            if (promoCodeData.isActive !== undefined) {
                if (promoCodeData.isActive) {
                    if (promoCodeData.discountType) {
                        await NexusEventBus.emitDurable('commerce.promotion_activated', {
                            v: 1,
                            tenantId: tenantId || 'restaurant-os',
                            promotionId: promoCodeId,
                            discountBps: promoCodeData.discountType === 'percent' ? Math.round((promoCodeData.value || 0) * 100) : 1000,
                            productIds: [],
                        });
                    }
                }
            }

            return { success: true };
        } catch (err) {
            return { success: false, error: toError(err).message };
        }
    }
);

export const issueLoyaltyCardAction = createSafeAction(
    z.tuple([z.string().min(1, 'customerId requis'), LoyaltyCardDataSchema]),
    { page: "crm", action: "adjust_loyalty_points" },
    async (tenantId, customerId: string, data: LoyaltyCardData) => {
        try {
            const id = data.id || Nexus.adapter.generateId('loyaltyRewards');
            const dataWithId = { ...data, id };

            await NexusEventBus.emitDurable('marketing.loyaltycard.issued', { tenantId, customerId, data: dataWithId });
            return { success: true, id };
        } catch (err) {
            return { success: false, error: toError(err).message };
        }
    }
);

export const updateLoyaltyCardAction = createSafeAction(
    z.tuple([z.string().min(1, 'customerId requis'), LoyaltyCardDataSchema]),
    { page: "crm", action: "adjust_loyalty_points" },
    async (tenantId, customerId: string, data: LoyaltyCardData) => {
        try {
            await NexusEventBus.emitDurable('marketing.loyaltycard.updated', { tenantId, customerId, data });
            return { success: true };
        } catch (err) {
            return { success: false, error: toError(err).message };
        }
    }
);

export const createCustomerAction = createSafeAction(
    z.tuple([z.string().min(1, 'customerId requis'), CustomerDataSchema]),
    { page: "crm", action: "create_client" },
    async (tenantId, customerId: string, data: CustomerData) => {
        try {
            await NexusEventBus.emitDurable('crm.customer.created', { tenantId, id: customerId, data });
            return { success: true };
        } catch (err) {
            return { success: false, error: toError(err).message };
        }
    }
);

export const updateCustomerAction = createSafeAction(
    z.tuple([z.string().min(1, 'customerId requis'), CustomerDataSchema]),
    { page: "crm", action: "modify_client" },
    async (tenantId, customerId: string, data: CustomerData) => {
        try {
            await NexusEventBus.emitDurable('crm.customer.updated', { tenantId, id: customerId, data });
            return { success: true };
        } catch (err) {
            return { success: false, error: toError(err).message };
        }
    }
);

export const toggleOnlineBookingAction = createSafeAction(
    z.tuple([z.string().min(1, 'tableId requis'), z.boolean()]),
    { page: "reservations", action: "modify" },
    async (tenantId, tableId: string, enabled: boolean) => {
        try {
            await NexusEventBus.emitDurable('marketing.booking.toggled', { tenantId, id: tableId, enabled });
            return { success: true };
        } catch (err) {
            return { success: false, error: toError(err).message };
        }
    }
);
