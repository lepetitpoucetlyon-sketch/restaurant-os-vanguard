/**
 * D3 — Grand total périodique (mensuel / annuel).
 *
 * Art. 88 CGI : l'exploitant doit produire chaque mois et chaque année un cumul
 * cryptographique des totaux de caisse. La collection `grandTotals` existe déjà
 * mais le scheduler n'était pas actif.
 *
 * Ce job tourne le 1er de chaque mois à 01h00 (mensuel) et le 1er janvier à
 * 02h00 (annuel). Il cumule les JournalEntries du mois/année précédent, calcule
 * un hash SHA-256 chaîné et scelle l'entrée `grandTotals`.
 *
 * Cf. docs/anglemort-restaurant-mcc.md § D3 (HAUT).
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { CryptoService } from '@/lib/CryptoService';
import { logger } from '@/lib/logger';

export const GrandTotalScheduler = {
  name: 'GrandTotalScheduler',
  scheduleMonthly: '0 1 1 * *',
  scheduleAnnual: '0 2 1 1 *',

  async runForTenant(tenantId: string, period: 'monthly' | 'annual', periodLabel: string): Promise<void> {
    try {
      const entries = await Nexus.adapter.query<Record<string, unknown>>(
        `tenants/${tenantId}/journalEntries`,
      ) ?? [];

      const filtered = entries.filter(e => {
        const d = String(e.date ?? '');
        return period === 'monthly' ? d.startsWith(periodLabel) : d.startsWith(periodLabel.slice(0, 4));
      });

      const totalInMicrounits = filtered.reduce((sum, e) => {
        const lines = (e.lines as Array<{ credit?: number }>) ?? [];
        return sum + lines.reduce((s, l) => s + (l.credit ?? 0), 0);
      }, 0);

      const previousRecord = await Nexus.adapter.get<{ hash: string }>(
        `tenants/${tenantId}/grandTotals/prev_${period}`,
      );
      const previousHash = previousRecord?.hash ?? '';

      const dataString = `${tenantId}|${period}|${periodLabel}|${totalInMicrounits}`;
      const hash = await CryptoService.generateHash(dataString, previousHash);

      const record = { tenantId, period, periodLabel, totalInMicrounits, hash, sealedAt: Date.now() };
      await Nexus.adapter.set(`tenants/${tenantId}/grandTotals/${periodLabel}`, record);
      await Nexus.adapter.set(`tenants/${tenantId}/grandTotals/prev_${period}`, { hash });

      await NexusEventBus.emitDurable('finance.grand_total_sealed', {
        v: 1,
        tenantId,
        period,
        periodLabel,
        totalInMicrounits,
        hash,
        sealedAt: record.sealedAt,
      });

      logger.info(`[GrandTotalScheduler] ${period} ${periodLabel} → ${totalInMicrounits} µ tenant=${tenantId}`);
    } catch (err) {
      logger.error(`[GrandTotalScheduler] Erreur tenant=${tenantId}`, String(err));
    }
  },
};
