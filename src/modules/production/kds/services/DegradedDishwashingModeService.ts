import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export interface DishwashingFailureAlert {
  cause: 'dishwasher_failure' | 'dishwasher_staff_absence';
  expectedDowntimeHours: number;
}

export interface DegradedModePlan {
  isDegradedModeActive: boolean;
  switchAllToDisposablePackaging: boolean;
  blockHardToWashMenuCategories: string[];
  kdsInstructionBanner: string;
}

/**
 * DegradedDishwashingModeService — Angle mort L40.
 * Mode "Flux Vaisselle Dégradé" en cas de panne de plonge ou abandon de poste :
 * Bascule automatique des recettes sur contenants recyclables et masquage des plats nécessitant ramequins/cocottes en fonte.
 */
export class DegradedDishwashingModeService {
  static activateDegradedMode(tenantId: string, alert: DishwashingFailureAlert): DegradedModePlan {
    NexusEventBus.emit('kds.degraded_dishwashing_mode_activated', {
      v: 1,
      tenantId,
      cause: alert.cause,
      packagingSwitchActive: true,
      activatedAt: Date.now(),
    });

    return {
      isDegradedModeActive: true,
      switchAllToDisposablePackaging: true,
      blockHardToWashMenuCategories: ['cocottes_fonte', 'grillades_pierres_chaudes', 'ramequins_creme_brulee'],
      kdsInstructionBanner: '⚠️ MODE PLONGE DÉGRADÉ : Utiliser contenants carton/bambou et couverts éco-responsables.',
    };
  }
}
