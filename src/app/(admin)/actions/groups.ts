// @ts-nocheck
"use server";

import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { revalidatePath } from "next/cache";
import { GroupService } from '@/domain/services/GroupService';

/**
 * 🏢 Groups Actions - Restaurant OS
 */

export async function upsertGroupAction(tenantId: string, group: any) {
    if (!tenantId) throw new Error("Tenant ID is required.");
    
    // 1. Validate Business Rules
    const validation = GroupService.validateGroup(group);
    if (!validation.valid) {
        throw new Error(validation.error || "Données d'événement invalides.");
    }

    try {
        const groupsPath = `tenants/${tenantId}/groups`;
        const id = group.id || Nexus.adapter.generateId(groupsPath);
        
        // 2. Prepare Payload via Service
        const payload = GroupService.prepareGroup(group, id);

        await Nexus.adapter.set(`${groupsPath}/${id}`, payload, { merge: true });
        
        logger.info(`[ServerAction] Group ${id} industrialized for tenant ${tenantId}`);
        revalidatePath('/groups');
        
        return { success: true, id };
    } catch (error) {
        logger.error(`[ServerAction] Group upsert failed`, error);
        throw new Error('Persistence failed: Group not saved');
    }
}
