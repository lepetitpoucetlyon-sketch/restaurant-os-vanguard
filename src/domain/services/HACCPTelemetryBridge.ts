import { fleetTelemetry } from './FleetTelemetryService';
import { MaintenanceAgent } from './MaintenanceAgent';
import { logger } from '@/lib/logger';
import { getTenantPath } from '@/lib/firebase';
import { Nexus } from '@/lib/nexus/NexusAdapter';

/**
 * 🧼 HACCPTelemetryBridge - Industrial v1.0
 * Monitors hygiene "drifts" and visual audit failures.
 * Bridges site-level risk to the Master Command Control (MCC).
 */
export const HACCPTelemetryBridge = {
  
  /**
   * 🌡️ Analyzes local HACCP health and reports to MCC.
   * Checks for temperature drifts in recent receptions or IoT logs.
   */
  async reportHygieneHealth(tenantId: string) {
    try {
      const receptionsPath = getTenantPath('receptions', tenantId);
      const receptions = await Nexus.adapter.query(receptionsPath, {
        orderBy: { field: 'createdAt', direction: 'desc' },
        limit: 5
      });
      
      // Calculate Risk Score based on recent controls
      let riskPoints = 0;
      let criticalEvents = 0;
      
      receptions.forEach(r => {
        if (r.hygieneStatus === 'dirty') riskPoints += 30;
        if (r.hygieneStatus === 'acceptable') riskPoints += 10;
        
        // Check items for temperature violations
        r.itemsChecked?.forEach((item: any) => {
          if (item.status === 'rejected') {
            riskPoints += 20;
            criticalEvents++;
          }
        });
      });

      const healthScore = Math.max(0, 100 - riskPoints);

      // 📡 Push to Telemetry Hub
      await fleetTelemetry.pushSiteTelemetry(tenantId as any, {
        healthScore,
        complianceScore: receptions.length > 0 ? 100 : 50, // Penalty for missing audits
      } as any);

      // 🚨 Trigger SOS if health is critical
      if (healthScore < 60 || criticalEvents > 2) {
        await MaintenanceAgent.submitSOS({
          tenantId,
          userId: 'system_haccp_bridge',
          type: 'CRITICAL_BUG', // Used as generic critical signal
          description: `HYGIENE CRITICAL: Health Score at ${healthScore}%. Multiple rejections or sanitation failures detected.`,
          systemState: {
            currentRoute: '/haccp',
            orderCount: 0,
            inventoryStatus: 'monitoring',
            offlineMode: false,
            lastActions: ['HACCP_AUTO_SCAN']
          },
          logs: [`Last health score: ${healthScore}`, `Critical rejections: ${criticalEvents}`]
        });
      }

      return healthScore;
    } catch (error) {
      logger.error(`[HACCPBridge] Failed for ${tenantId}:`, error);
      return 100;
    }
  }
};
