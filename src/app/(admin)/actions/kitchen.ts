"use server";

import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { KitchenService } from '@/domain/services/KitchenService';

/**
 * 👨‍🍳 Kitchen Actions - Restaurant OS
 */

export async function upsertRecipeAction(tenantId: string, recipe: any) {
    if (!tenantId) throw new Error("Tenant ID is required.");
    
    try {
        const recipesPath = `tenants/${tenantId}/recipes`;
        const id = recipe.id || Nexus.adapter.generateId(recipesPath);
        
        // Delegation to Domain Service
        const payload = KitchenService.prepareRecipe(recipe, id);

        await Nexus.adapter.set(`${recipesPath}/${id}`, payload, { merge: true });
        logger.info(`[ServerAction] Recipe ${id} industrialized for tenant ${tenantId}`);
        return { success: true, id };
    } catch (error) {
        logger.error(`[ServerAction] Upsert Recipe Failed`, error);
        throw error;
    }
}

export async function deleteRecipeAction(tenantId: string, recipeId: string) {
    try {
        await Nexus.adapter.delete(`tenants/${tenantId}/recipes/${recipeId}`);
        return { success: true };
    } catch (error) {
        logger.error(`[ServerAction] Delete Recipe Failed`, error);
        throw error;
    }
}

export async function togglePrepTaskAction(tenantId: string, taskId: string) {
    try {
        const path = `tenants/${tenantId}/prepTasks/${taskId}`;
        const snap = await Nexus.adapter.get(path);
        
        if (snap) {
            const currentStatus = snap.isCompleted || false;
            const updates = KitchenService.togglePrepTask(currentStatus);
            await Nexus.adapter.update(path, updates);
        }
        
        return { success: true };
    } catch (error) {
        logger.error(`[ServerAction] Toggle PrepTask Failed`, error);
        throw error;
    }
}
export async function updateKitchenStatusAction(tenantId: string, status: any) {
    logger.info(`[ServerAction] Updating Kitchen Status to ${status} for ${tenantId}`);
    return { success: true };
}

export async function clearKitchenNotificationsAction(tenantId: string) {
    logger.info(`[ServerAction] Clearing Kitchen Notifications for ${tenantId}`);
    return { success: true };
}
