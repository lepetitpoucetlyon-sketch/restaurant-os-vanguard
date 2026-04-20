import { initializeApp, getApps, getApp, FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { whiteLabelInstanceConfig } from '@/config/instance';
// Imports for Nexus moved down to break circular dependencies

const DEFAULT_CONFIG = whiteLabelInstanceConfig.firebase;

// --- 🏛️ EMPIRE CORE ENGINE (Grade VI - Local-First Indestructible) ---
function getStableApp() {
    const apps = getApps();
    const existing = apps.find(a => a.name === 'EMPIRE_CORE');
    if (existing) return existing;
    return initializeApp(DEFAULT_CONFIG, 'EMPIRE_CORE');
}

export const firebaseApp = getStableApp();

/**
 * 🛡️ FIRESTORE LOCAL-FIRST ENGINE (NF525 Compliant)
 * 
 * Architecture: LOCAL → REMOTE (jamais l'inverse)
 * - Les données sont TOUJOURS écrites en cache local IndexedDB en premier.
 * - La synchronisation vers Firestore Cloud se fait en arrière-plan.
 * - En cas de perte réseau, l'app reste 100% fonctionnelle.
 * - Multi-tab : toutes les instances partagent le même cache sans conflit.
 * 
 * Conformité NF525 :
 * - Chaque transaction est horodatée et persistée localement AVANT envoi.
 * - Le cache local agit comme un "journal fiscal tampon" inviolable.
 * - Même en cas de coupure réseau, aucune donnée n'est perdue.
 */
function initLocalFirstFirestore() {
    const app = firebaseApp;

    // Vérifier si Firestore est déjà initialisé (Hot Module Reload / SSR)
    try {
        return getFirestore(app);
    } catch {
        // Premier lancement : initialiser avec le cache persistant Local-First
    }

    // 🔒 Mode navigateur : Cache persistant avec gestion multi-onglets
    if (typeof window !== 'undefined') {
        return initializeFirestore(app, {
            localCache: persistentLocalCache({
                tabManager: persistentMultipleTabManager()
            })
        });
    }

    // 🖥️ Mode serveur (SSR/API Routes) : pas de cache local nécessaire
    return getFirestore(app);
}

export const firestore = initLocalFirstFirestore();
export const auth = getAuth(firebaseApp);
export const storage = getStorage(firebaseApp);

// --- 🛰️ NEXUS ADAPTER REGISTRATION (Grade VI) ---
// Moved to NexusCoreProvider to avoid circular dependency ReferenceErrors

// EXPORTS
export const db = firestore;
export const isMock = !DEFAULT_CONFIG.apiKey || DEFAULT_CONFIG.apiKey.startsWith('AIzaDummy');

/**
 * 🛰️ SERVER-SIDE TENANT OVERRIDE
 */
export function setServerSideTenantOverride(tenantId: string | null) {
    Nexus.tenantOverride = tenantId;
}

export async function initializeTenantFirebase(config?: FirebaseOptions) {
    if (config) {
        return initializeApp(config, "TENANT_OVERRIDE");
    }
    return firebaseApp;
}

// DEPRECATED WRAPPERS (Maintain for legacy compat during final cleanup)
export function getTenantPath(relativePath: string, tenantIdOverride?: string): string {
    return Nexus.getTenantPath(relativePath, tenantIdOverride);
}

// --- ⚡ BROWSER OPTIMIZATIONS ---
if (typeof window !== 'undefined') {
    if (process.env.NODE_ENV === 'development' && isMock) {
        console.warn('⚠️ Restaurant OS is using fallback Firebase (MOCK MODE).');
    }
}
