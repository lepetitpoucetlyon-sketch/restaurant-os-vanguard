import 'server-only';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

export type UsageType = 'sms' | 'email' | 'ai_request';

const UNIT_COST_EUR: Record<UsageType, number> = {
  sms:        0.065,   // ~6,5 cts par SMS
  email:      0.001,   // ~0,1 ct par email
  ai_request: 0.002,   // ~0,2 ct par requête IA
};

export const UsageTracker = {
  /**
   * Incrémente le compteur d'usage d'un tenant.
   * Écrit de manière non-bloquante (void) — ne doit pas bloquer le flux principal.
   */
  async track(tenantId: string, type: UsageType, quantity = 1): Promise<void> {
    try {
      const path   = `tenants/${tenantId}/usage/${new Date().toISOString().slice(0, 7)}`; // YYYY-MM
      const record = await Nexus.adapter.get(path) as Record<string, number> | null ?? {};

      const newCount    = (record[type] ?? 0) + quantity;
      const newCostEur  = parseFloat(((record[`${type}_cost_eur`] ?? 0) + quantity * UNIT_COST_EUR[type]).toFixed(4));

      await Nexus.adapter.set(path, {
        ...record,
        [type]:                newCount,
        [`${type}_cost_eur`]:  newCostEur,
        updatedAt:             new Date().toISOString(),
      });
    } catch (err) {
      logger.warn(`[UsageTracker] Impossible de logger ${type} pour ${tenantId}:`, String(err));
    }
  },

  /**
   * Retourne le résumé d'usage du mois courant pour un tenant.
   */
  async getSummary(tenantId: string): Promise<{
    period: string;
    sms: number; sms_cost_eur: number;
    email: number; email_cost_eur: number;
    ai_request: number; ai_request_cost_eur: number;
    total_cost_eur: number;
  }> {
    const period = new Date().toISOString().slice(0, 7);
    const record = await Nexus.adapter.get(`tenants/${tenantId}/usage/${period}`) as Record<string, number> | null ?? {};

    const sms             = record['sms']                ?? 0;
    const sms_cost        = record['sms_cost_eur']       ?? 0;
    const email           = record['email']              ?? 0;
    const email_cost      = record['email_cost_eur']     ?? 0;
    const ai_req          = record['ai_request']         ?? 0;
    const ai_cost         = record['ai_request_cost_eur'] ?? 0;

    return {
      period,
      sms, sms_cost_eur: sms_cost,
      email, email_cost_eur: email_cost,
      ai_request: ai_req, ai_request_cost_eur: ai_cost,
      total_cost_eur: parseFloat((sms_cost + email_cost + ai_cost).toFixed(4)),
    };
  },
};
