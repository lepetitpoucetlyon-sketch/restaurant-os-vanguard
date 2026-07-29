import { Nexus } from '@/lib/nexus/NexusAdapter';
import { TenantID, SiteTelemetry } from '@domain/types/brands';
import { TelemetryEvent } from '@/infrastructure/services/telemetry/TelemetryStream';
import { logger } from '@/lib/logger';

interface PerformanceMemory extends Performance {
  memory?: {
    usedJSHeapSize: number;
  };
}

function getMemoryUsage(): number {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in window.performance) {
        return Math.round(((window.performance as PerformanceMemory).memory?.usedJSHeapSize || 0) / 1024 / 1024);
    }
    return 0;
}

export async function executeAdministrativeAction(event: TelemetryEvent): Promise<void> {
    try {
        // ⚠️ Chemin du décret = chemin écouté par les instances :
        // NexusBridge.listen s'abonne à tenants/{t}/config/master. Écrire sur
        // le doc racine tenants/{t} ne déclenche RIEN côté instance.
        const path = `tenants/${event.tenantId}/config/master`;
        const patch = {
            ...event.payload,
            updatedAt: new Date().toISOString()
        };
        await Nexus.adapter.set(path, patch, { merge: true });
        logger.info(`[Fleet] Administrative ${event.type} successful for: ${event.tenantId}`);
    } catch (error: unknown) {
        console.error(`[Fleet] Administrative action failed for ${event.tenantId}`, error);
        throw error;
    }
}

export async function executeCloudSync(tenantId: TenantID, data: Partial<SiteTelemetry>): Promise<void> {
    try {
      const telemetryPath = `fleet-telemetry/${tenantId}`;
      const payload = {
        ...data,
        lastSeen: new Date().toISOString(),
        engineVersion: "Grade-X-Vanguard",
        nodeHealth: {
          memoryUsageMB: getMemoryUsage(),
          lowResActive: false,
          timestamp: Date.now()
        }
      };
      await Nexus.adapter.set(telemetryPath, payload, { merge: true });
      logger.info(`[Fleet] Nexus-Stream Sync Successful for site: ${tenantId}`);
    } catch (error: unknown) {
      console.error(`[Fleet] Stream sync failed for ${tenantId}.`, error);
      throw error;
    }
}

export async function discoverRealFleet(): Promise<SiteTelemetry[]> {
    try {
      const results = await Nexus.adapter.query<SiteTelemetry>("fleet-telemetry");
      // Dev bypass : si la flotte est vide et que le mode dev est actif, injecter une instance démo
      logger.info(`[Fleet] discoverRealFleet: ${results.length} results, NODE_ENV=${process.env.NODE_ENV}`);
      if (results.length === 0 && process.env.NODE_ENV === 'development') {
        const now = new Date().toISOString();
        return [{
          id:            'lepetitpoucet',
          key:           'lepetitpoucet',
          name:          'Le Restaurant OS — Démo',
          tenantId:      'lepetitpoucet',
          status:        'ONLINE',
          tier:          'PREMIUM',
          version:       '4.0.0-NEXUS',
          engineVersion: 'Grade-X-Vanguard',
          createdAt:     now,
          updatedAt:     now,
          lastHeartbeat: now,
          lastSeen:      now,
          activeUsers:   4,
          dailyRevenue:  1840,
          activeOrders:  7,
          healthScore:   94,
          complianceScore: 98,
          lowStockAlerts:  2,
          branding: {
            primaryColor:   '#C5A059',
            secondaryColor: '#1C1C1C',
            logoUrl:        '',
            tagline:        'Excellence Opérationnelle',
          },
          security: {
            twoFactorEnabled:         true,
            nf525Certified:           true,
            maintenanceAccessGranted: false,
            supportAccessGranted:     false,
          },
          ragStatus: {
            status:        'online',
            version:       '1.0.0',
            documentCount: 142,
            lastIndexed:   now,
            latencyMs:     82,
          },
          featureFlags: {
            mod_pos:       true,
            mod_kds:       true,
            mod_haccp:     true,
            mod_analytics: true,
          },
        }];
      }
      return results;
    } catch (e) {
      logger.error("[Fleet] Discovery failed", e);
      // Dev bypass : si Nexus n'est pas configuré, retourner l'instance démo
      if (process.env.NEXT_PUBLIC_MCC_DEV_BYPASS === 'true') {
        const now = new Date().toISOString();
        return [{
          id:            'lepetitpoucet',
          key:           'lepetitpoucet',
          name:          'Le Restaurant OS — Démo',
          tenantId:      'lepetitpoucet',
          status:        'ONLINE',
          tier:          'PREMIUM',
          version:       '4.0.0-NEXUS',
          engineVersion: 'Grade-X-Vanguard',
          createdAt:     now,
          updatedAt:     now,
          lastHeartbeat: now,
          lastSeen:      now,
          activeUsers:   4,
          dailyRevenue:  1840,
          activeOrders:  7,
          healthScore:   94,
          complianceScore: 98,
          lowStockAlerts:  2,
          branding: {
            primaryColor:   '#C5A059',
            secondaryColor: '#1C1C1C',
            logoUrl:        '',
            tagline:        'Excellence Opérationnelle',
          },
          security: {
            twoFactorEnabled:         true,
            nf525Certified:           true,
            maintenanceAccessGranted: false,
            supportAccessGranted:     false,
          },
          ragStatus: {
            status:        'online',
            version:       '1.0.0',
            documentCount: 142,
            lastIndexed:   now,
            latencyMs:     82,
          },
          featureFlags: {
            mod_pos:       true,
            mod_kds:       true,
            mod_haccp:     true,
            mod_analytics: true,
          },
        }];
      }
      return [];
    }
}

export async function getGlobalMetrics(sites?: SiteTelemetry[]): Promise<{ totalNodes: number; empireHealth: number }> {
    const nodes = sites || (await discoverRealFleet());
    return {
      totalNodes: nodes.length,
      empireHealth: 98
    };
}
