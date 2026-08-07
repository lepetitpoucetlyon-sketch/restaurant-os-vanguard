import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { toError } from "@/lib/toError";

export function registerAnomalyDetectedHandler(): () => void {
  return NexusEventBus.on(
    'analytics.anomaly_detected',
    async ({ tenantId, metric, value, threshold, detectedAt }) => {
      try {
        const anomalyId = crypto.randomUUID();
        await Nexus.adapter.set(`tenants/${tenantId}/analytics/anomalies/${anomalyId}`, {
          id: anomalyId,
          metric,
          value,
          threshold,
          deviation: value - threshold,
          detectedAt,
          resolvedAt: null,
          status: 'open',
        });

        empireAudit.log({
          module: 'ops',
          action: 'ANOMALY_DETECTED',
          details: { metric, value, threshold },
          severity: 'high',
          timestamp: new Date(detectedAt),
        });

        logger.warn(`[AnomalyDetectedHandler] Anomalie détectée — ${metric}: ${value} (seuil: ${threshold})`);
      } catch (err) {
        logger.error(`[AnomalyDetectedHandler] Échec enregistrement anomalie: ${toError(err).message}`);
      }
    },
    { id: 'anomaly-detected', priority: 'HIGH' },
  );
}
