"use server";

import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

/**
 * 📣 Marketing Actions - Restaurant OS
 * Production-grade server actions for marketing and reputation management.
 */

import { MarketingService } from '@/domain/services/MarketingService';
import { MarketingCampaign } from '@/types';
import { MarketingSegment, ScheduledPost } from '@/modules/marketing/store/marketingAtoms';
import { SovereignData } from '@/shared/nexus-contract';

/**
 * 📣 Marketing Actions - Restaurant OS
 */

export async function saveMarketingSettingsAction(tenantId: string, settings: SovereignData) {
    logger.info(`[ServerAction] Saving Marketing/Reputation Settings (Tenant: ${tenantId})`);

    try {
        const path = `tenants/${tenantId}/config/marketing`;
        
        await Nexus.adapter.set(path, {
            ...settings,
            updatedAt: new Date().toISOString()
        }, { merge: true });

        return { success: true };
    } catch (error) {
        logger.error(`[ServerAction] Marketing settings persistence failed!`, error);
        throw new Error("Failed to save marketing configuration.");
    }
}

export async function validatePromoCodeAction(tenantId: string, code: string) {
    logger.info(`[ServerAction] Validating Promo Code: ${code} (Tenant: ${tenantId})`);
    return MarketingService.validatePromoCode(code);
}

// --- 📣 INDUSTRIAL MARKETING & Customer SEGMENTS (Grade IX) ---

export async function upsertScheduledPostAction(tenantId: string, data: Partial<ScheduledPost>) {
    if (!tenantId) throw new Error("[Marketing] Tenant ID required.");
    try {
        const collectionPath = `tenants/${tenantId}/scheduledPosts`;
        const id = data.id || Nexus.adapter.generateId(collectionPath);
        const payload = {
            ...data, id,
            status: data.status || 'scheduled',
            updatedAt: new Date().toISOString(),
            createdAt: data.createdAt || new Date().toISOString(),
        };
        await Nexus.adapter.set(`${collectionPath}/${id}`, payload, { merge: true });
        return { success: true, id };
    } catch (error) {
        logger.error(`[Marketing] Scheduled post upsert failed`, error);
        throw error;
    }
}

export async function deleteScheduledPostAction(tenantId: string, postId: string) {
    if (!tenantId || !postId) throw new Error("[Marketing] Missing credentials.");
    try {
        await Nexus.adapter.delete(`tenants/${tenantId}/scheduledPosts/${postId}`);
        return { success: true };
    } catch (error) {
        logger.error(`[Marketing] Post deletion failed`, error);
        throw error;
    }
}

export async function upsertCampaignAction(tenantId: string, data: Partial<MarketingCampaign>) {
    if (!tenantId) throw new Error("[Marketing] Tenant ID required.");
    try {
        const collectionPath = `tenants/${tenantId}/campaigns`;
        const id = data.id || Nexus.adapter.generateId(collectionPath);
        const payload = {
            ...data, id,
            status: data.status || 'draft',
            metrics: data.metrics || { sent: 0, opened: 0, clicked: 0, conversions: 0 },
            updatedAt: new Date().toISOString(),
            createdAt: data.createdAt || new Date().toISOString(),
        };
        await Nexus.adapter.set(`${collectionPath}/${id}`, payload, { merge: true });
        return { success: true, id };
    } catch (error) {
        logger.error(`[Marketing] Campaign upsert failed`, error);
        throw error;
    }
}

export async function deleteCampaignAction(tenantId: string, campaignId: string) {
    if (!tenantId || !campaignId) throw new Error("[Marketing] Missing credentials.");
    try {
        await Nexus.adapter.delete(`tenants/${tenantId}/campaigns/${campaignId}`);
        return { success: true };
    } catch (error) {
        logger.error(`[Marketing] Campaign deletion failed`, error);
        throw error;
    }
}

export async function upsertSegmentAction(tenantId: string, data: Partial<MarketingSegment>) {
    if (!tenantId) throw new Error("[Marketing] Tenant ID required.");
    try {
        const collectionPath = `tenants/${tenantId}/customerSegments`;
        const id = data.id || Nexus.adapter.generateId(collectionPath);
        const payload = {
            ...data, id,
            estimatedSize: data.estimatedSize || 0,
            updatedAt: new Date().toISOString(),
            createdAt: data.createdAt || new Date().toISOString(),
        };
        await Nexus.adapter.set(`${collectionPath}/${id}`, payload, { merge: true });
        return { success: true, id };
    } catch (error) {
        logger.error(`[Marketing] Segment upsert failed`, error);
        throw error;
    }
}

export async function deleteSegmentAction(tenantId: string, segmentId: string) {
    if (!tenantId || !segmentId) throw new Error("[Marketing] Missing credentials.");
    try {
        await Nexus.adapter.delete(`tenants/${tenantId}/customerSegments/${segmentId}`);
        return { success: true };
    } catch (error) {
        logger.error(`[Marketing] Segment deletion failed`, error);
        throw error;
    }
}

export async function updateReviewStatus(tenantId: string, reviewId: string, status: string) {
    if (!tenantId || !reviewId) throw new Error("[Marketing] Missing IDs.");
    try {
        await Nexus.adapter.update(`tenants/${tenantId}/reviews/${reviewId}`, {
            status,
            updatedAt: new Date().toISOString()
        });
        return { success: true };
    } catch (error) {
        logger.error(`[Marketing] Review status update failed`, error);
        throw error;
    }
}

export async function replyToReview(reviewId: string, reply: string) {
    console.log('Reply to review', reviewId, reply);
}

export async function deleteReview(reviewId: string) {
    console.log('Delete review', reviewId);
}
