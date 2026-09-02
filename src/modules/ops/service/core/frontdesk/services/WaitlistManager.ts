import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export interface WaitlistEntry {
    id: string;
    customerName: string;
    partySize: number;
    phone: string;
    quotedTimeMinutes: number;
    joinedAt: number;
    status: 'waiting' | 'notified' | 'seated' | 'cancelled';
}

/**
 * @wip ops-service — Échéance: 2026-11-01
 * 📝 C5.3: Waitlist Manager
 * Gère la file d'attente (Walk-ins) séparément des réservations.
 */
export class WaitlistManager {
    
    /**
     * Ajoute un client à la file d'attente.
     */
    static async addToWaitlist(tenantId: string, entry: Omit<WaitlistEntry, 'id' | 'joinedAt' | 'status'>): Promise<WaitlistEntry> {
        logger.info(`[Waitlist] Ajout de ${entry.customerName} pour ${entry.partySize} pax (Tenant: ${tenantId})`);
        
        const newEntry: WaitlistEntry = {
            id: `wl-${Date.now()}`,
            ...entry,
            joinedAt: Date.now(),
            status: 'waiting'
        };

        // Persistance via Nexus
        await Nexus.adapter.set(`tenants/${tenantId}/waitlist/${newEntry.id}`, newEntry);
        
        // Envoi SMS via Webhook (Simulé ici)
        logger.info(`[Waitlist] SMS Envoyé à ${newEntry.phone}: "Vous êtes sur liste d'attente. Temps estimé: ${newEntry.quotedTimeMinutes} min."`);

        return newEntry;
    }

    /**
     * Notifie le client que sa table est prête.
     */
    static async notifyCustomer(tenantId: string, entryId: string): Promise<void> {
        const entry = await Nexus.adapter.get<WaitlistEntry>(`tenants/${tenantId}/waitlist/${entryId}`);
        if (!entry) throw new Error("Entrée introuvable.");

        entry.status = 'notified';
        await Nexus.adapter.set(`tenants/${tenantId}/waitlist/${entryId}`, entry);

        // SMS "Votre table est prête"
        logger.info(`[Waitlist] SMS Envoyé à ${entry.phone}: "Votre table est prête ! Veuillez vous présenter à l'accueil."`);
    }

    /**
     * Place le client (Seat).
     */
    static async seatCustomer(tenantId: string, entryId: string, tableId: string, operatorId: string): Promise<void> {
        const entry = await Nexus.adapter.get<WaitlistEntry>(`tenants/${tenantId}/waitlist/${entryId}`);
        if (!entry) throw new Error("Entrée introuvable.");

        entry.status = 'seated';
        await Nexus.adapter.set(`tenants/${tenantId}/waitlist/${entryId}`, entry);

        // Crée automatiquement une commande POS liée à la table
        // (Émet un event au lieu de coupler fortement)
        await NexusEventBus.emitDurable('order.placed', {
            v: 1,
            orderId: `ord-wl-${entryId}`,
            tableId,
            tenantId,
            operatorId,
            items: []
        } as never); // cast pour simplifier dans cet exemple

        logger.info(`[Waitlist] Client ${entry.customerName} placé à la table ${tableId}`);
    }
}
