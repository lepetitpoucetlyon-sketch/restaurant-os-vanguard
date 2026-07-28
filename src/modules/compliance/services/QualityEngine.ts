import { NexusTransaction } from '@/infrastructure/adapters/NexusTransaction';
import { logger } from '@/lib/logger';
import { HACCPTelemetryBridge } from '@modules/compliance/haccp/services/HACCPTelemetryBridge';
import { MaintenanceAgent } from '@/domain/services/MaintenanceAgent';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { FiscalEngine } from '@/modules/finance/services/FiscalEngine';
import { SharedKernel } from '@/lib/shared-kernel';

import { 
    ReceptionData,
    SovereignData
} from '@nexus/contracts';

import { 
    ReceptionSchema, 
    CleaningSchema, 
    WasteSchema 
} from '@/domain/schemas/haccp';

/**
 * 🏺 QualityEngine - Restaurant OS Guard
 * Ensures food safety and traceability via strict HACCP enforcement.
 */
export class QualityEngine {
  private static COLLECTION = 'haccp_logs';

  /**
   * Records a delivery reception with HACCP controls.
   */
  static async validateReception(rawData: ReceptionData, tenantId: string = 'main'): Promise<{ id: string; currentStatus: string }> {
    logger.info(`[QualityEngine] Initiating reception validation for tenant: ${tenantId}`);

    const validatedData = ReceptionSchema.parse(rawData);

    const result = await NexusTransaction.run(
      { RECEPTION_VALIDATION: { schema: ReceptionSchema, data: validatedData } },
      async (transaction) => {
        const tenantPath = Nexus.getTenantPath(this.COLLECTION, tenantId);
        const receptionId = SharedKernel.generateId('HACCP-REC');
        const receptionPath = `${tenantPath}/${receptionId}`;

        // 🛡️ NF525 BRIDGE : Fiscal Sealing
        const seal = await FiscalEngine.sealEntry(receptionId, validatedData, { instanceId: tenantId });

        const log = {
          ...validatedData,
          id: receptionId,
          type: 'reception',
          createdAt: new Date().toISOString(),
          status: 'completed',
          _fiscalSeal: seal
        };
        transaction.set(receptionPath, log);

        const deliveryPath = `${Nexus.getTenantPath('deliveries', tenantId)}/${validatedData.deliveryId}`;
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
    const id = SharedKernel.generateId('HACCP-CLN');
    
    await Nexus.adapter.set(`${Nexus.getTenantPath(this.COLLECTION, tenantId)}/${id}`, {
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
    const id = SharedKernel.generateId('HACCP-WST');
    
    // 🛡️ NF525 BRIDGE : Fiscal Sealing of Waste
    const seal = await FiscalEngine.sealEntry(id, validatedData, { instanceId: tenantId });

    await Nexus.adapter.set(`${Nexus.getTenantPath(this.COLLECTION, tenantId)}/${id}`, {
        ...validatedData,
        id,
        type: 'waste',
        createdAt: new Date().toISOString(),
        _fiscalSeal: seal
    });

    return id;
  }

  /**
   * Tracks quality trends and triggers SOS if needed.
   */
  private static async trackRecentFailures(tenantId: string) {
    try {
        const tenantPath = Nexus.getTenantPath(this.COLLECTION, tenantId);
        const snapshots = await Nexus.adapter.query<ReceptionData & { hygieneStatus: string; createdAt: string }>(tenantPath, {
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
                pageKey: 'haccp',
                systemState: { 
                    currentRoute: '/quality', 
                    orderCount: 0, 
                    lastActions: ['THREAT_DETECTED'], 
                    inventoryStatus: 'nominal', 
                    offlineMode: false,
                    activeModules: ['haccp']
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

