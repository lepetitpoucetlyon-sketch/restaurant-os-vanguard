import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';
import { MultiTenantBillingEngineService } from '@/lib/mcc/fleet/services/MultiTenantBillingEngineService';
import { PRICING, type PricingTier } from '@/shared/constants/pricing';

/** Un terminal tel que persisté par DeviceFleetManager (`tenants/{t}/devices`). */
interface DeviceRecord {
  deviceId: string;
  deviceType?: string;
  status?: string;
  lastActiveAt?: number;
}

/** Écriture au journal NF525 — seule source de vérité du volume encaissé. */
interface JournalEntryRecord {
  amountInMicrounits?: number;
  type?: 'revenue' | 'expense' | 'tax' | 'other';
  status?: string;
  serverTimestamp?: number | string;
}

/** Frais par terminal actif au-delà du premier : 29,00 € HT. */
const TERMINAL_FEE_IN_MICROUNITS = 29_000_000;

/** Commission variable sur le volume encaissé, en points de base (50 bps = 0,50 %). */
const VARIABLE_COMMISSION_BPS = 50;

/** Un terminal compte s'il a été vu dans les 45 jours — au-delà, il n'est pas facturé. */
const TERMINAL_ACTIVITY_WINDOW_MS = 45 * 24 * 60 * 60 * 1000;

const EUR_TO_MICROUNITS = 1_000_000;

/** Mappe le plan porté par `tenantConfig.billing.plan` vers un palier de PRICING. */
function resolveTier(rawPlan: string | undefined): PricingTier {
  const normalized = (rawPlan ?? '').trim().toUpperCase();
  if (normalized in PRICING) return normalized as PricingTier;
  return 'STANDARD';
}

/** Bornes [début, fin[ du mois civil précédant `reference`, en millisecondes UTC. */
function previousMonthWindow(reference: Date): { startMs: number; endMs: number; label: string } {
  const year = reference.getUTCFullYear();
  const month = reference.getUTCMonth();
  const startMs = Date.UTC(year, month - 1, 1);
  const endMs = Date.UTC(year, month, 1);
  const start = new Date(startMs);
  const label = `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, '0')}`;
  return { startMs, endMs, label };
}

function toMillis(value: number | string | undefined): number | null {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

/**
 * SaaSBillingJob — déclencheur de la facturation SaaS mensuelle du MCC.
 *
 * `MultiTenantBillingEngineService` calculait juste et persistait juste (via
 * `fleet.saas_billing_invoiced` → `SaaSInvoicePersistHandler`), mais **n'avait
 * aucun appelant** : le moteur ne tournait jamais. Ce job est le déclencheur
 * manquant.
 *
 * Il s'exécute le 1er de chaque mois à 03h00 et facture le mois civil ÉCOULÉ,
 * à partir de données réelles uniquement :
 *   - volume  → somme des écritures `revenue` du journal NF525 sur la période ;
 *   - terminaux → `tenants/{t}/devices` actifs, vus dans les 45 jours ;
 *   - plan    → `tenantConfig.billing.plan`, résolu sur la table PRICING.
 *
 * Idempotence : l'`invoiceId` est déterministe (`INV-SAAS-{tenant}-{période}`).
 * Le job vérifie la présence de la facture avant de recalculer, donc plusieurs
 * passages sur le même mois ne produisent qu'une facture.
 */
export const SaaSBillingJob = {
  name: 'SaaSBillingJob',
  /** 03h00, le 1er de chaque mois. */
  schedule: '0 3 1 * *',

  async runForTenant(tenantId: string): Promise<void> {
    try {
      const { startMs, endMs, label } = previousMonthWindow(new Date());
      const invoiceId = `INV-SAAS-${tenantId}-${label}`;

      const existing = await Nexus.adapter.get(`tenants/${tenantId}/saasInvoices/${invoiceId}`);
      if (existing) {
        logger.info(`[SaaSBillingJob] Facture ${invoiceId} déjà émise — rien à faire.`);
        return;
      }

      const tenantConfig = await Nexus.adapter.get<{ billing?: { plan?: string; status?: string } }>(
        `tenants/${tenantId}`
      );

      // Un tenant résilié ou suspendu n'est pas facturé.
      const billingStatus = (tenantConfig?.billing?.status ?? 'active').toLowerCase();
      if (billingStatus === 'cancelled' || billingStatus === 'suspended') {
        logger.info(`[SaaSBillingJob] Tenant ${tenantId} en statut '${billingStatus}' — non facturé.`);
        return;
      }

      const tier = resolveTier(tenantConfig?.billing?.plan);
      const planBaseFeeInMicrounits = PRICING[tier].monthlyEur * EUR_TO_MICROUNITS;

      // ── Volume encaissé : journal NF525, écritures de recette de la période ──
      const entries = await Nexus.adapter.query<JournalEntryRecord>(`tenants/${tenantId}/journalEntries`);
      const totalVolumeProcessedInMicrounits = entries.reduce((sum, entry) => {
        if (entry.type !== 'revenue') return sum;
        if (entry.status === 'cancelled' || entry.status === 'refunded') return sum;
        const ts = toMillis(entry.serverTimestamp);
        if (ts === null || ts < startMs || ts >= endMs) return sum;
        return sum + (entry.amountInMicrounits ?? 0);
      }, 0);

      // ── Terminaux actifs : le premier est inclus dans le forfait ──────────────
      const devices = await Nexus.adapter.query<DeviceRecord>(`tenants/${tenantId}/devices`);
      const activityFloor = endMs - TERMINAL_ACTIVITY_WINDOW_MS;
      const activeTerminals = devices.filter(
        d =>
          d.status === 'active' &&
          (d.deviceType ?? '').startsWith('pos') &&
          (d.lastActiveAt ?? 0) >= activityFloor
      ).length;
      const billableTerminalCount = Math.max(0, activeTerminals - 1);

      const invoice = await MultiTenantBillingEngineService.generateMonthlySaaSInvoice(
        'system:SaaSBillingJob',
        {
          tenantId,
          periodLabel: label,
          planBaseFeeInMicrounits,
          activePosTerminalCount: billableTerminalCount,
          terminalFeeInMicrounits: TERMINAL_FEE_IN_MICROUNITS,
          totalVolumeProcessedInMicrounits,
          variableCommissionBps: VARIABLE_COMMISSION_BPS,
        },
        'system'
      );

      logger.info(
        `[SaaSBillingJob] ${tenantId} — période ${label} : plan ${tier}, ` +
          `${billableTerminalCount} terminal(s) facturé(s) sur ${activeTerminals} actif(s), ` +
          `volume ${totalVolumeProcessedInMicrounits} µ → facture ${invoice.invoiceId} ` +
          `(${invoice.totalTtcInMicrounits} µ TTC)`
      );
    } catch (err) {
      logger.error(`[SaaSBillingJob] Échec de la facturation pour le tenant ${tenantId}`, {
        error: toError(err).message,
      });
    }
  },
};
