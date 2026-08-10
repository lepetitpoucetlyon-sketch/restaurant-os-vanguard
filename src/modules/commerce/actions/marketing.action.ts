"use server";

import { verifySession } from '@/lib/server/verifySession';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { toError } from '@/lib/toError';

import { IdGenerator } from '@/lib/utils/IdGenerator';
import { Nexus } from '@/lib/nexus/NexusAdapter';

export async function createPromoCodeAction(tenantId: string, promoCodeData: any) {
    try {
        await verifySession(tenantId);
        
        const id = promoCodeData.id || Nexus.adapter.generateId('promoCodes');
        const dataWithId = { ...promoCodeData, id };

        await NexusEventBus.emitDurable('marketing.promocode.created', { tenantId, id, data: dataWithId });

        if (dataWithId.isActive) {
            await NexusEventBus.emitDurable('commerce.promotion_activated', {
                v: 1,
                tenantId: tenantId || 'restaurant-os',
                promotionId: id,
                discountBps: dataWithId.discountType === 'percent' ? Math.round(dataWithId.value * 100) : 1000,
                productIds: [],
            });
        }

        return { success: true, id };
    } catch (err) {
        return { success: false, error: toError(err).message };
    }
}

export async function updatePromoCodeAction(tenantId: string, promoCodeId: string, promoCodeData: any) {
    try {
        await verifySession(tenantId);
        await NexusEventBus.emitDurable('marketing.promocode.updated', { tenantId, id: promoCodeId, data: promoCodeData });

        if (promoCodeData.isActive !== undefined) {
            if (promoCodeData.isActive) {
                // Not having full promo data here might be an issue, but we'll emit for now if we can,
                // actually we shouldn't emit if we don't have discountBps. The component can just emit it or we can pass discountBps in the data.
                if (promoCodeData.discountType) {
                    await NexusEventBus.emitDurable('commerce.promotion_activated', {
                        v: 1,
                        tenantId: tenantId || 'restaurant-os',
                        promotionId: promoCodeId,
                        discountBps: promoCodeData.discountType === 'percent' ? Math.round(promoCodeData.value * 100) : 1000,
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

export async function issueLoyaltyCardAction(tenantId: string, customerId: string, data: any) {
    try {
        await verifySession(tenantId);
        
        const id = data.id || Nexus.adapter.generateId('loyaltyRewards');
        const dataWithId = { ...data, id };

        await NexusEventBus.emitDurable('marketing.loyaltycard.issued', { tenantId, customerId, data: dataWithId });
        return { success: true, id };
    } catch (err) {
        return { success: false, error: toError(err).message };
    }
}

export async function updateLoyaltyCardAction(tenantId: string, customerId: string, data: any) {
    try {
        await verifySession(tenantId);
        await NexusEventBus.emitDurable('marketing.loyaltycard.updated', { tenantId, customerId, data });
        return { success: true };
    } catch (err) {
        return { success: false, error: toError(err).message };
    }
}

export async function createCustomerAction(tenantId: string, customerId: string, data: any) {
    try {
        await verifySession(tenantId);
        await NexusEventBus.emitDurable('crm.customer.created', { tenantId, id: customerId, data });
        return { success: true };
    } catch (err) {
        return { success: false, error: toError(err).message };
    }
}

export async function updateCustomerAction(tenantId: string, customerId: string, data: any) {
    try {
        await verifySession(tenantId);
        await NexusEventBus.emitDurable('crm.customer.updated', { tenantId, id: customerId, data });
        return { success: true };
    } catch (err) {
        return { success: false, error: toError(err).message };
    }
}

export async function toggleOnlineBookingAction(tenantId: string, tableId: string, enabled: boolean) {
    try {
        await verifySession(tenantId);
        await NexusEventBus.emitDurable('marketing.booking.toggled', { tenantId, id: tableId, enabled });
        return { success: true };
    } catch (err) {
        return { success: false, error: toError(err).message };
    }
}
