import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export interface StorageItem {
  sku: string;
  name: string;
  isEthyleneEmitter: boolean; // ex: Bananes, pommes, tomates
  isEthyleneSensitive: boolean; // ex: Salades, concombres, herbes fraîches, carottes
}

export interface CompatibilityCheckResult {
  storageZoneId: string;
  isCompatible: boolean;
  conflicts: {
    emitterSku: string;
    emitterName: string;
    sensitiveSku: string;
    sensitiveName: string;
    hazard: string;
  }[];
}

/**
 * VolatileFoodCompatibilityMatrixService — Angle mort L32.
 * Détecte les incompatibilités de stockage de denrées volatiles (ex: éthylène des bananes/pommes provoquant le jaunissement et pourrissement rapide des salades).
 */
export class VolatileFoodCompatibilityMatrixService {
  static checkZoneCompatibility(
    tenantId: string,
    storageZoneId: string,
    items: StorageItem[]
  ): CompatibilityCheckResult {
    const emitters = items.filter(i => i.isEthyleneEmitter);
    const sensitives = items.filter(i => i.isEthyleneSensitive);

    const conflicts: CompatibilityCheckResult['conflicts'] = [];

    if (emitters.length > 0 && sensitives.length > 0) {
      for (const em of emitters) {
        for (const sen of sensitives) {
          conflicts.push({
            emitterSku: em.sku,
            emitterName: em.name,
            sensitiveSku: sen.sku,
            sensitiveName: sen.name,
            hazard: `L'éthylène émis par ${em.name} accélère la dégradation et le jaunissement de ${sen.name}`,
          });

          NexusEventBus.emit('logistics.volatile_incompatibility_detected', {
            v: 1,
            tenantId,
            storageZoneId,
            ethyleneEmitterSku: em.sku,
            sensitiveSku: sen.sku,
            detectedAt: Date.now(),
          });
        }
      }
    }

    return {
      storageZoneId,
      isCompatible: conflicts.length === 0,
      conflicts,
    };
  }
}
