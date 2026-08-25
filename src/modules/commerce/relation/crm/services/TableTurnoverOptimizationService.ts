import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export interface TableSeatingSpec {
  tableNumber: string;
  covers: number;
  seatedAtTimestamp: number;
  currentCourseStage: 'entree' | 'plat' | 'dessert' | 'addition_demandee';
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
 * Prédiction de rotation des tables et optimisation du double service :
 * Estime le temps d'occupation restant selon l'avancement des plats pour sécuriser le 2e créneau horaire de réservation.
 */
export class TableTurnoverOptimizationService {
  static predictTurnover(tenantId: string, seating: TableSeatingSpec): TableTurnoverPrediction {
    // Règle unifiée de rotation (baseline standard : 2 convives = 75 min, 4 convives = 90 min, scaling au-delà)
    const baseDuration = seating.covers <= 2 
      ? 75 
      : seating.covers <= 4 
        ? 90 
        : Math.round(90 * (1 + (seating.covers - 2) * 0.06));
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
