/**
 * CryptoIntegrityHandler — I7 : Sécurité → MCC
 *
 * Quand une rupture de chaîne NF525 est détectée (`crypto.integrity_failed`),
 * persiste la preuve dans deux collections :
 *
 *   1. `tenants/{tenantId}/fiscalIntegrityBreaches/` — accessible par le tenant
 *      (vue d'ensemble de ses propres anomalies)
 *
 *   2. `mccFiscalBreaches/` — vue consolidée SUPER ADMIN uniquement
 *      Organisée par tenant, triable par date, exportable PDF pour l'administration
 *      fiscale (DGFIP/DGFiP). SovereignGuard protège cette collection en lecture seule.
 *
 * Structure garantissant la preuve légale :
 *   - Identifiant de l'entrée de journal concernée
 *   - Hash attendu vs hash calculé
 *   - Timestamp de détection (non modifiable)
 *   - Statut : 'detected' → 'reported' → 'resolved'
 */
import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

export function registerCryptoIntegrityHandler(): () => void {
  return NexusEventBus.on(
    'crypto.integrity_failed',
    async (payload) => {
      const { tenantId, journalId, expectedHash, actualHash, detectedAt } = payload;

      const breachId = `breach_${journalId}_${detectedAt}`;
      const breachRecord = {
        id: breachId,
        tenantId,
        journalId,
        expectedHash,
        actualHash,
        detectedAt,
        detectedAtISO: new Date(detectedAt).toISOString(),
        status: 'detected' as const,
        legalReference: 'NF525 — Chaîne de scellement SHA-256',
        reportedToAdminAt: null,
        resolvedAt: null,
      };

      try {
        // 1. Écriture tenant — trace locale
        await Nexus.adapter.set(
          `tenants/${tenantId}/fiscalIntegrityBreaches/${breachId}`,
          breachRecord
        );

        // 2. Écriture MCC — vue consolidée super admin
        //    Cette collection est listée dans SovereignGuard (lectures seules depuis le MCC)
        await Nexus.adapter.set(
          `mccFiscalBreaches/${breachId}`,
          breachRecord
        );

        // 3. Déclencher audit fiscal MCC immédiat
        await NexusEventBus.emit('mcc.fiscal_audit_required', {
          tenantId,
          reason: `Rupture chaîne NF525 — Journal ${journalId} (hash attendu: ${expectedHash.slice(0, 12)}…)`,
          urgency: 'critical',
        });

        // 4. Notification urgente à l'équipe
        await NexusEventBus.emit('notification.urgent', {
          v: 1,
          tenantId,
          message: `🔴 INTÉGRITÉ NF525 COMPROMISE — Journal ${journalId} — Rupture chaîne de hachage détectée`,
          roles: ['super_admin', 'admin', 'directeur'],
          priority: 'CRITICAL',
        });

        logger.error(
          `[CryptoIntegrity] ⛔ Rupture NF525 tenant ${tenantId} — journal ${journalId} | attendu: ${expectedHash.slice(0, 16)}… | réel: ${actualHash.slice(0, 16)}…`
        );

        empireAudit.log({
          module: 'fiscal',
          action: 'NF525_INTEGRITY_BREACH',
          details: {
            tenantId,
            journalId,
            expectedHash,
            actualHash,
            breachId,
          },
          severity: 'critical',
          timestamp: detectedAt ? new Date(detectedAt) : new Date(),
        });
      } catch (err) {
        logger.error('[CryptoIntegrity] Erreur persistance breach NF525', err);
        throw err;
      }
    },
    { id: 'crypto-integrity-nf525', priority: 'CRITICAL' }
  );
}
