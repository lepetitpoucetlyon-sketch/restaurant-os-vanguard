import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NotificationGateway } from '@/lib/adapters/NotificationGateway';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { logger } from '@/lib/logger';
import { parse, differenceInHours, differenceInMinutes } from 'date-fns';
import type { JsonObject } from "@/shared/types/json";
import { ReservationTemplateFormatter, DEFAULT_RESERVATION_TEMPLATES } from '@/lib/templates/ReservationTemplateFormatter';
import { ReservationTokenSigner } from '@/lib/security/ReservationTokenSigner';

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

          const businessName = (rawTenantConfig as JsonObject | null)?.businessName as string || 'notre établissement';
          const customReminderTemplate = (resaConfig?.reminderMessage as string) || DEFAULT_RESERVATION_TEMPLATES.reminderSms;
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          const modifyLink = ReservationTokenSigner.buildSecureModifyUrl(baseUrl, res.id, tenantId);

          // 1. RAPPEL EMAIL (ex: J-1, window +/- 60min)
          if (!res.reminderEmailSentAt && Math.abs(diffHours - emailReminderHours) <= 1 && res.customerEmail) {
            logger.info(`[ReservationReminderJob] Envoi email rappel J-1 pour réservation ${res.id} à ${res.customerEmail}`);

            const emailBody = ReservationTemplateFormatter.interpolate(
              customReminderTemplate || 'Bonjour {prenom},\n\nNous vous confirmons votre réservation pour {couverts} personne(s) chez {restaurant} le {date} à {heure}.\n\nPour modifier ou annuler : {lien_modification}\n\nÀ très vite !',
              {
                customerName: res.customerName,
                restaurantName: businessName,
                date: res.date,
                time: res.time,
                covers: res.covers,
                modifyLink,
              }
            );

            await NotificationGateway.send({
              tenantId,
              to: res.customerEmail,
              subject: `Rappel de votre réservation chez ${businessName} — ${res.date} à ${res.time}`,
              text: emailBody,
              channel: 'email',
            });

            await Nexus.adapter.update(`tenants/${tenantId}/reservations/${res.id}`, {
              reminderEmailSentAt: now.toISOString(),
            });

            // AUDIT LM 2026-08-30 P1-E : émettre resa.j1 pour réveiller
            // ResaKitchenTaskHandler (crée les tâches cuisine J-1 16h pour
            // groupes > 8). ResaReminderHandler écoutait aussi mais dupliquait
            // l'email envoyé juste au-dessus — supprimé.
            await NexusEventBus.emitDurable('resa.j1', {
              v: 1,
              tenantId,
              reservationId: res.id,
              customerId: res.customerEmail ?? res.customerPhone ?? res.id,
              date: res.date,
              time: res.time,
              covers: res.covers ?? 0,
            });
          }

          // 2. RAPPEL SMS (ex: H-2, window +/- 30min)
          if (!res.reminderSmsSentAt && Math.abs(diffMinutes - smsReminderHours * 60) <= 30 && res.customerPhone) {
            logger.info(`[ReservationReminderJob] Envoi SMS rappel H-2 pour réservation ${res.id} à ${res.customerPhone}`);

            const smsBody = ReservationTemplateFormatter.interpolate(customReminderTemplate, {
              customerName: res.customerName,
              restaurantName: businessName,
              date: res.date,
              time: res.time,
              covers: res.covers,
              modifyLink,
            });

            await NotificationGateway.send({
              tenantId,
              to: res.customerPhone,
              subject: `Rappel Réservation — ${businessName}`,
              text: smsBody,
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
