import Dexie, { Table } from 'dexie';
import { Order, StockItem, InventoryMovement, JournalEntry, FiscalSeal, Recipe } from '@/types';
import { TenantConfig } from '@/shared/nexus-contract';
import type { ImmunityLogEntry } from '@/shared/genome.types';

/**
 * 📥 SyncOperation - Restaurant OS Offline
 * Définit une opération de synchronisation en attente.
 */
export interface SyncOperation {
    id?: number;
    type: 'NF525_PAYMENT' | 'STOCK_UPDATE' | 'JOURNAL_ENTRY' | 'FISCAL_SEAL' | 'GENERIC_UPDATE';
    action: 'SET' | 'UPDATE' | 'DELETE' | 'COMMIT_BATCH';
    collection: string;
    targetId: string;
    payload: unknown; // Données complètes de la transaction ou du changement
    timestamp: string;
    status: 'pending' | 'syncing' | 'failed';
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
    /** Grade X: Suture des Recettes pour le calcul offline */
    recipes!: Table<Recipe>;

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
    }

    /**
     * Initialise la base de données avec des valeurs par défaut si vide
     */
    async clearAll() {
        await this.orders.clear();
        await this.stockItems.clear();
        await this.inventoryMovements.clear();
        await this.journalEntries.clear();
        await this.fiscalSeals.clear();
        await this.syncQueue.clear();
        // Note: immunityLogs n'est PAS purgé par clearAll.
        // La Boîte Noire est inaltérable par conception.
    }
}

// Instance unique de la base de données exportée
export const db = new RestaurantOfflineDB();
