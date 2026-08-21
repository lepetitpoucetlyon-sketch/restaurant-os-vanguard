/**
 * L79 — Jauge spatiale terrasse AOT (Autorisation d'Occupation Temporaire).
 *
 * L'AOT délivrée par la mairie fixe le nombre maximum de m² et de couverts
 * autorisés en terrasse. Dépasser ce plafond expose le restaurateur à :
 *  - Retrait de l'AOT + amende 1 500 €/infraction
 *  - Responsabilité en cas d'accident (débordement sur trottoir)
 *
 * Ce service vérifie avant chaque placement en terrasse que la capacité AOT
 * n'est pas dépassée.
 *
 * Cf. docs/anglemort-restaurant-mcc.md § L79 (HAUT).
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/modules/compliance/securite/AuditLogger';

export interface AOTConfig {
  maxSeats: number;
  maxSquareMeters?: number;
  permitNumber: string;
  validUntil: string;
}

export interface AOTCheckResult {
  allowed: boolean;
  currentCapacity: number;
  maxQuota: number;
  excessSeats?: number;
}

export class AOTTerraceQuotaService {
  private static aotPath(tenantId: string): string {
    return `tenants/${tenantId}/settings/aot_terrace`;
  }

  private static capacityPath(tenantId: string): string {
    return `tenants/${tenantId}/terrace_capacity/current`;
  }

  static async getConfig(tenantId: string): Promise<AOTConfig | null> {
    return Nexus.adapter.get<AOTConfig>(this.aotPath(tenantId));
  }

  static async setConfig(tenantId: string, config: AOTConfig): Promise<void> {
    await Nexus.adapter.set(this.aotPath(tenantId), config);
  }

  static async checkBeforePlacement(input: {
    tenantId: string;
    seatsToAdd: number;
    operatorId: string;
    now?: number;
  }): Promise<AOTCheckResult> {
    const now = input.now ?? Date.now();
    const [config, current] = await Promise.all([
      this.getConfig(input.tenantId),
      Nexus.adapter.get<{ seats: number }>(this.capacityPath(input.tenantId)),
    ]);

    if (!config) return { allowed: true, currentCapacity: 0, maxQuota: Infinity };

    const currentCapacity = current?.seats ?? 0;
    const projected = currentCapacity + input.seatsToAdd;

    if (projected > config.maxSeats) {
      const excessSeats = projected - config.maxSeats;

      await NexusEventBus.emit('commerce.aot_terrace_quota_exceeded', {
        v: 1,
        tenantId: input.tenantId,
        currentCapacity: projected,
        maxQuota: config.maxSeats,
        excessSeats,
        detectedAt: now,
      });

      await AuditLogger.logAction(
        input.operatorId,
        'AOT_QUOTA_EXCEEDED',
        'aot_terrace',
        { projected, maxSeats: config.maxSeats, permitNumber: config.permitNumber },
      ).catch(() => null);

      return { allowed: false, currentCapacity: projected, maxQuota: config.maxSeats, excessSeats };
    }

    await Nexus.adapter.set(this.capacityPath(input.tenantId), { seats: projected, updatedAt: now });
    return { allowed: true, currentCapacity: projected, maxQuota: config.maxSeats };
  }

  static async releaseSeats(tenantId: string, seatsReleased: number, now?: number): Promise<void> {
    const ts = now ?? Date.now();
    const current = await Nexus.adapter.get<{ seats: number }>(this.capacityPath(tenantId));
    const seats = Math.max(0, (current?.seats ?? 0) - seatsReleased);
    await Nexus.adapter.set(this.capacityPath(tenantId), { seats, updatedAt: ts });
  }
}
