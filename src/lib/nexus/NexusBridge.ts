import { 
  doc, 
  onSnapshot, 
  Unsubscribe
} from 'firebase/firestore';
import { getDefaultStore } from 'jotai';
import { tenantConfigAtom } from '@nexus/state/SovereignGenome';
import { db } from '@/lib/offline/offline-store';
import { FiscalKeyService } from '@/domain/services/FiscalKeyService';
import { TenantConfig, DEFAULT_TENANT_CONFIG } from '@/shared/nexus-contract';
import { RESTAURANT_FULL_DNA } from '@shared/seeds/restaurant-full-dna';
import { logger } from '@/lib/logger';

interface LegacyTenantConfig {
  features?: Record<string, boolean>;
  layout?: string;
  laws?: Record<string, boolean>;
}

/** Donnée distante pouvant contenir des champs legacy pré-Grade-VIII. */
type RemoteConfigData = Partial<TenantConfig> & LegacyTenantConfig;

import { firestore } from '@/lib/firebase';

/**
 * 🛰️ NexusBridge - The Command Omphalos
 * Establishes a real-time, resilient link between the MCC and the OS.
 */
export class NexusBridge {
  private static unsubscribe: Unsubscribe | null = null;
  private static pulseInterval: ReturnType<typeof setInterval> | null = null;
  private static store = getDefaultStore();

  /** Cadence du pulse montant vers le MCC (le stream bufferise, flush ≤ 5 min). */
  private static readonly PULSE_INTERVAL_MS = 120_000;

  /**
   * Initialise le pont en chargeant la config locale (Dexie) 
   * puis en écoutant les signaux distants (Firestore).
   */
  static async init(tenantId: string) {
    if (!tenantId) return;
    

    // 1. Local-First Boot: Load from Dexie
    const localConfig = await db.config.get(tenantId) as (TenantConfig & LegacyTenantConfig & { fiscalSigningKey?: string }) | undefined;
    if (localConfig?.fiscalSigningKey) {
      // Clé de scellement NF525 provisionnée par tenant (voir FiscalKeyService).
      FiscalKeyService.provision(tenantId, localConfig.fiscalSigningKey);
    }
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

    // 2. Establish Real-time Connection — les DEUX sens du lien MCC ↔ instance :
    //    DOWN : décrets impériaux (tenants/{t}/config/master → onSnapshot)
    //    UP   : télémétrie de santé (fleet-telemetry/{t} ← pulse périodique)
    this.listen(tenantId);
    this.startPulse(tenantId);
  }

  /**
   * 🛰️ Flux MONTANT du Nexus Bridge : heartbeat instance → MCC.
   * Enregistre le nœud puis pousse santé/commandes/version toutes les 2 min.
   */
  static startPulse(tenantId: string) {
    this.stopPulse();
    if (typeof window === 'undefined') return; // pulse côté instance uniquement

    import('@domain/services/FleetTelemetryService')
      .then(({ fleetTelemetry }) => {
        fleetTelemetry.registerNode(tenantId as import('@domain/types/brands').TenantID);
      })
      .catch((err) => logger.warn('[NexusBridge] registerNode failed', { error: String(err) }));

    const push = () => this.pushPulse(tenantId);
    push();
    this.pulseInterval = setInterval(push, this.PULSE_INTERVAL_MS);
  }

  private static async pushPulse(tenantId: string): Promise<void> {
    try {
      const { fleetTelemetry } = await import('@domain/services/FleetTelemetryService');
      const { pendingOrdersAtom } = await import('@/store/pillars/ops');
      let activeOrders = 0;
      try {
        activeOrders = (this.store.get(pendingOrdersAtom) as unknown[])?.length ?? 0;
      } catch { /* atomes ops non chargés sur cette route (ICM) — pulse minimal */ }

      await fleetTelemetry.pushSiteTelemetry(tenantId as import('@domain/types/brands').TenantID, {
        status: 'ONLINE',
        lastHeartbeat: new Date().toISOString(),
        healthScore: 100,
        activeOrders,
        version: process.env.NEXT_PUBLIC_APP_VERSION ?? '0.1.0',
      });
    } catch (err) {
      logger.warn('[NexusBridge] Instance pulse failed', { error: String(err) });
    }
  }

