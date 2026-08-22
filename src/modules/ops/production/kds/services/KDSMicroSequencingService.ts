import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export interface MicroSequenceStep {
  stepNumber: number;
  actionLabel: string; // ex: 'Enfourner soufflé', 'Dresser boule de glace vanille'
  delayFromStartSeconds: number; // T0+0s vs T0+450s (7m30)
  targetStation: 'chaud' | 'patisserie' | 'passe';
}

export interface MicroSequencePlan {
  orderId: string;
  dishName: string;
  totalDurationSeconds: number;
  steps: MicroSequenceStep[];
}

/**
 * KDSMicroSequencingService — Angle mort L12.
 * Orchestre le micro-séquençage multi-postes (ex: cuisson soufflé 10 min au chaud + dressage glace minute à T0+7min30 en pâtisserie pour envoi synchrone).
 */
export class KDSMicroSequencingService {
  static createSequencePlan(
    tenantId: string,
    orderId: string,
    dishName: string,
    steps: MicroSequenceStep[]
  ): MicroSequencePlan {
    const totalDurationSeconds = Math.max(...steps.map(s => s.delayFromStartSeconds), 0);

    for (const step of steps) {
      NexusEventBus.emit('kds.micro_sequence_step_triggered', {
        v: 1,
        tenantId,
        orderId,
        dishName,
        stepNumber: step.stepNumber,
        actionLabel: step.actionLabel,
        triggerAt: Date.now() + (step.delayFromStartSeconds * 1000),
      });
    }

    return {
      orderId,
      dishName,
      totalDurationSeconds,
      steps,
    };
  }
}
