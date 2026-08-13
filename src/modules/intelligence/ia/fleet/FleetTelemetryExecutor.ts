import { Nexus } from '@/lib/nexus/NexusAdapter';
import { TenantID, SiteTelemetry } from '@nexus/tokens/brands.types';
import { TelemetryEvent } from '../../analytique/TelemetryStream';
import { logger } from '@/lib/logger';
import { MCC_DEV_MODE_CLIENT } from '@/lib/mcc/devMode';

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
    } catch (error) {
        logger.error(`[Fleet] Administrative action failed for ${event.tenantId}`, error);
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
    } catch (error) {
      logger.error(`[Fleet] Stream sync failed for ${tenantId}.`, error);
      throw error;
    }
}

function buildDemoInstance(): SiteTelemetry {
    const now = new Date().toISOString();
    return {
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
        activeUsers:   0,
        dailyRevenue:  0,
        activeOrders:  0,
        healthScore:   0,
        complianceScore: 0,
        lowStockAlerts:  0,
        branding: {
            primaryColor:   '#C5A059',
            secondaryColor: '#1C1C1C',
            logoUrl:        '',
            tagline:        'Excellence Opérationnelle',
        },
        security: {
            twoFactorEnabled:         false,
            nf525Certified:           false,
            maintenanceAccessGranted: false,
            supportAccessGranted:     false,
        },
        ragStatus: {
            status:        'offline',
            version:       '1.0.0',
            documentCount: 0,
            lastIndexed:   now,
            latencyMs:     0,
        },
        featureFlags: {
            mod_pos:       true,
            mod_kds:       true,
            mod_haccp:     true,
            mod_analytics: true,
        },
    };
}

export async function discoverRealFleet(): Promise<SiteTelemetry[]> {
    try {
        const results = await Nexus.adapter.query<SiteTelemetry>("fleet-telemetry");
        logger.info(`[Fleet] discoverRealFleet: ${results.length} results, NODE_ENV=${process.env.NODE_ENV}`);
        if (results.length === 0 && process.env.NODE_ENV === 'development') {
            return [buildDemoInstance()];
        }
        return results;
    } catch (e) {
        logger.error("[Fleet] Discovery failed", e);
        if (MCC_DEV_MODE_CLIENT) {
            return [buildDemoInstance()];
        }
        return [];
    }
}

export async function getGlobalMetrics(sites?: SiteTelemetry[]): Promise<{ totalNodes: number; empireHealth: number }> {
    const nodes = sites || (await discoverRealFleet());
    const empireHealth = nodes.length > 0
        ? Math.round(nodes.reduce((sum, n) => sum + (n.healthScore ?? 0), 0) / nodes.length)
        : 0;
    return { totalNodes: nodes.length, empireHealth };
}
