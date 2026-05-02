import { TenantID, SiteTelemetry } from '@domain/types/brands';
import { TelemetryStream, TelemetryEvent } from '@/lib/telemetry/TelemetryStream';
import { executeAdministrativeAction, executeCloudSync, discoverRealFleet, getGlobalMetrics } from './FleetTelemetryExecutor';

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
