/**
 * L14 — Nettoyage dynamique par rupture de séquence (Listeria).
 *
 * Si une trancheuse passe de "jambon cru" à "rôti cuit" sans désinfection
 * intermédiaire obligatoire, le risque Listeria est majeur (TIAC + fermeture).
 *
 * Ce service vérifie la séquence de tâches cuisine :
 *  - Certains enchaînements `fromTask → toTask` exigent un protocole de
 *    désinfection intermédiaire
 *  - Si le protocole n'est pas déclaré comme complété → alerte critique +
 *    blocage optionnel
 *
 * Cf. docs/anglemort-restaurant-mcc.md § L14 (CRITIQUE — Listeria).
 */
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/lib/audit';
import { OutboxService, OutboxPriority } from '@/lib/offline/OutboxService';

/** Matrice des enchaînements qui exigent désinfection */
const REQUIRED_PROTOCOLS: Record<string, Record<string, string>> = {
  raw_meat: { cooked_meat: 'P3_high_temp_sanitize', ready_to_eat: 'P3_high_temp_sanitize' },
  raw_fish: { cooked_fish: 'P2_sanitize', ready_to_eat: 'P3_high_temp_sanitize', raw_meat: 'P3_high_temp_sanitize' },
  raw_poultry: { cooked_poultry: 'P3_high_temp_sanitize', cooked_meat: 'P3_high_temp_sanitize', ready_to_eat: 'P3_high_temp_sanitize' },
  allergen_gluten: { allergen_free: 'P1_rinse_sanitize' },
  allergen_nuts: { allergen_free: 'P1_rinse_sanitize' },
};

export interface SequenceCheckInput {
  tenantId: string;
  stationId: string;
  fromTaskCategory: string;
  toTaskCategory: string;
  sanitizationCompletedAt?: number;
  operatorId: string;
  now?: number;
}

export interface SequenceCheckResult {
  safe: boolean;
  requiredProtocol?: string;
  violation?: string;
}

export class DisinfectionSequenceService {
  static check(fromCategory: string, toCategory: string): { requiredProtocol: string | null } {
    const fromMap = REQUIRED_PROTOCOLS[fromCategory];
    if (!fromMap) return { requiredProtocol: null };
    return { requiredProtocol: fromMap[toCategory] ?? null };
  }

  static async validateAndAlert(input: SequenceCheckInput): Promise<SequenceCheckResult> {
    const now = input.now ?? Date.now();
    const { requiredProtocol } = this.check(input.fromTaskCategory, input.toTaskCategory);

    if (!requiredProtocol) return { safe: true };

    if (!input.sanitizationCompletedAt || input.sanitizationCompletedAt < now - 30 * 60_000) {
      const violation = `${input.fromTaskCategory} → ${input.toTaskCategory} sans ${requiredProtocol}`;

      await OutboxService.enqueue({
        action: 'CREATE',
        collection: `tenants/${input.tenantId}/disinfection_violations`,
        targetId: `disinfv_${input.stationId}_${now}`,
        priority: OutboxPriority.SANITAIRE,
        payload: {
          stationId: input.stationId,
          fromTask: input.fromTaskCategory,
          toTask: input.toTaskCategory,
          requiredProtocol,
          violatedAt: now,
        },
      }).catch(() => 0);

      await AuditLogger.logAction(
        input.operatorId,
        'DISINFECTION_SEQUENCE_VIOLATION',
        input.stationId,
        { fromTask: input.fromTaskCategory, toTask: input.toTaskCategory, requiredProtocol },
      ).catch(() => null);

      await NexusEventBus.emit('compliance.disinfection_sequence_violation', {
        v: 1,
        tenantId: input.tenantId,
        stationId: input.stationId,
        fromTask: input.fromTaskCategory,
        toTask: input.toTaskCategory,
        requiredProtocol,
        violatedAt: now,
      });

      return { safe: false, requiredProtocol, violation };
    }

    return { safe: true, requiredProtocol };
  }
}
