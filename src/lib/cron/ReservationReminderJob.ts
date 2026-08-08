import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NotificationGateway } from '@/lib/adapters/NotificationGateway';
import { logger } from '@/lib/logger';
import { parse, differenceInHours, differenceInMinutes } from 'date-fns';
import { JsonObject } from "@/shared/types/json";

interface ReservationRecord {
  id: string;
  tenantId: string;
  status: string;
  date: string;
  time: string;
  covers?: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  reminderEmailSentAt?: string;
  reminderSmsSentAt?: string;
}

/**
 * ⏰ ReservationReminderJob (GAP 5)
 * Cron exécuté toutes les heures (`0 * * * *`).
 * Scanne les réservations confirmées de J+0 à J+2 et envoie :
 * - Un email de rappel J-1 (`emailReminderHours` avant le service, ex: 24h)
 * - Un SMS de rappel H-2 (`smsReminderHours` avant le service, ex: 2h)
 */
export class ReservationReminderJob {
  static async run(): Promise<void> {
    logger.info('[ReservationReminderJob] Scan des rappels de réservation à envoyer...');

    try {
      const tenants = await Nexus.adapter.query<{ id: string }>('tenants');
      const now = new Date();

      for (const tenant of tenants) {
        const tenantId = tenant.id;
        if (!tenantId) continue;

        const rawTenantConfig = await Nexus.adapter.get(`tenants/${tenantId}/tenantConfig`);
        const resaConfig = (rawTenantConfig as JsonObject | null)?.reservationConfig as JsonObject | undefined;
        
        const emailReminderHours = (resaConfig?.emailReminderHours as number | undefined) ?? 24;
        const smsReminderHours = (resaConfig?.smsReminderHours as number | undefined) ?? 2;

        // Récupérer les réservations confirmées
        const reservations = await Nexus.adapter.query<ReservationRecord>(`tenants/${tenantId}/reservations`, {
          where: [{ field: 'status', operator: '==', value: 'confirmed' }],
        });

        for (const res of reservations) {
          if (!res.date || !res.time) continue;

          const resStart = parse(`${res.date} ${res.time}`, 'yyyy-MM-dd HH:mm', new Date());
          const diffHours = differenceInHours(resStart, now);
          const diffMinutes = differenceInMinutes(resStart, now);

          // 1. RAPPEL EMAIL (ex: J-1, window +/- 60min)
          if (!res.reminderEmailSentAt && Math.abs(diffHours - emailReminderHours) <= 1 && res.customerEmail) {
            logger.info(`[ReservationReminderJob] Envoi email rappel J-1 pour réservation ${res.id} à ${res.customerEmail}`);

            const modifyLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reservation/${res.id}`;
            await NotificationGateway.send({
              tenantId,
              to: res.customerEmail,
              subject: `Rappel de votre réservation — ${res.date} à ${res.time}`,
              text: `Bonjour ${res.customerName || ''},\n\nNous vous confirmons votre réservation pour ${res.covers || 2} personne(s) le ${res.date} à ${res.time}.\n\nPour modifier ou annuler : ${modifyLink}\n\nÀ très vite !`,
              channel: 'email',
            });

            await Nexus.adapter.update(`tenants/${tenantId}/reservations/${res.id}`, {
              reminderEmailSentAt: now.toISOString(),
            });
          }

          // 2. RAPPEL SMS (ex: H-2, window +/- 30min)
          if (!res.reminderSmsSentAt && Math.abs(diffMinutes - smsReminderHours * 60) <= 30 && res.customerPhone) {
            logger.info(`[ReservationReminderJob] Envoi SMS rappel H-2 pour réservation ${res.id} à ${res.customerPhone}`);

            await NotificationGateway.send({
              tenantId,
              to: res.customerPhone,
              subject: `Rappel Réservation`,
              text: `Rappel : Votre table pour ${res.covers || 2}p est réservée aujourd'hui à ${res.time}. À tout de suite !`,
              channel: 'sms',
            });

            await Nexus.adapter.update(`tenants/${tenantId}/reservations/${res.id}`, {
              reminderSmsSentAt: now.toISOString(),
            });
          }
        }
      }
    } catch (err) {
      logger.error('[ReservationReminderJob] Erreur exécution cron rappels', err);
    }
  }
}
