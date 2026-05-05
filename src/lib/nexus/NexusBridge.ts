import { 
  doc, 
  onSnapshot, 
  Unsubscribe
} from 'firebase/firestore';
import { getDefaultStore } from 'jotai';
import { tenantConfigAtom } from '@nexus/state/SovereignGenome';
import { db } from '@/lib/offline/offline-store';
import { TenantConfig, DEFAULT_TENANT_CONFIG } from '@/shared/nexus-contract';
import { RESTAURANT_FULL_DNA } from '@shared/seeds/restaurant-full-dna';

interface LegacyTenantConfig {
  features?: Record<string, boolean>;
  layout?: string;
  laws?: Record<string, boolean>;
}

import { firestore } from '@/lib/firebase';

/**
 * 🛰️ NexusBridge - The Command Omphalos
 * Establishes a real-time, resilient link between the MCC and the OS.
 */
export class NexusBridge {
  private static unsubscribe: Unsubscribe | null = null;
  private static store = getDefaultStore();

  /**
   * Initialise le pont en chargeant la config locale (Dexie) 
   * puis en écoutant les signaux distants (Firestore).
   */
  static async init(tenantId: string) {
    if (!tenantId) return;
    

    // 1. Local-First Boot: Load from Dexie
    const localConfig = await db.config.get(tenantId) as (TenantConfig & LegacyTenantConfig) | undefined;
    if (localConfig) {
      this.store.set(tenantConfigAtom, {
        ...localConfig,
        // Ensure keys from Phase 1 exist if migrating from Grade VI
        capabilities: localConfig.capabilities || localConfig.features || {},
        status: {
          ...DEFAULT_TENANT_CONFIG.status,
          ...localConfig.status,
          businessLaws: localConfig.status?.businessLaws || {}
        }
      } as TenantConfig);
    } else {
      this.store.set(tenantConfigAtom, { ...RESTAURANT_FULL_DNA, id: tenantId });
    }

    // 2. Establish Real-time Connection
    this.listen(tenantId);
  }

  /**
   * Écoute les changements sur le document de configuration du tenant.
   * Grade VIII : Injection agnostique.
   */
  static listen(tenantId: string) {
    this.stop();

    const configDocRef = doc(firestore, 'tenants', tenantId, 'config', 'master');

    this.unsubscribe = onSnapshot(configDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const remoteData = snapshot.data() as Partial<TenantConfig> & LegacyTenantConfig;
        
        // Grade VIII Mapping: Accept everything, map to core structure
        const nextConfig: TenantConfig = {
          id: tenantId,
          capabilities: remoteData.capabilities || remoteData.features || RESTAURANT_FULL_DNA.capabilities,
          theme: { 
            primaryColor: remoteData.theme?.primaryColor || RESTAURANT_FULL_DNA.theme.primaryColor,
            secondaryColor: remoteData.theme?.secondaryColor || RESTAURANT_FULL_DNA.theme.secondaryColor,
            logoUrl: remoteData.theme?.logoUrl || RESTAURANT_FULL_DNA.theme.logoUrl,
            borderRadius: remoteData.theme?.borderRadius || RESTAURANT_FULL_DNA.theme.borderRadius,
            appearance: remoteData.theme?.appearance || RESTAURANT_FULL_DNA.theme.appearance
          },
          status: { 
            ...(RESTAURANT_FULL_DNA.status || DEFAULT_TENANT_CONFIG.status), 
            ...(remoteData.status || {}),
            layoutType: (remoteData.status?.layoutType || remoteData.layout || (RESTAURANT_FULL_DNA.status?.layoutType ?? 'default')) as import('@/shared/nexus-contract').TenantConfig['status']['layoutType'],
            businessLaws: (remoteData.status?.businessLaws || remoteData.laws || (RESTAURANT_FULL_DNA.status?.businessLaws ?? {})) as import('@/shared/nexus-contract').TenantConfig['status']['businessLaws']
          },
          metadata: { 
            name: remoteData.metadata?.name || RESTAURANT_FULL_DNA.metadata.name,
            version: remoteData.metadata?.version || RESTAURANT_FULL_DNA.metadata.version,
            description: remoteData.metadata?.description || RESTAURANT_FULL_DNA.metadata.description,
            ownerId: remoteData.metadata?.ownerId || RESTAURANT_FULL_DNA.metadata.ownerId,
            createdAt: remoteData.metadata?.createdAt || RESTAURANT_FULL_DNA.metadata.createdAt,
            subscriptionTier: remoteData.metadata?.subscriptionTier || RESTAURANT_FULL_DNA.metadata.subscriptionTier
          },
        };

        this.store.set(tenantConfigAtom, nextConfig);
        db.config.put(nextConfig);
      }
    });
  }

  static stop() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}
