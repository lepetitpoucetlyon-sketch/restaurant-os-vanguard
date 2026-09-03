import Dexie, { type Table } from 'dexie';
import type { Order, StockItem, InventoryMovement, JournalEntry, FiscalSeal, Recipe } from '@nexus/contracts';
import type { TenantConfig, SovereignField } from "@/shared/nexus/contracts";
import type { ImmunityLogEntry } from '@shared/genome.types';

/**
 * 📥 BusOutboxEntry - Restaurant OS Offline
 * Définit un événement métier en attente d'émission sur le NexusEventBus.
 */
export interface BusOutboxEntry {
    id: string;           // crypto.randomUUID()
    eventName: string;
    payload: unknown;
    createdAt: number;
    attempts: number;
    status: 'pending' | 'done' | 'failed';
}

/**
 * 📥 DeadLetterEntry - Restaurant OS Offline
 * Événement métier dont le handler a échoué. En quarantaine pour retry manuel ou différé.
 */
export interface DeadLetterEntry {
    id: string;
    eventName: string;
    payload: unknown;
    handlerId: string;
    error: string;
    failedAt: number;
    attempts: number;        // max 5 → quarantine
    nextRetryAt: number;     // backoff exponentiel
    status: 'retry' | 'quarantine';
}

/**
 * 📥 SyncOperation - Restaurant OS Offline
 * Définit une opération de synchronisation en attente.
 */
export interface SyncOperation {
    id?: number;
    type: 'NF525_PAYMENT' | 'STOCK_UPDATE' | 'JOURNAL_ENTRY' | 'FISCAL_SEAL' | 'GENERIC_UPDATE' | 'MUTATION' | 'NF525_JET';
    action: 'SET' | 'UPDATE' | 'DELETE' | 'COMMIT_BATCH' | 'CREATE';
    collection: string;
    targetId: string;
    payload: SovereignField; // Données complètes de la transaction ou du changement
    timestamp: string;
    status: 'pending' | 'syncing' | 'failed' | 'quarantined';
    priority: number; // 0: Normal, 1: High (Fiscal)
    attempts: number;
    lastError?: string;
}

/**
 * 🏢 RestaurantOfflineDB - Restaurant OS
 * Base de données locale IndexedDB pour la résilience et le mode déconnecté.
 * 
 * Grade IX: Ajout de la table immunityLogs (Boîte Noire).
 * Migration additive — les données existantes sont préservées à 100%.
 */
export class RestaurantOfflineDB extends Dexie {
    orders!: Table<Order>;
    stockItems!: Table<StockItem>;
    inventoryMovements!: Table<InventoryMovement>;
    journalEntries!: Table<JournalEntry>;
    fiscalSeals!: Table<FiscalSeal>;
    syncQueue!: Table<SyncOperation>;
    config!: Table<TenantConfig>;
    /** Grade IX: Boîte Noire des rejets du GenomeValidator */
    immunityLogs!: Table<ImmunityLogEntry>;
    /** NF525 JET — Journal des Événements Techniques */
    jetEntries!: Table<import('@shared/genome.types').JetEntry>;
    /** Grade X: Suture des Recettes pour le calcul offline */
    recipes!: Table<Recipe>;
    /** P0-1: EventOutbox pour le NexusEventBus */
    busOutbox!: Table<BusOutboxEntry>;
    /** P0-2: Dead Letter Queue (DLQ) pour les handlers du NexusEventBus */
    deadLetterEvents!: Table<DeadLetterEntry>;
    /** Invariant #1: Log d'idempotence et de-duplication des événements du Bus */
    processedEvents!: Table<{ id: string; eventId: string; handlerId: string; eventName: string; tenantId?: string; processedAt: number }>;

    constructor() {
        super('RestaurantOS_Offline');
        
        // Version 2 of the schema (Omphalos Suture) — PRÉSERVÉ INTACT
        this.version(2).stores({
            orders: 'id, status, timestamp, tableId',
            stockItems: 'id, ingredientId, status',
            inventoryMovements: 'id, ingredientId, timestamp, salesId',
            journalEntries: 'id, date, pieceNumber, referenceId',
            fiscalSeals: 'id, transactionId, hash, timestamp',
            syncQueue: '++id, status, timestamp, collection, type',
            config: 'id', // Primary key is tenantId
            recipes: 'id, name' // Grade X Suture
        });

        // Version 3 — Grade IX: Ajout Boîte Noire (migration additive uniquement)
        this.version(3).stores({
            immunityLogs: '++id, timestamp, moduleId, reason'
        });

        // Version 4 — Grade X: Consolidation totale Vanguard (Suture intégrale)
        this.version(4).stores({
            orders: 'id, status, timestamp, tableId',
            stockItems: 'id, ingredientId, status',
            inventoryMovements: 'id, ingredientId, timestamp, salesId',
            journalEntries: 'id, date, pieceNumber, referenceId',
            fiscalSeals: 'id, transactionId, hash, timestamp',
            syncQueue: '++id, status, timestamp, collection, type',
            config: 'id',
            immunityLogs: '++id, timestamp, moduleId, reason',
            recipes: 'id, name'
        });

        // Version 5 — NF525 JET (Journal des Événements Techniques)
        this.version(5).stores({
            jetEntries: '++id, timestamp, eventType, deviceId'
        });

        // Version 6 — P0 (EventOutbox et DLQ pour le NexusEventBus)
        this.version(6).stores({
            busOutbox: 'id, status, eventName',
            deadLetterEvents: 'id, status, eventName, handlerId, nextRetryAt'
        });

        // Version 7 — Invariant #1 (Idempotence de l'EventBus & De-duplication log)
        this.version(7).stores({
            processedEvents: 'id, eventId, handlerId, eventName, processedAt'
        });
    }

    /**
     * Purge uniquement les caches de lecture opérationnels.
     * NE TOUCHE JAMAIS à la syncQueue, aux processedEvents ni à la Boîte Noire immunityLogs.
     */
    async clearReadCaches() {
        await this.orders.clear();
        await this.stockItems.clear();
        await this.inventoryMovements.clear();
        await this.journalEntries.clear();
        await this.fiscalSeals.clear();
    }

    /**
     * @deprecated Utiliser clearReadCaches().
     * Pour préserver l'inaltérabilité et la résilience hors-ligne (F5),
     * cette méthode purge les caches de lecture mais NE PURGE PLUS la syncQueue.
     */
    async clearAll() {
        await this.clearReadCaches();
        // syncQueue n'est intentionnellement PAS purgée ici pour éviter la perte
        // de tickets ou de mutations hors-ligne lors des transitions de routes.
    }

    /**
     * Réservé aux tests unitaires isolés nécessitant une réinitialisation absolue.
     */
    async dangerouslyClearSyncQueue() {
        await this.syncQueue.clear();
    }
}

// Instance unique de la base de données exportée
export const db = new RestaurantOfflineDB();
