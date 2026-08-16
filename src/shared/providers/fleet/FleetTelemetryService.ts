import { TenantID, SiteTelemetry } from '@/shared/types/brands';
import { TelemetryStream, type TelemetryEvent } from '@/modules/intelligence';
import { executeAdministrativeAction, executeCloudSync, discoverRealFleet, getGlobalMetrics } from './FleetTelemetryExecutor';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';

/**
 * 🛰️ FleetTelemetryService - Restaurant OS
 * Version Grade X - Event-Driven Sovereignty
 * Orchestrator of fleet-wide metrics using TelemetryStream.
 * Decoupled as a Facade Hub.
 */
export class FleetTelemetryService {
  private static instance: FleetTelemetryService;
  private stream: TelemetryStream;
  
  private currentAggregatedMetrics: Record<string, Partial<SiteTelemetry>> = {};

  private constructor() {
    this.stream = new TelemetryStream(async (events) => this.handleStreamFlush(events), 300000); // 5 min default
  }

  public static getInstance(): FleetTelemetryService {
    if (!FleetTelemetryService.instance) {
      FleetTelemetryService.instance = new FleetTelemetryService();
    }
    return FleetTelemetryService.instance;
  }

  public async pushSiteTelemetry(tenantId: TenantID, metrics: Partial<SiteTelemetry>): Promise<void> {
    const isCritical = metrics.status === 'CRITICAL' || (metrics.healthScore !== undefined && metrics.healthScore < 50);

    const event: TelemetryEvent = {
        type: metrics.status === 'CRITICAL' ? 'ALERT' : 'METRIC',
        tenantId: String(tenantId),
        payload: { ...metrics, tenantId: String(tenantId) },
        timestamp: Date.now(),
        priority: isCritical ? 'CRITICAL' : 'NORMAL'
    };

    this.stream.emit(event);
  }

  public async registerNode(tenantId: TenantID): Promise<void> {
    this.stream.emit({
        type: 'HEARTBEAT',
        tenantId: String(tenantId),
        payload: { id: tenantId, status: 'ONLINE' },
        timestamp: Date.now(),
        priority: 'HIGH'
    });
  }

  public async broadcastConfiguration(config: Record<string, import("@/shared/nexus-contract").SovereignValue>, targetTenantIds: string[]): Promise<void> {
    targetTenantIds.forEach(tid => {
        this.stream.emit({
            type: 'BROADCAST',
            tenantId: tid,
            payload: config,
            timestamp: Date.now(),
            priority: 'HIGH'
        });
    });
  }

  public async monitorFleetHealth(): Promise<void> {
    const HEALTH_THRESHOLD = 70;
    const HEARTBEAT_STALE_MS = 5 * 60 * 1000; // 5 minutes

    let sites: SiteTelemetry[];
    try {
      sites = await discoverRealFleet();
    } catch {
      return;
    }

    const now = Date.now();

    for (const site of sites) {
      const healthLow = site.healthScore < HEALTH_THRESHOLD;
      const lastBeat = site.lastHeartbeat ? new Date(site.lastHeartbeat).getTime() : 0;
      const heartbeatStale = !lastBeat || now - lastBeat > HEARTBEAT_STALE_MS;

      if (!healthLow && !heartbeatStale) continue;

      const reason = healthLow && heartbeatStale
        ? `health=${site.healthScore}% + heartbeat silencieux depuis ${Math.round((now - lastBeat) / 60000)} min`
        : healthLow
          ? `health critique: ${site.healthScore}% (seuil 70%)`
          : `heartbeat silencieux depuis ${Math.round((now - lastBeat) / 60000)} min`;

      const alertId = `${now}_${site.id}`;
      const alert = {
        id: alertId,
        tenantId: site.tenantId ?? site.key,
        instanceId: site.id,
        instanceName: site.name,
        severity: site.healthScore < 50 ? 'critical' : 'high',
        reason,
        healthScore: site.healthScore,
        lastHeartbeat: site.lastHeartbeat,
        detectedAt: new Date(now).toISOString(),
        acknowledged: false,
      };

      try {
        Nexus.adapter.set(`mcc/alerts/${alertId}`, alert).catch(() => {});
      } catch { /* non-bloquant */ }

      empireAudit.log({
        module: 'fleet',
        action: 'FLEET_HEALTH_ALERT',
        severity: alert.severity as 'critical' | 'high',
        details: alert,
        instanceId: site.id,
        timestamp: new Date(now),
      });
    }
  }

  public static async monitorFleetHealth(): Promise<void> {
    return this.getInstance().monitorFleetHealth();
  }

  private async handleStreamFlush(events: TelemetryEvent[]): Promise<void> {
    const telemetryUpdates: Record<string, Partial<SiteTelemetry>> = {};
    const administrativeActions: TelemetryEvent[] = [];
    
    events.forEach(event => {
        if (event.type === 'BROADCAST' || event.type === 'COMMAND') {
            administrativeActions.push(event);
        } else {
            telemetryUpdates[event.tenantId] = {
                ...(telemetryUpdates[event.tenantId] || {}),
                ...(event.payload as Partial<SiteTelemetry>)
            };
        }
    });

    const syncTasks = Object.entries(telemetryUpdates).map(([tid, payload]) => 
        executeCloudSync(tid as TenantID, payload)
    );

    const adminTasks = administrativeActions.map(action => 
        executeAdministrativeAction(action)
    );

    await Promise.all([...syncTasks, ...adminTasks]);

    // Alerte proactive après chaque flush (toutes les 5 min) — mcc-tel-2
    this.monitorFleetHealth().catch(() => {});
  }

  public async discoverRealFleet(): Promise<SiteTelemetry[]> {
    return discoverRealFleet();
  }

  public async getGlobalMetrics(sites?: SiteTelemetry[]): Promise<{ totalNodes: number; empireHealth: number }> {
    return getGlobalMetrics(sites);
  }

  public static async discoverRealFleet(): Promise<SiteTelemetry[]> {
    return this.getInstance().discoverRealFleet();
  }

  public static async getGlobalMetrics(sites?: SiteTelemetry[]): Promise<{ totalNodes: number; empireHealth: number }> {
    return this.getInstance().getGlobalMetrics(sites);
  }
}

export const fleetTelemetry = FleetTelemetryService.getInstance();
