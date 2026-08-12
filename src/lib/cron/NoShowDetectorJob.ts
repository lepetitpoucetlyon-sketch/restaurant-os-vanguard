import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@orchestration/NexusEventBus';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { parse, addMinutes, isBefore } from 'date-fns';
import { JsonObject } from "@/shared/types/json";

interface ReservationRecord {
  id: string;
  tenantId: string;
  status: string;
  date: string;
  time: string;
  covers?: number;
  customerName?: string;
  customerId?: string;
  cardImprintStatus?: string;
  stripePaymentMethodId?: string;
}

/**
 * 🕵️ NoShowDetectorJob (GAP 4)
 * Cron exécuté toutes les 5 minutes (`*\/5 * * * *`).
 * Détecte les réservations confirmées dont l'heure d'arrivée est dépassée de plus de `noShowDelayMinutes` (ex: 30 min),
 * passe le statut en `no_show`, émet l'événement `reservation.no_show` et déclenche le prélèvement si une empreinte existe.
 */
export class NoShowDetectorJob {
  static async run(): Promise<void> {
    logger.info('[NoShowDetectorJob] Analyse des réservations en retard...');

    try {
      // Lister les tenants actifs
      const tenants = await Nexus.adapter.query<{ id: string }>('tenants');

      for (const tenant of tenants) {
        const tenantId = tenant.id;
        if (!tenantId) continue;

        const rawTenantConfig = await Nexus.adapter.get(`tenants/${tenantId}/tenantConfig`);
        const resaConfig = (rawTenantConfig as JsonObject | null)?.reservationConfig as JsonObject | undefined;
        const noShowDelayMinutes = (resaConfig?.noShowDelayMinutes as number | undefined) ?? 30;

        const todayStr = new Date().toISOString().split('T')[0];
        const reservations = await Nexus.adapter.query<ReservationRecord>(`tenants/${tenantId}/reservations`, {
          where: [
            { field: 'date', operator: '==', value: todayStr },
            { field: 'status', operator: '==', value: 'confirmed' },
          ],
        });

        const now = new Date();

        for (const res of reservations) {
          if (!res.time) continue;
          const resStart = parse(`${res.date} ${res.time}`, 'yyyy-MM-dd HH:mm', new Date());
          const noShowCutoff = addMinutes(resStart, noShowDelayMinutes);

          if (isBefore(noShowCutoff, now)) {
            logger.warn(`[NoShowDetectorJob] Réservation ${res.id} (Tenant: ${tenantId}) dépassée de ${noShowDelayMinutes}min -> passage en no_show`);

            await Nexus.adapter.update(`tenants/${tenantId}/reservations/${res.id}`, {
              status: 'no_show',
              noShowDetectedAt: now.toISOString(),
            });

            await NexusEventBus.emitDurable('reservation.no_show', {
              v: 1,
              tenantId,
              reservationId: res.id,
              customerId: res.customerId,
              customerName: res.customerName,
              covers: res.covers,
              date: res.date,
              time: res.time,
            });

            // Si une empreinte bancaire a été collectée, appeler la route de charge
            if (res.cardImprintStatus === 'collected' && res.stripePaymentMethodId) {
              logger.info(`[NoShowDetectorJob] Déclenchement prélèvement empreinte pour réservation ${res.id}`);
              
              const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
              const cronSecret = process.env.CRON_SECRET || 'internal-secret';

              fetch(`${baseUrl}/api/reservations/card-imprint`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${cronSecret}`,
                },
                body: JSON.stringify({
                  action: 'charge',
                  tenantId,
                  reservationId: res.id,
                }),
              }).catch(err => {
                logger.error(`[NoShowDetectorJob] Erreur appel API charge pour ${res.id}`, err);
              });
            }

            empireAudit.log({
              module: 'ops',
              action: 'RESERVATION_NO_SHOW_AUTO_DETECTED',
              details: { reservationId: res.id, tenantId, customerName: res.customerName },
              severity: 'medium',
              timestamp: now,
            });
          }
        }
      }
    } catch (err) {
      logger.error('[NoShowDetectorJob] Erreur exécution cron no-show', err);
    }
  }
}
