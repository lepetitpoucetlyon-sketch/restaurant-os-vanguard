/**
 * FleetSystemAlertHandler (§8)
 *
 * Alimente `mcc/fleet/alerts` depuis les événements système uniquement.
 * Règle absolue : le MCC ne lit JAMAIS les données métier tenant.
 * Seuls les événements système/technique/fiscal remontent ici.
 */
import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

type AlertSeverity = 'critical' | 'warning' | 'info';

interface FleetAlert {
  id: string;
  tenantId: string;
  severity: AlertSeverity;
  category: 'nf525' | 'security' | 'compliance' | 'system';
  title: string;
  detail: string;
  createdAt: string;
  status: 'open' | 'acknowledged';
}

async function writeAlert(alert: Omit<FleetAlert, 'id' | 'createdAt' | 'status'>): Promise<void> {
  const id = Nexus.adapter.generateId('mcc/fleet/alerts');
  const record: FleetAlert = {
    ...alert,
    id,
    createdAt: new Date().toISOString(),
    status: 'open',
  };
  await Nexus.adapter.set(`mcc/fleet/alerts/${id}`, record);
  logger.warn(`[FleetSystemAlert] ${alert.severity.toUpperCase()} — ${alert.title}`, {
    tenantId: alert.tenantId,
    category: alert.category,
  });
}

export function registerFleetSystemAlertHandler(): Array<() => void> {
  const unsubscribers: Array<() => void> = [];

  unsubscribers.push(
    NexusEventBus.on('finance.ticket_z_missed', async ({ tenantId, expectedDate, hoursOverdue }) => {
      await writeAlert({
        tenantId,
        severity: 'critical',
        category: 'nf525',
        title: 'Ticket Z manqué — obligation NF525',
        detail: `Clôture du ${expectedDate} non effectuée (${hoursOverdue}h de retard).`,
      });
    }, { id: 'fleet-alert-ticket-z-missed', priority: 'HIGH' }),
  );

  unsubscribers.push(
    NexusEventBus.on('crypto.integrity_failed', async ({ tenantId, journalId, detectedAt }) => {
      await writeAlert({
        tenantId,
        severity: 'critical',
        category: 'security',
        title: 'Intégrité chaîne NF525 rompue',
        detail: `Journal ${journalId} — hash invalide détecté à ${new Date(detectedAt).toISOString()}.`,
      });
    }, { id: 'fleet-alert-integrity-failed', priority: 'HIGH' }),
  );

  unsubscribers.push(
    NexusEventBus.on('compliance.certificate_expired', async ({ tenantId, certificateType, expiredAt }) => {
      await writeAlert({
        tenantId,
        severity: 'warning',
        category: 'compliance',
        title: `Certificat expiré : ${certificateType}`,
        detail: `Expiré le ${expiredAt}. Renouveler pour rester en conformité.`,
      });
    }, { id: 'fleet-alert-certificate-expired', priority: 'HIGH' }),
  );

  unsubscribers.push(
    NexusEventBus.on('system.tenant_error_rate_high', async ({ tenantId, errorsPerMinute, windowMinutes }) => {
      await writeAlert({
        tenantId,
        severity: 'warning',
        category: 'system',
        title: 'Taux d\'erreur élevé',
        detail: `${errorsPerMinute} erreurs/min sur les ${windowMinutes} dernières minutes.`,
      });
    }, { id: 'fleet-alert-error-rate-high', priority: 'BACKGROUND' }),
  );

  return unsubscribers;
}
