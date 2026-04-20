// @ts-nocheck
import { vi } from 'vitest';

/**
 * 🛠️ OMNI-VANGUARD MOCK INFRASTRUCTURE (GRADE VI)
 * Centralise les mocks pour éviter la pollution des tests.
 */

// 1. MOCK LOGGER
vi.mock('@/lib/logger', () => ({
    logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        group: vi.fn(),
        groupEnd: vi.fn(),
        time: vi.fn(),
        timeEnd: vi.fn(),
    },
    default: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    }
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
        // Simule un snapshot vide par défaut
        if (typeof cb === 'function') {
            cb({ docs: [], empty: true });
        }
        return vi.fn(); // Unsubscribe mock
    }),
    addDoc: vi.fn(async () => ({ id: 'new-id' })),
    updateDoc: vi.fn(async () => {}),
    doc: vi.fn(() => ({ id: 'mock-doc' })),
    CACHE_SIZE_UNLIMITED: 'unlimited',
}));

// 2b. MOCK OFFLINE STORE (Dexie)
const createTableMock = () => ({
    bulkPut: vi.fn(async () => {}),
    toArray: vi.fn(async () => []),
    clear: vi.fn(async () => {}),
    put: vi.fn(async () => {}),
    where: vi.fn().mockReturnThis(),
    equals: vi.fn().mockReturnThis(),
    delete: vi.fn(async () => {}),
});

vi.mock('@/lib/offline/offline-store', () => ({
    db: {
        fiscalSeals: createTableMock(),
        orders: createTableMock(),
        stockItems: createTableMock(),
        tables: createTableMock(),
        categories: createTableMock(),
        shifts: createTableMock(),
        ledger: createTableMock(),
        clearAll: vi.fn(async () => {}),
    }
}));

// 3. MOCK CRYPTO (Si nécessaire pour certains environnements Node anciens)
if (typeof global.crypto === 'undefined') {
    (global as any).crypto = {
        subtle: {
            digest: vi.fn(),
        },
        randomUUID: vi.fn(() => 'mock-uuid'),
    };
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
    whiteLabelInstanceConfig: {
        identityDefaults: {
            name: 'Restaurant Test',
        },
        firebase: {
            apiKey: 'AIzaDummy-Test-Key'
        }
    }
}));

// 6. MOCK FIREBASE UTILS (GRADE VI SAAS)
vi.mock('@/lib/firebase', () => ({
    getTenantPath: vi.fn((relativePath, tenantIdOverride) => {
        if (tenantIdOverride) return `tenants/${tenantIdOverride}/${relativePath}`;
        return relativePath;
    }),
    firestore: { id: 'mock-db' },
    auth: { id: 'mock-auth' },
    storage: { id: 'mock-storage' },
    db: { id: 'mock-db' },
    isMock: true
}));
