import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import {
  TurnoverPredictionService,
  type MenuProfile,
} from '../../reservations/services/TurnoverPredictionService';

export interface TableSeatingSpec {
  tableNumber: string;
  covers: number;
  seatedAtTimestamp: number;
  currentCourseStage: 'entree' | 'plat' | 'dessert' | 'addition_demandee';
  /** Profil de menu — pilote la baseline de durée. Défaut : `'standard'`. */
  menuProfile?: MenuProfile;
  /** Retard cuisine actuel en minutes (0 = à l'heure). */
  currentKdsDelayMinutes?: number;
}

export interface TableTurnoverPrediction {
  tableNumber: string;
  predictedTotalDurationMinutes: number;
  predictedDepartureTimestamp: number;
  isSecondSeatingFeasible: boolean; // Table libérée avant 21h30 pour second service
  recommendedAction: string;
}

/**
 * TableTurnoverOptimizationService — Angle mort L82.
 * Optimisation du double service : détermine si un 2e créneau est tenable selon
 * l'avancement des plats, et formule une recommandation au manager.
 *
 * ⚠️ **DF-O1 résolu (2026-08-25).** Ce service calculait auparavant sa propre durée
 * d'occupation (paliers 75/90), divergente de `TurnoverPredictionService`. Pour la même
 * table, les deux répondaient différemment selon l'écran consulté.
 * Le calcul est désormais **délégué à la source unique** ; ce service conserve sa valeur
 * propre : la lecture du stade de service et la recommandation d'action.
 */
export class TableTurnoverOptimizationService {
  static predictTurnover(tenantId: string, seating: TableSeatingSpec): TableTurnoverPrediction {
    // Source unique de la durée (DF-O1) — réglable par le gérant via DF-C5 / DF-C6.
    const baseDuration = TurnoverPredictionService.durationMinutes(
      seating.covers,
      seating.menuProfile ?? 'standard',
      seating.currentKdsDelayMinutes ?? 0,
    );
    const predictedDepartureTimestamp = seating.seatedAtTimestamp + (baseDuration * 60 * 1000);

    const isSecondSeatingFeasible = seating.currentCourseStage === 'dessert' || seating.currentCourseStage === 'addition_demandee';

    NexusEventBus.emit('crm.turnover_optimized', {
      v: 1,
      tenantId,
      tableNumber: seating.tableNumber,
      predictedDurationMinutes: baseDuration,
      secondSeatingAvailable: isSecondSeatingFeasible,
      optimizedAt: Date.now(),
    });

    return {
      tableNumber: seating.tableNumber,
      predictedTotalDurationMinutes: baseDuration,
      predictedDepartureTimestamp,
      isSecondSeatingFeasible,
      recommendedAction: isSecondSeatingFeasible
        ? 'Table prête pour le second service à l\'heure prévue.'
        : 'Accélérer la cadence de service desserts si second service programmé.',
    };
  }
}
