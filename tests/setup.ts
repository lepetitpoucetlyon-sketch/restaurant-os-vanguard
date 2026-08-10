import { vi } from 'vitest';

// 🔑 Clé de scellement NF525 pour les tests — reflète l'env serveur réel.
// FiscalKeyService refuse de sceller sans clé (plus de repli 'default_instance').
process.env.FISCAL_SIGNING_SECRET = 'test-fiscal-signing-secret';

// 🏛️ RESTAURANT OS - MASTER TEST SHIELD
// Protection globale contre les initialisations Firebase/Dexie/IDB
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { MockAdapter } from '@/lib/adapters/MockAdapter';

// Initialisation immédiate du Mock pour les tests
Nexus.adapter = new MockAdapter();

// Mock LLMManager global
import { LLMManager } from '@/modules/intelligence/ia/ai/LLMManager';
LLMManager.provider = {
    generateText: vi.fn().mockResolvedValue('Mocked LLM Response'),
    generateJson: vi.fn().mockResolvedValue({ mocked: true }),
    generateEmbeddings: vi.fn().mockResolvedValue([0.1, 0.2]),
    generateFromImage: vi.fn().mockResolvedValue('Mocked OCR Text'),
};

// 1. Mock de Firebase (Tous les services)
vi.mock('firebase/app', () => ({ initializeApp: vi.fn(), getApps: vi.fn(() => []), getApp: vi.fn() }));
vi.mock('firebase/auth', () => ({ getAuth: vi.fn(() => ({})), onAuthStateChanged: vi.fn() }));
vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(),
    collection: vi.fn(),
    doc: vi.fn((db, path) => ({ _type: 'documentRef', db, path })),
    setDoc: vi.fn(),
    getDoc: vi.fn(),
    query: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    getDocs: vi.fn(),
    updateDoc: vi.fn(),
    where: vi.fn(),
    onSnapshot: vi.fn(() => vi.fn()),
    writeBatch: vi.fn().mockReturnValue({
        set: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined)
    }),
    increment: vi.fn((amount) => ({ _type: 'increment', amount }))
}));
vi.mock('firebase/storage', () => ({ getStorage: vi.fn() }));
vi.mock('@/lib/firebase', () => ({ firestore: {}, auth: {}, storage: {}, firebaseApp: {} }));

// 2. Mock avancé pour Dexie (avec persistance basique en Map)
const { mockDb } = vi.hoisted(() => {
    const createMockTable = () => {
        const tableData = new Map<string, any>();
        const table = {
            clear: vi.fn().mockImplementation(async () => {
                tableData.clear();
            }),
            add: vi.fn().mockImplementation(async (item: any) => {
                const key = item.id || item.path || item.tenantId || item[Object.keys(item)[0]];
                tableData.set(key, item);
                return key;
            }),
            put: vi.fn().mockImplementation(async (item: any) => {
                const key = item.id || item.path || item.tenantId || item[Object.keys(item)[0]];
                tableData.set(key, item);
                return key;
            }),
            count: vi.fn().mockImplementation(async () => tableData.size),
            update: vi.fn().mockImplementation(async (key, changes) => {
                const existing = tableData.get(key) || {};
                tableData.set(key, { ...existing, ...changes });
            }),
            get: vi.fn().mockImplementation(async (key: string) => {
                return tableData.get(key);
            }),
            toArray: vi.fn().mockImplementation(async () => Array.from(tableData.values())),
            where: vi.fn().mockReturnThis(),
            equals: vi.fn().mockReturnThis(),
            filter: vi.fn().mockImplementation((predicate: any) => {
                 return {
                     toArray: async () => Array.from(tableData.values()).filter(predicate)
                 };
            }),
            anyOf: vi.fn().mockReturnThis(),
            sortBy: vi.fn().mockResolvedValue([]),
            orderBy: vi.fn().mockReturnThis(),
            reverse: vi.fn().mockReturnThis(),
            first: vi.fn().mockResolvedValue(undefined),
            last: vi.fn().mockResolvedValue(undefined),
            delete: vi.fn().mockImplementation(async (key: string) => {
                tableData.delete(key);
            }),
            bulkPut: vi.fn().mockResolvedValue(undefined),
        };
        return table;
    };

    const mockDb = {
        clearAll: vi.fn().mockImplementation(async () => {
            Object.keys(mockDb).forEach(key => {
                if (key !== 'clearAll' && key !== 'transaction' && mockDb[key as keyof typeof mockDb]?.clear) {
                    mockDb[key as keyof typeof mockDb].clear();
                }
            });
            return true;
        }),
        transaction: vi.fn().mockImplementation(async (_type: any, _tables: any, cb: any) => {
            return cb();
        }),
        orders: createMockTable(),
        stockItems: createMockTable(),
        inventoryMovements: createMockTable(),
        journalEntries: createMockTable(),
        fiscalSeals: createMockTable(),
        syncQueue: createMockTable(),
        busOutbox: createMockTable(),
        deadLetterEvents: createMockTable(),
        config: createMockTable(),
        immunityLogs: createMockTable(),
        jetEntries: createMockTable(),
        recipes: createMockTable(),
        virtualStore: createMockTable(),
    };
    
    return { mockDb };
});

vi.mock('dexie', () => {
    class MockDexie {
        version() { return this; }
        stores() { return this; }
        on() { return this; }
        open() { return Promise.resolve(this); }
        transaction = mockDb.transaction;
        orders = mockDb.orders;
        stockItems = mockDb.stockItems;
        inventoryMovements = mockDb.inventoryMovements;
        journalEntries = mockDb.journalEntries;
        fiscalSeals = mockDb.fiscalSeals;
        syncQueue = mockDb.syncQueue;
        busOutbox = mockDb.busOutbox;
        deadLetterEvents = mockDb.deadLetterEvents;
        config = mockDb.config;
        immunityLogs = mockDb.immunityLogs;
        jetEntries = mockDb.jetEntries;
        recipes = mockDb.recipes;
        virtualStore = mockDb.virtualStore;
    }
    return { default: MockDexie, Dexie: MockDexie, Table: class {} };
});

vi.mock('@/infrastructure/services/offline/offline-store', () => ({
    db: mockDb
}));

// 4. Utils
Object.defineProperty(global, 'performance', {
    value: { now: () => Date.now() },
    writable: true
});

console.log('🏛️  [FALANGE MASTER SHIELD] Environment Neutralized.');
