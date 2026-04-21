import { getTenantPath } from '@/lib/firebase';
import { NexusTransaction } from '@/lib/NexusTransaction';
import { logger } from '@/lib/logger';
import { HACCPTelemetryBridge } from './HACCPTelemetryBridge';
import { MaintenanceAgent } from './MaintenanceAgent';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { 
    ReceptionSchema, 
    ReceptionData, 
    CleaningSchema, 
    CleaningData,
    WasteSchema,
    WasteData,
    OilCheckSchema,
    OilCheckData
} from '../schemas/haccp';

import { SovereignData } from '@/shared/nexus-contract';

/**
 * 🏺 QualityEngine - Restaurant OS Guard
 * Ensures food safety and traceability via strict HACCP enforcement.
 */
export class QualityEngine {
  private static COLLECTION = 'haccp_logs';

  /**
   * Records a delivery reception with HACCP controls.
   */
  static async validateReception(rawData: SovereignData, tenantId: string = 'main'): Promise<{ id: string; currentStatus: string }> {
    logger.info(`[QualityEngine] Initiating reception validation for tenant: ${tenantId}`);

    const validatedData = ReceptionSchema.parse(rawData);

    const result = await NexusTransaction.run(
      { RECEPTION_VALIDATION: { schema: ReceptionSchema, data: validatedData } },
      async (transaction) => {
        const tenantPath = getTenantPath(this.COLLECTION, tenantId);
        const receptionId = `rec_${Math.random().toString(36).substring(2, 10)}`;
        const receptionPath = `${tenantPath}/${receptionId}`;

        const log = {
          ...validatedData,
          id: receptionId,
          type: 'reception',
          createdAt: new Date().toISOString(),
          status: 'completed'
        };
        transaction.set(receptionPath, log);

        const deliveryPath = `${getTenantPath('deliveries', tenantId)}/${validatedData.deliveryId}`;
        transaction.update(deliveryPath, { status: 'checked', checkedAt: new Date().toISOString() });

        return { id: receptionId, currentStatus: log.hygieneStatus };
      }
    );

    if (result.currentStatus === 'dirty') {
        await this.trackRecentFailures(tenantId);
    }

    await this.pingTelemetry(tenantId);
    return result;
  }

  /**
   * Logs a cleaning operation.
   */
  static async validateCleaning(rawData: SovereignData, tenantId: string = 'main'): Promise<string> {
    const validatedData = CleaningSchema.parse(rawData);
    const id = `cln_${Math.random().toString(36).substring(2, 10)}`;
    
    await Nexus.adapter.set(`${getTenantPath(this.COLLECTION, tenantId)}/${id}`, {
        ...validatedData,
        id,
        type: 'cleaning',
        createdAt: new Date().toISOString()
    });

    return id;
  }

  /**
   * Logs food waste.
   */
  static async logWaste(rawData: SovereignData, tenantId: string = 'main'): Promise<string> {
    const validatedData = WasteSchema.parse(rawData);
    const id = `wst_${Math.random().toString(36).substring(2, 10)}`;
    
    await Nexus.adapter.set(`${getTenantPath(this.COLLECTION, tenantId)}/${id}`, {
        ...validatedData,
        id,
        type: 'waste',
        createdAt: new Date().toISOString()
    });

    return id;
  }

  /**
   * Tracks quality trends and triggers SOS if needed.
   */
  private static async trackRecentFailures(tenantId: string) {
    try {
        const tenantPath = getTenantPath(this.COLLECTION, tenantId);
        const snapshots = await Nexus.adapter.query<ReceptionData & { createdAt: string }>(tenantPath, {
          where: [{ field: 'type', operator: '==', value: 'reception' }],
          orderBy: { field: 'createdAt', direction: 'desc' },
          limit: 3
        });
        
        const recentFailures = snapshots.filter(d => d.hygieneStatus === 'dirty');
        
        if (recentFailures.length >= 3) {
            await MaintenanceAgent.submitSOS({
                tenantId,
                userId: 'system_quality',
                type: 'CRITICAL_BUG',
                description: 'Three consecutive deliveries failed hygiene standards. Mandatory floor audit required.',
                pageKey: 'HACCP',
                systemState: { 
                    currentRoute: '/quality', 
                    orderCount: 0, 
                    lastActions: ['THREAT_DETECTED'], 
                    inventoryStatus: 'nominal', 
                    offlineMode: false,
                    activeModules: ['HACCP']
                },
                logs: ['[QualityEngine] Initiating automated SOS due to repeated hygiene failures.']
            });
        }
    } catch (err) {
        logger.error('[QualityEngine] Trend tracking failed:', (err as Error).message);
    }
  }

  private static async pingTelemetry(tenantId: string) {
    try {
        await HACCPTelemetryBridge.reportHygieneHealth(tenantId);
    } catch (err) {
        logger.error('[QualityEngine] Telemetry update failed:', (err as Error).message);
    }
  }
}

