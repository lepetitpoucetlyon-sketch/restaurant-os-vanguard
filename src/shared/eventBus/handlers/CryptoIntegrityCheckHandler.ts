import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { CryptoService } from '@/lib/CryptoService';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';
import type { FiscalSeal } from '@nexus/contracts';

export function registerCryptoIntegrityCheckHandler() {
  return NexusEventBus.on(
    'finance.daily_audit',
    async (payload) => {
      const { tenantId, date } = payload;

      logger.info(`[CryptoIntegrityCheck] Démarrage vérification chaîne NF525 pour ${date}...`);

      const seals = await Nexus.adapter.query(
        `tenants/${tenantId}/fiscalSeals`,
        { where: [{ field: 'timestamp', operator: '>=', value: `${date}T00:00:00.000Z` },
                  { field: 'timestamp', operator: '<=', value: `${date}T23:59:59.999Z` }] }
      ) as FiscalSeal[];

      if (seals.length === 0) {
        logger.info(`[CryptoIntegrityCheck] Aucun sceau pour ${date} — journée sans encaissement.`);
        return;
      }

      const dateKey = (v: unknown): string | number => {
        if (typeof v === 'string' || typeof v === 'number') return v;
        return 0;
      };
      const sorted = [...seals].sort(
        (a, b) => new Date(dateKey(a.serverRecordedAt ?? a.timestamp)).getTime() - new Date(dateKey(b.serverRecordedAt ?? b.timestamp)).getTime()
      );

      let brokenAt: string | null = null;

      for (let i = 0; i < sorted.length; i++) {
        const seal = sorted[i];
        if (seal.hash === 'TRAINING_MODE_UNSIGNED_HASH') continue;
        if (!seal.dataSnapshot) continue;

        // Contrôle de continuité de la chaîne
        if (i > 0 && seal.previousHash !== sorted[i - 1].hash) {
          brokenAt = seal.id ?? 'unknown';
          break;
        }

        const recomputed = await CryptoService.generateHash(seal.dataSnapshot, seal.previousHash);
        if (recomputed !== seal.hash) {
          brokenAt = seal.id ?? 'unknown';
          break;
        }
      }

      if (brokenAt) {
        logger.error(`[CryptoIntegrityCheck] RUPTURE CHAÎNE NF525 au sceau ${brokenAt}`);

        empireAudit.log({
          module: 'fiscal',
          action: 'CRYPTO_CHAIN_BROKEN',
          details: { date, brokenSealId: brokenAt },
          severity: 'critical',
          timestamp: new Date(),
        });

        await NexusEventBus.emit('notification.urgent', {
          v: 1,
          tenantId,
          message: `ALERTE CRITIQUE NF525 : Rupture de chaîne cryptographique détectée pour la journée du ${date} (sceau ${brokenAt}). Contactez votre expert-comptable.`,
          roles: ['admin'],
          priority: 'CRITICAL',
        });
      } else {
        logger.info(`[CryptoIntegrityCheck] Chaîne validée : ${sorted.length} sceau(x) intègre(s) pour ${date}`);
        empireAudit.log({
          module: 'fiscal',
          action: 'CRYPTO_CHAIN_VALID',
          details: { date, sealsChecked: sorted.length },
          severity: 'low',
          timestamp: new Date(),
        });
      }
    },
    { id: 'crypto-integrity-check-handler', priority: 'BACKGROUND' }
  );
}
