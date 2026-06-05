import { initializeApp, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getTenantConfig } from '@/instances';

export interface TenantFirebaseContext {
    app: FirebaseApp;
    firestore: Firestore;
    auth: Auth;
    storage: FirebaseStorage;
}

const initializedTenants = new Map<string, TenantFirebaseContext>();

/**
 * Charge dynamiquement une instance Firebase, garantissant l'Isolation Physique (Multi-Firebase).
 * @param tenantId Cible de l'instance
 */
export function getTenantFirebase(tenantId: string): TenantFirebaseContext {
    const existing = initializedTenants.get(tenantId);
    if (existing) {
        return existing;
    }

    const config = getTenantConfig(tenantId);
    if (!config) {
        throw new Error(`Instance non reconnue : ${tenantId}`);
    }

    // --- MODE RÉSILIENCE / MOCK ---
    // Si la clé API est absente (ex: config local sans secrets), on fournit un Mock
    const isConfigMissing = !config.firebase || !config.firebase.apiKey || config.firebase.apiKey === "";
    
    if (isConfigMissing) {
        console.warn(`[EmpireMode] 🛡️ Firebase Config manquante pour ${tenantId}. Activation du Bouclier DUMMY.`);
        
        const dummyConfig = {
            apiKey: `AIzaDummy_${tenantId}_2026`,
            authDomain: `${tenantId}-dummy.firebaseapp.com`,
            projectId: `${tenantId}-dummy`,
            storageBucket: `${tenantId}-dummy.appspot.com`,
            messagingSenderId: "000000000000",
            appId: `1:000000000000:web:${tenantId}000000`
        };

        const app = initializeApp(dummyConfig, tenantId);
        const fbFirestore = getFirestore(app);
        (fbFirestore as Firestore & { isMock?: boolean }).isMock = true; // Flag for our contexts

        const mockContext: TenantFirebaseContext = {
            app,
            firestore: fbFirestore,
            auth: getAuth(app),
            storage: getStorage(app),
        };
        initializedTenants.set(tenantId, mockContext);
        return mockContext;
    }

    let app: FirebaseApp;
    
    try {
        app = getApp(tenantId);
    } catch (_e) {
        try {
            app = initializeApp(config.firebase as import('firebase/app').FirebaseOptions, tenantId);
        } catch (initErr) {
            console.error(`[EmpireMode] Échec initialisation Firebase pour ${tenantId}. Repli sur MOCK.`, initErr);
            return getTenantFirebase(tenantId + '_mock_fallback'); // Recursion safe if we handle it
        }
    }

    const tenantContext: TenantFirebaseContext = {
        app,
        firestore: getFirestore(app),
        auth: getAuth(app),
        storage: getStorage(app),
    };

    initializedTenants.set(tenantId, tenantContext);
    
    return tenantContext;
}
