/**
 * L68 — RevPASH pastille couleur temps réel.
 *
 * RevPASH = Revenue Per Available Seat-Hour. Indicateur standard HCR pour
 * détecter les tables squatteuses. Une table avec un RevPASH < 8 €/siège/h
 * est une perte d'opportunité de 1 850 €/mois × N tables.
 *
 * Codes couleur :
 *  - 🟢 vert : ≥ 15 €/siège/h (excellent)
 *  - 🟡 jaune : 8-15 €/siège/h (acceptable)
 *  - 🔴 rouge : 4-8 €/siège/h (à surveiller)
 *  - 🟣 violet : < 4 €/siège/h (table squatteuse — intervention requise)
 *
 * Cf. docs/anglemort-restaurant-mcc.md § L68 (HAUT — 1 850 €/mois/table).
 */
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export type RevPASHBadge = 'green' | 'yellow' | 'red' | 'violet';

export interface RevPASHInput {
  tenantId: string;
  tableId: string;
  seats: number;
  revenueInMicrounits: number;
  occupancyMinutes: number;
}

export interface RevPASHResult {
  revPash: number;
  badge: RevPASHBadge;
  revenueEuros: number;
  seatHours: number;
}

export class RevPASHService {
  /** µ = 1/1_000_000 € — conversion en €/siège/heure */
  static compute(input: RevPASHInput): RevPASHResult {
    const seatHours = (input.seats * input.occupancyMinutes) / 60;
    if (seatHours <= 0) return { revPash: 0, badge: 'violet', revenueEuros: 0, seatHours: 0 };

    const revenueEuros = input.revenueInMicrounits / 1_000_000;
    const revPash = revenueEuros / seatHours;

    let badge: RevPASHBadge;
    if (revPash >= 15) badge = 'green';
    else if (revPash >= 8) badge = 'yellow';
    else if (revPash >= 4) badge = 'red';
    else badge = 'violet';

    return { revPash: Math.round(revPash * 100) / 100, badge, revenueEuros, seatHours };
  }

  static async computeAndAlert(input: RevPASHInput, now?: number): Promise<RevPASHResult> {
    const result = this.compute(input);

    if (result.badge === 'violet' || result.badge === 'red') {
      await NexusEventBus.emit('analytics.revpash_alert', {
        v: 1,
        tenantId: input.tenantId,
        tableId: input.tableId,
        seats: input.seats,
        revPash: result.revPash,
        badge: result.badge,
        periodMinutes: input.occupancyMinutes,
        alertedAt: now ?? Date.now(),
      });
    }

    return result;
  }
}
