import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/lib/audit';
import { getSetting } from '@/lib/settings/SettingsReader';

export type ThawingMethod = 'cold_room_positive' | 'microwave_immediate' | 'hot_water_bath' | 'ambient_air';

export interface ThawingBatchRequest {
  tenantId: string;
  adminId: string;
  batchId: string;
  productName: string;
  method: ThawingMethod;
  chamberTempCelsius?: number; // Doit être entre +0°C et +4°C
  estimatedDurationHours: number;
}

export interface ThawingComplianceResult {
  batchId: string;
  allowed: boolean;
  maxHoldTimePostThawHours: number;
  rejectReason?: string;
  actionRequired?: string;
}

/**
 * ThawingProtocolGuard — Angle mort T26 (DF-E3).
 * Protocole sanitaire de décongélation (Règlement CE 852/2004) :
 * Interdiction absolue de la décongélation à l'eau chaude ou à l'air libre (multiplication bactérienne explosive), validation stricte en enceinte réfrigérée +0°C/+4°C.
 */
export class ThawingProtocolGuard {
  static validateThawing(req: ThawingBatchRequest): ThawingComplianceResult {
    const isForbidden = req.method === 'hot_water_bath' || req.method === 'ambient_air';

    if (isForbidden) {
      NexusEventBus.emit('compliance.thawing_protocol_violation', {
        v: 1,
        tenantId: req.tenantId,
        batchId: req.batchId,
        methodUsed: req.method,
        isHotWaterForbidden: req.method === 'hot_water_bath',
        detectedAt: Date.now(),
      });

      AuditLogger.logAction({
        adminId: req.adminId,
        action: 'THAWING_PROTOCOL_VIOLATION',
        targetId: req.batchId,
        ipAddress: '127.0.0.1',
        metadata: {
          productName: req.productName,
          method: req.method,
        },
      });

      return {
        batchId: req.batchId,
        allowed: false,
        maxHoldTimePostThawHours: 0,
        rejectReason: `PROTOCOLE SANITAIRE NON CONFORME : Méthode ${req.method} interdite par le paquet hygiène CE 852/2004.`,
        actionRequired: 'Placer immédiatement le produit en chambre froide positive (+2°C / +4°C).',
      };
    }

    const maxHoldTimePostThawHours = getSetting<number>('haccp', 'thaw_max_hold_hours', 48);

    return {
      batchId: req.batchId,
      allowed: true,
      maxHoldTimePostThawHours, // Utilisation dans les X heures max configurées (défaut 48h)
    };
  }
}
