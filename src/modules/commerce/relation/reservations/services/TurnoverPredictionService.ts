/**
 * M108 — Turnover Collision 2e service
 *
 * Une table servie en dégustation à 19h30 ne sera pas libre à 21h30 → il faut
 * prédire le retard AVANT de louer le créneau. Heuristique :
 *
 *   duréePrédite = baseline(partySize) × facteurMenu × facteurRetardKDS
 *
 * Émet `ops.turnover_delay_predicted` quand la fenêtre de battement (`turnoverBuffer`)
 * est insuffisante — le manager voit une alerte et peut réassigner la table suivante.
 *
 * Cf. docs/anglemort-restaurant-mcc.md § SECTION 4 M108.
 * RBAC : `reservations.reassign_tbl` (Chef de rang).
 */
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { getSetting } from '@/lib/settings/SettingsReader';

export type MenuProfile = 'quick' | 'standard' | 'tasting' | 'business_lunch';

export interface PredictInput {
  tenantId: string;
  tableId: string;
  currentReservationId: string;
  nextReservationId: string;
  currentStartMs: number;
  nextSlotMs: number;
  partySize: number;
  menuProfile: MenuProfile;
  /** Retard cuisine actuel en minutes (0 = à l'heure). */
  currentKdsDelayMinutes?: number;
  /** Battement de sécurité entre 2 services (settings.turnoverBufferMinutes, défaut 15). */
  turnoverBufferMinutes?: number;
}

export interface PredictResult {
  predictedDurationMinutes: number;
  predictedEndMs: number;
  overstayMinutes: number;
  collisionRisk: 'none' | 'buffer_tight' | 'overlap';
}

// Baselines empiriques HCR — durée moyenne d'un couvert en minutes.
const BASELINE_MIN_BY_PROFILE: Record<MenuProfile, number> = {
  quick: 45,
  standard: 90,
  tasting: 150,
  business_lunch: 75,
};

export class TurnoverPredictionService {
  static readonly DEFAULT_BUFFER_MIN = 15;

  /** Prédit la durée + statut collision. Pur, testable (DF-C5 / DF-C6). */
  static predict(input: PredictInput): PredictResult {
    const base = BASELINE_MIN_BY_PROFILE[input.menuProfile];
    const factorPerGuest = getSetting<number>('reservations', 'turnover_factor_per_guest_pct', 6) / 100;
    const maxKdsImpact = getSetting<number>('reservations', 'turnover_kds_impact_max_pct', 50) / 100;

    const partySizeFactor = 1 + Math.max(0, input.partySize - 2) * factorPerGuest; // +6 % par défaut par convive > 2
    const kdsFactor = 1 + Math.min(maxKdsImpact, (input.currentKdsDelayMinutes ?? 0) / 60);

    const predictedDurationMinutes = Math.round(base * partySizeFactor * kdsFactor);
    const predictedEndMs = input.currentStartMs + predictedDurationMinutes * 60 * 1000;
    const buffer = (input.turnoverBufferMinutes ?? this.DEFAULT_BUFFER_MIN) * 60 * 1000;

    const gapMs = input.nextSlotMs - predictedEndMs;
    let collisionRisk: PredictResult['collisionRisk'] = 'none';
    let overstayMinutes = 0;

    if (gapMs < 0) {
      collisionRisk = 'overlap';
      overstayMinutes = Math.ceil(-gapMs / 60000);
    } else if (gapMs < buffer) {
      collisionRisk = 'buffer_tight';
      overstayMinutes = Math.ceil((buffer - gapMs) / 60000);
    }

    return { predictedDurationMinutes, predictedEndMs, overstayMinutes, collisionRisk };
  }

  /** Predict + émet l'event si risque. */
  static async predictAndNotify(input: PredictInput): Promise<PredictResult> {
    const result = this.predict(input);
    if (result.collisionRisk !== 'none') {
      await NexusEventBus.emit('ops.turnover_delay_predicted', {
        v: 1,
        tenantId: input.tenantId,
        tableId: input.tableId,
        currentReservationId: input.currentReservationId,
        nextReservationId: input.nextReservationId,
        predictedOverstayMinutes: result.overstayMinutes,
        nextSlotIso: new Date(input.nextSlotMs).toISOString(),
      });
    }
    return result;
  }
}
