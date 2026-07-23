import { vi } from 'vitest';

/**
 * 🛠️ OMNI-VANGUARD MOCK INFRASTRUCTURE (GRADE VI)
 * Centralise les mocks pour éviter la pollution des tests.
 */

// 1. MOCK LOGGER
export const mockLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    group: vi.fn(),
    groupEnd: vi.fn(),
    time: vi.fn(),
    timeEnd: vi.fn(),
};

vi.mock('@/lib/logger', () => ({
    logger: mockLogger,
    default: mockLogger
}));

// 2. MOCK FIREBASE APP & FIRESTORE
vi.mock('firebase/app', () => ({
    initializeApp: vi.fn(() => ({ name: 'EMPIRE_CORE' })),
    getApps: vi.fn(() => []),
    getApp: vi.fn(() => ({ name: 'EMPIRE_CORE' })),
}));

vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(() => ({ id: 'mock-auth' })),
}));

vi.mock('firebase/storage', () => ({
    getStorage: vi.fn(() => ({ id: 'mock-storage' })),
}));

vi.mock('firebase/functions', () => ({
    getFunctions: vi.fn(() => ({ id: 'mock-functions' })),
    httpsCallable: vi.fn(() => vi.fn(async () => ({ data: {} }))),
}));

vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(() => ({ id: 'mock-db' })),
    initializeFirestore: vi.fn(() => ({ id: 'mock-db' })),
    persistentLocalCache: vi.fn((opts) => ({ type: 'persistent', ...opts })),
    persistentMultipleTabManager: vi.fn(() => ({ type: 'multiTab' })),
    collection: vi.fn(() => ({ id: 'mock-collection' })),
    query: vi.fn(() => ({ id: 'mock-query' })),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    getDocs: vi.fn(async () => ({
        docs: []
    })),
    onSnapshot: vi.fn((q, cb) => {
        // Simule un snapshot vide par défaut conforme
        if (typeof cb === 'function') {
            cb({ 
                docs: [], 
                empty: true,
                exists: () => false,
                data: () => ({})
            });
        }
        return vi.fn(); // Unsubscribe mock
    }),
    addDoc: vi.fn(async () => ({ id: 'new-id' })),
    updateDoc: vi.fn(async () => {}),
    doc: vi.fn(() => ({ id: 'mock-doc' })),
    CACHE_SIZE_UNLIMITED: 'unlimited',
}));

// 2b. MOCK OFFLINE STORE (Dexie)
function createTableMock() {
    let internalStore: any[] = [];
    return {
        bulkPut: vi.fn(async (items) => { 
            if (Array.isArray(items)) internalStore.push(...items); 
        }),
        toArray: vi.fn(async () => internalStore),
        clear: vi.fn(async () => { internalStore = []; }),
        put: vi.fn(async (item) => { if (item) internalStore.push(item); }),
        add: vi.fn(async (item) => { if (item) internalStore.push(item); }),
        get: vi.fn(async () => undefined),
        count: vi.fn(async () => internalStore.length),
        where: vi.fn().mockReturnThis(),
        equals: vi.fn().mockReturnThis(),
        anyOf: vi.fn().mockReturnThis(),   // SyncManager.processQueue : where('status').anyOf(...)
        sortBy: vi.fn(async () => internalStore),
        update: vi.fn(async () => undefined),
        first: vi.fn(async () => undefined),
        orderBy: vi.fn().mockReturnThis(),
        reverse: vi.fn().mockReturnThis(),
        delete: vi.fn(async () => { internalStore.pop(); }),
    };
}

const mockTables: Record<string, ReturnType<typeof createTableMock>> = {
    fiscalSeals: createTableMock(),
    orders: createTableMock(),
    stockItems: createTableMock(),
    inventoryMovements: createTableMock(),
    journalEntries: createTableMock(),
    syncQueue: createTableMock(),
    config: createTableMock(),
    immunityLogs: createTableMock(),
    recipes: createTableMock(),
};

vi.mock('@/lib/offline/offline-store', () => ({
    db: {
        ...mockTables,
        clearAll: vi.fn(async () => {
            for (const table of Object.values(mockTables)) {
                await table.clear();
            }
        }),
    }
}));

// 3. MOCK CRYPTO (Standardizes behavior across Node/Browser)
if (typeof global.crypto === 'undefined' || (global.crypto as any)._isMock) {
    const mockCrypto = {
        _isMock: true,
        subtle: {
            digest: vi.fn(async (_algo, _data) => {
                // Return a dummy but valid ArrayBuffer (32 bytes for SHA-256 simulation)
                return new Uint8Array(32).fill(0).buffer;
            }),
        },
        randomUUID: vi.fn(() => 'mock-uuid'),
        getRandomValues: vi.fn((arr) => arr),
    };
    
    Object.defineProperty(global, 'crypto', {
        value: mockCrypto,
        writable: true,
        configurable: true
    });
}


// 4. MOCK JOTAI (Storage/Store)
vi.mock('jotai', async () => {
    const actual = await vi.importActual('jotai');
    return {
        ...actual,
        getDefaultStore: vi.fn(() => ({
            get: vi.fn(),
            set: vi.fn(),
            sub: vi.fn(() => vi.fn()),
        })),
    };
});

// 5. MOCK CONFIGURATION
vi.mock('@/config/instance', () => ({
    APP_MODE: 'tenant',
    isMCCMode: () => false,
    isTenantMode: () => true,
    DEFAULT_TENANT_ID: 'lepetitpoucet',
    whiteLabelInstanceConfig: {
        identityDefaults: {
            name: 'Restaurant Test',
        },
        firebase: {
            apiKey: 'AIzaDummy-Test-Key'
        }
    }
}));

vi.mock('@/lib/firebase', () => ({
    firestore: { id: 'mock-db' },
    auth: { id: 'mock-auth' },
    storage: { id: 'mock-storage' },
    db: { id: 'mock-db' },
    isMock: true
}));
