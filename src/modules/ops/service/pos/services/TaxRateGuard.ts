/**
 * D5 — Refus vente si `taxRate` non configuré.
 *
 * Article 289 CGI + Décret NF525 : chaque ligne de vente doit porter un taux
 * de TVA explicite. Actuellement `posHelpers.mapProductToCartItem` fallback
 * silencieusement sur `"0.10"` si le produit n'en a pas — un contrôle DGFiP
 * requalifie le tenant sur toute la période avec une TVA différente
 * (redressement + intérêts).
 *
 * Ce guard s'appelle avant `sendToKitchen`, `openTicket`, `checkout` et
 * refuse la validation si UN item n'a pas de `taxRate` explicite dans
 * `["0.055", "0.10", "0.20", "0.00"]` (taux ORTA France 2026).
 *
 * Cf. docs/anglemort-restaurant-mcc.md § D5 (CRITIQUE).
 */
import { AuditLogger } from '@/modules/compliance/securite/AuditLogger';

const ALLOWED_TAX_RATES = new Set(['0.00', '0.055', '0.10', '0.20', '0.021', '0.13']);

export interface TaxRateGuardItem {
  cartId: string;
  productId: string;
  name: string;
  taxRate?: string | number | null;
}

export interface TaxRateGuardResult {
  allowed: boolean;
  offendingItems: Array<{ cartId: string; productId: string; name: string; providedRate: string | null }>;
}

export class TaxRateGuard {
  /**
   * Normalise et valide chaque item. Pur, testable.
   */
  static evaluate(items: TaxRateGuardItem[]): TaxRateGuardResult {
    const offending: TaxRateGuardResult['offendingItems'] = [];

    for (const item of items) {
      const raw = item.taxRate;
      if (raw === null || raw === undefined || raw === '' || raw === 'null') {
        offending.push({ cartId: item.cartId, productId: item.productId, name: item.name, providedRate: null });
        continue;
      }
      const normalized = String(raw);
      if (!ALLOWED_TAX_RATES.has(normalized)) {
        offending.push({ cartId: item.cartId, productId: item.productId, name: item.name, providedRate: normalized });
      }
    }

    return { allowed: offending.length === 0, offendingItems: offending };
  }

  /** Compat SDK : throws si guard échoue. */
  static assertOrThrow(items: TaxRateGuardItem[]): void {
    const result = this.evaluate(items);
    if (!result.allowed) {
      const list = result.offendingItems.map(i => `${i.name} (${i.productId})`).join(', ');
      throw new Error(`TAX_RATE_MISSING: ${list}`);
    }
  }

  /**
   * Compat pipeline : évalue + trace via AuditLogger si refus.
   */
  static async guard(
    tenantId: string,
    operatorId: string,
    orderId: string | null,
    items: TaxRateGuardItem[],
  ): Promise<TaxRateGuardResult> {
    const result = this.evaluate(items);
    if (!result.allowed) {
      await AuditLogger.logAction(
        operatorId,
        'FISCAL_SEAL_ANOMALY_DETECTED',
        orderId ?? `pos_no_order_${Date.now()}`,
        {
          kind: 'TAX_RATE_MISSING',
          tenantId,
          offendingItems: result.offendingItems,
        },
      ).catch(() => null);
    }
    return result;
  }

  static get allowedRates(): readonly string[] {
    return Array.from(ALLOWED_TAX_RATES);
  }
}
