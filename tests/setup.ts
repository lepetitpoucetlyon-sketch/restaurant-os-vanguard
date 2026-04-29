import { vi } from 'vitest';

// 🏛️ RESTAURANT OS - MASTER TEST SHIELD
// Protection globale contre les initialisations Firebase/Dexie/IDB
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { MockAdapter } from '@/infrastructure/adapters/MockAdapter';
import { Order } from '@/modules/ops/types';
import { StockItem, InventoryMovement } from '@/modules/inventory/types';
import { JournalEntry, FiscalSeal } from '@/modules/finance/types';

// Initialisation immédiate du Mock pour les tests
Nexus.adapter = new MockAdapter();

const mockTableData = new Set<string>();

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
    onSnapshot: vi.fn(() => vi.fn()) // Returns an unsubscribe function
}));

vi.mock('firebase/storage', () => ({ getStorage: vi.fn() }));

// 2. Mock de @/lib/firebase (Pour court-circuiter l'initialisation réelle)
vi.mock('@/lib/firebase', () => ({
    firestore: {},
    auth: {},
    storage: {},
    firebaseApp: {}
}));

type MockDatabaseItem = Order | StockItem | InventoryMovement | JournalEntry | FiscalSeal;

const mockTable = {
    clear: vi.fn().mockImplementation(async () => {
        mockTableData.clear();
    }),
    add: vi.fn().mockImplementation(async (item: MockDatabaseItem) => {
        mockTableData.add(item.id);
        return item.id;
    }),
    put: vi.fn().mockImplementation(async (item: MockDatabaseItem) => {
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
    sortBy: vi.fn().mockResolvedValue([]),
    orderBy: vi.fn().mockReturnThis(),
    last: vi.fn().mockResolvedValue(undefined),
    bulkPut: vi.fn().mockResolvedValue(undefined),
};

const mockDb = {
    clearAll: vi.fn().mockImplementation(async () => {
        mockTableData.clear();
        return true;
    }),
    transaction: vi.fn().mockImplementation((_type, _tables, cb) => cb()),
    orders: mockTable,
    stockItems: mockTable,
    inventoryMovements: mockTable,
    journalEntries: mockTable,
    fiscalSeals: mockTable,
    syncQueue: mockTable,
};


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
    }
    return { default: MockDexie, Dexie: MockDexie };
});

vi.mock('@/lib/offline/offline-store', () => ({
    db: mockDb
}));

// 4. Utils
Object.defineProperty(global, 'performance', {
    value: { now: () => Date.now() },
    writable: true
});

console.log('🏛️  [FALANGE MASTER SHIELD] Environment Neutralized.');
