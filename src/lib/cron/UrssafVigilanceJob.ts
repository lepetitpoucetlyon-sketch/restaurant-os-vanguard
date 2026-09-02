import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { logger } from '@/lib/logger';
import type { User } from '@nexus/contracts';

const URSSAF_ANNUAL_THRESHOLD_EUR = 5000;

/**
 * 🛡️ UrssafVigilanceJob
 * 
 * Job de contrôle périodique de conformité URSSAF pour les prestataires et sous-traitants.
 * Vérifie la validité des attestations semestrielles (Art. L.8222-1 du Code du travail)
 * et alerte la direction en cas d'expiration imminente ou de dépassement du seuil de 5 000 €.
 */
export const UrssafVigilanceJob = {
  name: 'UrssafVigilanceJob',
  schedule: '0 8 1,15 * *', // Les 1er et 15 de chaque mois à 08h00
  async runForTenant(tenantId: string): Promise<void> {
    try {
      const users = await Nexus.adapter.query<User>(`tenants/${tenantId}/users`);
      const contractors = users.filter(u => u.employmentStatus === 'contractor' || u.contractType === 'freelance');

      const now = Date.now();
      const in15Days = now + 15 * 24 * 60 * 60 * 1000;
      const currentYear = new Date().getFullYear();

      for (const contractor of contractors) {
        const profile = contractor.contractorProfile;
        if (!profile) continue;

        const path = `tenants/${tenantId}/human/contractorAccumulators/${currentYear}_${contractor.id}`;
        const doc = await Nexus.adapter.get<{ totalHtInMicrounits: number }>(path);
        const annualTotalMu = doc?.totalHtInMicrounits ?? 0;
        const annualTotalEur = annualTotalMu / 1_000_000;
        const isAboveThreshold = annualTotalEur >= URSSAF_ANNUAL_THRESHOLD_EUR;

        // 1. Contrôle de date d'expiration de l'attestation
        if (profile.urssafVigilanceValidUntil) {
          const validUntilMs = new Date(profile.urssafVigilanceValidUntil).getTime();

          if (!isNaN(validUntilMs)) {
            // Expiré
            if (validUntilMs < now) {
              if (profile.vigilanceStatus !== 'expired') {
                logger.warn(`[UrssafVigilanceJob] Attestation expirée pour prestataire ${contractor.id} (${contractor.name})`);
                await Nexus.adapter.update(`tenants/${tenantId}/users/${contractor.id}`, {
                  contractorProfile: {
                    ...profile,
                    vigilanceStatus: 'expired',
                  }
                });
              }

              if (isAboveThreshold) {
                await NexusEventBus.emitDurable('notification.created', {
                  v: 1,
                  tenantId,
                  id: `notif_urssaf_${contractor.id}_${Date.now()}`,
                  type: 'alert',
                  title: `Alerte URSSAF : Attestation expirée (${contractor.name})`,
                  message: `Le prestataire ${contractor.name} a dépassé 5 000 € de CA annuel (${annualTotalEur.toFixed(2)} €) mais son attestation de vigilance est expirée. Facturation bloquée.`,
                  priority: 'critical',
                  read: false,
                  timestamp: new Date().toISOString(),
                });
              }
            } else if (validUntilMs <= in15Days) {
              // Expire bientôt (dans les 15 jours)
              const daysLeft = Math.ceil((validUntilMs - now) / (1000 * 3600 * 24));
              logger.info(`[UrssafVigilanceJob] Attestation expirant dans ${daysLeft}j pour prestataire ${contractor.id}`);
              
              await NexusEventBus.emitDurable('notification.created', {
                v: 1,
                tenantId,
                id: `notif_urssaf_warn_${contractor.id}_${Date.now()}`,
                type: 'warning',
                title: `Rappel URSSAF : Renouvellement attestation (${contractor.name})`,
                message: `L'attestation de vigilance semestrielle de ${contractor.name} expire dans ${daysLeft} jours.`,
                priority: 'medium',
                read: false,
                timestamp: new Date().toISOString(),
              });
            }
          }
        } else if (isAboveThreshold) {
          // Jamais fournie et seuil dépassé
          if (profile.vigilanceStatus !== 'missing') {
            await Nexus.adapter.update(`tenants/${tenantId}/users/${contractor.id}`, {
              contractorProfile: {
                ...profile,
                vigilanceStatus: 'missing',
              }
            });
          }

          await NexusEventBus.emitDurable('notification.created', {
            v: 1,
            tenantId,
            id: `notif_urssaf_miss_${contractor.id}_${Date.now()}`,
            type: 'alert',
            title: `Alerte URSSAF : Attestation manquante (${contractor.name})`,
            message: `Le prestataire ${contractor.name} a cumulé ${annualTotalEur.toFixed(2)} € (seuil : 5 000 €). Attestation de vigilance obligatoire requise.`,
            priority: 'critical',
            read: false,
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      logger.error(`[UrssafVigilanceJob] Erreur lors de l'exécution pour le tenant ${tenantId}`, err);
    }
  }
};