  static stopPulse() {
    if (this.pulseInterval) {
      clearInterval(this.pulseInterval);
      this.pulseInterval = null;
    }
  }

  private static mapTheme(remoteData: RemoteConfigData): TenantConfig['theme'] {
      return { 
        primaryColor: remoteData.theme?.primaryColor || RESTAURANT_FULL_DNA.theme?.primaryColor || DEFAULT_TENANT_CONFIG.theme.primaryColor,
        secondaryColor: remoteData.theme?.secondaryColor || RESTAURANT_FULL_DNA.theme?.secondaryColor || DEFAULT_TENANT_CONFIG.theme.secondaryColor,
        logoUrl: remoteData.theme?.logoUrl || RESTAURANT_FULL_DNA.theme?.logoUrl || DEFAULT_TENANT_CONFIG.theme.logoUrl,
        borderRadius: remoteData.theme?.borderRadius || RESTAURANT_FULL_DNA.theme?.borderRadius || DEFAULT_TENANT_CONFIG.theme.borderRadius,
        appearance: remoteData.theme?.appearance || RESTAURANT_FULL_DNA.theme?.appearance || DEFAULT_TENANT_CONFIG.theme.appearance
      };
  }

  private static mapStatus(remoteData: RemoteConfigData): TenantConfig['status'] {
      return { 
        ...(RESTAURANT_FULL_DNA.status || DEFAULT_TENANT_CONFIG.status), 
        ...(remoteData.status || {}),
        layoutType: (remoteData.status?.layoutType || remoteData.layout || (RESTAURANT_FULL_DNA.status?.layoutType ?? 'default')) as unknown as string,
        businessLaws: (remoteData.status?.businessLaws || remoteData.laws || (RESTAURANT_FULL_DNA.status?.businessLaws ?? {})) as unknown as Record<string, unknown>
      };
  }

  private static mapMetadata(remoteData: RemoteConfigData): TenantConfig['metadata'] {
      return { 
        name: remoteData.metadata?.name || RESTAURANT_FULL_DNA.metadata?.name || DEFAULT_TENANT_CONFIG.metadata.name,
        version: remoteData.metadata?.version || RESTAURANT_FULL_DNA.metadata?.version || DEFAULT_TENANT_CONFIG.metadata.version,
        description: remoteData.metadata?.description || RESTAURANT_FULL_DNA.metadata?.description || '',
        ownerId: remoteData.metadata?.ownerId || RESTAURANT_FULL_DNA.metadata?.ownerId || '',
        createdAt: remoteData.metadata?.createdAt || RESTAURANT_FULL_DNA.metadata?.createdAt || Date.now(),
        subscriptionTier: (remoteData.metadata?.subscriptionTier || RESTAURANT_FULL_DNA.metadata?.subscriptionTier || 'FREE') as string
      };
  }

  /**
   * Grade VIII Mapping: Accept everything, map to core structure
   */
  static mapRemoteConfig(remoteData: Partial<TenantConfig> & LegacyTenantConfig, tenantId: string): TenantConfig {
    return {
      id: tenantId,
      capabilities: remoteData.capabilities || remoteData.features || RESTAURANT_FULL_DNA.capabilities,
      theme: this.mapTheme(remoteData),
      status: this.mapStatus(remoteData),
      metadata: this.mapMetadata(remoteData),
    };
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
        const remoteData = snapshot.data() as Partial<TenantConfig> & LegacyTenantConfig & { fiscalSigningKey?: string };

        if (remoteData.fiscalSigningKey) {
          FiscalKeyService.provision(tenantId, remoteData.fiscalSigningKey);
        }

        const nextConfig = this.mapRemoteConfig(remoteData, tenantId);

        this.store.set(tenantConfigAtom, nextConfig);
        db.config.put(nextConfig);
      }
    });
  }

  
  /**
   * 🖋️ Suture GRADE X+++: Emission CommunicationPulse (Email/SMS)
   * @deprecated Use CommunicationService.sendCommunicationPulse directly
   */
  static async sendCommunicationPulse(pulse: import('@/domain/finance/collection/types').CommunicationPulse) {
      const { CommunicationService } = await import('@/lib/services/CommunicationService');
      return CommunicationService.sendCommunicationPulse(pulse);
  }

  static stop() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.stopPulse();
  }
}
