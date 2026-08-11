import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';
import { NotificationGateway } from '@/lib/adapters/NotificationGateway';
import { browserPush } from '@/lib/push/browserPush';

const MAX_ATTEMPTS = 3;

/**
 * ReportRetryHandler (P08-E)
 * Écoute report.send.failed et orchestre les tentatives d'envoi avec
 * backoff exponentiel (2^attemptCount minutes).
 *
 * - attemptCount < 3 : planifie un retry, notifie le destinataire
 * - attemptCount >= 3 : crée une alerte critique, WebPush manager
 */
export function registerReportRetryHandler(): () => void {
  return NexusEventBus.on(
    'report.send.failed',
    async (payload) => {
      const { tenantId, reportId, recipientEmail, reportType, attemptCount, error } = payload;

      const maxReached = attemptCount >= MAX_ATTEMPTS;
      const now = new Date().toISOString();

      if (!maxReached) {
        // --- Backoff exponentiel : 2^attemptCount minutes en ms ---
        const delayMs = Math.pow(2, attemptCount) * 60_000;
        const nextRetryAt = new Date(Date.now() + delayMs).toISOString();

        // Tâche de retry
        await Nexus.adapter.set(
          `tenants/${tenantId}/tasks/RETRY-REPORT-${reportId}`,
          {
            reportId,
            attemptCount: attemptCount + 1,
            nextRetryAt,
            status: 'pending',
            createdAt: now,
          },
        );

        // Notification email au destinataire
        await NotificationGateway.send({
          tenantId,
          to: recipientEmail,
          subject: `Rapport ${reportType} — Nouvel envoi tentative ${attemptCount + 1}`,
          text: `Votre rapport ${reportType} n'a pas pu être livré. Une nouvelle tentative (n°${attemptCount + 1}) est planifiée dans ${Math.pow(2, attemptCount)} minute(s). Identifiant rapport : ${reportId}.`,
        });

        logger.info(
          `[ReportRetry] Retry ${attemptCount + 1} planifié pour rapport ${reportId} à ${nextRetryAt}`,
        );
      } else {
        // --- Alerte critique : max tentatives atteint ---
        await Nexus.adapter.set(
          `tenants/${tenantId}/alerts/REPORT-FAIL-${reportId}`,
          {
            type: 'report_delivery_failed',
            reportId,
            recipientEmail,
            maxAttemptsReached: true,
            createdAt: now,
          },
        );

        await browserPush.sendToRole(tenantId, 'manager', {
          title: 'Rapport non livré après 3 tentatives',
          body: `${reportType} — ${recipientEmail}`,
        });

        logger.warn(
          `[ReportRetry] Rapport ${reportId} non livré après ${MAX_ATTEMPTS} tentatives — alerte créée`,
        );
      }

      // Mise à jour du rapport avec le dernier état
      await Nexus.adapter.set(
        `tenants/${tenantId}/reports/${reportId}`,
        {
          lastError: error,
          attemptCount,
          status: maxReached ? 'failed' : 'retrying',
          updatedAt: now,
        },
      );

      empireAudit.log({
        module: 'orchestration',
        action: maxReached ? 'REPORT_DELIVERY_FAILED' : 'REPORT_RETRY_SCHEDULED',
        details: { reportId, recipientEmail, reportType, attemptCount },
        severity: maxReached ? 'high' : 'medium',
        timestamp: new Date(),
      });
    },
    { id: 'report-retry', priority: 'BACKGROUND' },
  );
}
