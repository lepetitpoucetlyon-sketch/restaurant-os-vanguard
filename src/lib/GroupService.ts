import { GroupEvent } from '@nexus/contracts';

/**
 * 🏢 GroupService - Restaurant OS
 * Centralized Domain Logic for Events and Group Bookings.
 * Grade VI: Industrialized Event Orchestration.
 */
export class GroupService {

    /**
     * Prepares a group/event payload for persistence.
     * Could include deposit calculation or room allotment logic in the future.
     */
    static prepareGroup(data: Record<string, import("@nexus/contracts/nexus-contract").SovereignValue>, generatedId: string): Record<string, import("@nexus/contracts/nexus-contract").SovereignValue> {
        return {
            ...data,
            id: generatedId,
            status: data.status || 'tentative',
            updatedAt: new Date().toISOString(),
            createdAt: data.createdAt || new Date().toISOString(),
        };
    }

    /**
     * Business validation for group events.
     */
    static validateGroup(data: Partial<GroupEvent>): { valid: boolean; error?: string } {
        if (!data.name || data.name.length < 3) {
            return { valid: false, error: "Le nom de l'événement est requis." };
        }
        
        if (!data.covers?.initial || data.covers.initial <= 0) {
            return { valid: false, error: "Le nombre d'invités doit être positif." };
        }

        return { valid: true };
    }
}
