import { vi } from 'vitest';

// 🔑 Clé de scellement NF525 pour les tests — reflète l'env serveur réel.
// FiscalKeyService refuse de sceller sans clé (plus de repli 'default_instance').
process.env.FISCAL_SIGNING_SECRET = 'test-fiscal-signing-secret';

// 🏛️ RESTAURANT OS - MASTER TEST SHIELD
// Protection globale contre les initialisations Firebase/Dexie/IDB
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { MockAdapter } from '@/infrastructure/adapters/MockAdapter';
import { Order } from '@/modules/ops/types';
import { StockItem, InventoryMovement } from '@/modules/inventory/types';
import { JournalEntry, FiscalSeal } from '@/modules/finance/types';

// Initialisation immédiate du Mock pour les tests
Nexus.adapter = new MockAdapter();

const { mockTableData, mockTable, mockDb } = vi.hoisted(() => {
    const mockTableData = new Set<string>();

    const mockTable = {
        clear: vi.fn().mockImplementation(async () => {
            mockTableData.clear();
        }),
        add: vi.fn().mockImplementation(async (item: any) => {
            mockTableData.add(item.id);
            return item.id;
        }),
        put: vi.fn().mockImplementation(async (item: any) => {
            mockTableData.add(item.id);
            return item.id;
        }),
        count: vi.fn().mockImplementation(async () => {
            return mockTableData.size;
        }),
        update: vi.fn().mockResolvedValue(undefined),
        get: vi.fn().mockResolvedValue(undefined),
        toArray: vi.fn().mockResolvedValue([]),
        where: vi.fn().mockReturnThis(),
        equals: vi.fn().mockReturnThis(),
        anyOf: vi.fn().mockReturnThis(),
        sortBy: vi.fn().mockResolvedValue([]),
        orderBy: vi.fn().mockReturnThis(),
        reverse: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(undefined),
        last: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined),
        bulkPut: vi.fn().mockResolvedValue(undefined),
    };

    const mockDb = {
        clearAll: vi.fn().mockImplementation(async () => {
            mockTableData.clear();
            return true;
        }),
        transaction: vi.fn().mockImplementation((_type: any, _tables: any, cb: any) => cb()),
        orders: mockTable,
        stockItems: mockTable,
        inventoryMovements: mockTable,
        journalEntries: mockTable,
        fiscalSeals: mockTable,
        syncQueue: mockTable,
        busOutbox: mockTable,
        deadLetterEvents: mockTable,
    };
    
    return { mockTableData, mockTable, mockDb };
});

// 3. Mock de Dexie
vi.mock('dexie', () => {
    class MockDexie {
        version() { return this; }
        stores() { return this; }
        on() { return this; }
        open() { return Promise.resolve(this); }
        transaction = mockDb.transaction;
        orders = mockTable;
        stockItems = mockTable;
        inventoryMovements = mockTable;
        journalEntries = mockTable;
        fiscalSeals = mockTable;
        syncQueue = mockTable;
        busOutbox = mockTable;
        deadLetterEvents = mockTable;
    }
    return { default: MockDexie, Dexie: MockDexie };
});

vi.mock('@/infrastructure/services/offline/offline-store', () => ({
    db: mockDb
}));

// 1. Mock de Firebase (Tous les services)
vi.mock('firebase/app', () => ({ initializeApp: vi.fn(), getApps: vi.fn(() => []), getApp: vi.fn() }));
vi.mock('firebase/auth', () => ({ getAuth: vi.fn(() => ({})), onAuthStateChanged: vi.fn() }));
vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(),
    collection: vi.fn(),
    doc: vi.fn(),
    setDoc: vi.fn(),
    getDoc: vi.fn(),
    query: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    getDocs: vi.fn(),
    updateDoc: vi.fn(),
    where: vi.fn(),
    onSnapshot: vi.fn(() => vi.fn())
}));
vi.mock('firebase/storage', () => ({ getStorage: vi.fn() }));
vi.mock('@/lib/firebase', () => ({ firestore: {}, auth: {}, storage: {}, firebaseApp: {} }));

// 4. Utils
Object.defineProperty(global, 'performance', {
    value: { now: () => Date.now() },
    writable: true
});

console.log('🏛️  [FALANGE MASTER SHIELD] Environment Neutralized.');
