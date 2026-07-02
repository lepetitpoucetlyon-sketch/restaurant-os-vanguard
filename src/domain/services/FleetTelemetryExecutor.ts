import { Nexus } from '@/lib/nexus/NexusAdapter';
import { TenantID, SiteTelemetry } from '@domain/types/brands';
import { TelemetryEvent } from '@/lib/telemetry/TelemetryStream';

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
        console.log(`[Fleet] Administrative ${event.type} successful for: ${event.tenantId}`);
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
      console.log(`[Fleet] Nexus-Stream Sync Successful for site: ${tenantId}`);
    } catch (error: unknown) {
      console.error(`[Fleet] Stream sync failed for ${tenantId}.`, error);
      throw error;
    }
}

export async function discoverRealFleet(): Promise<SiteTelemetry[]> {
    try {
      return await Nexus.adapter.query<SiteTelemetry>("fleet-telemetry");
    } catch (e) {
      console.error("[Fleet] Discovery failed", e);
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
