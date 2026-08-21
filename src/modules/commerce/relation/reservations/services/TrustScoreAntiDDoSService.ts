/**
 * L74 — TrustScore anti-DDoS réservation.
 *
 * Scénario de sabotage concurrentiel : 5 SIM prépayées annulent 6 tables
 * à 19h58, rendant le restaurant "complet" fictif. Aucun mécanisme de détection
 * de cluster IP ou d'empreinte CB variable.
 *
 * Ce service maintient un scoring de confiance par (ipAddress, phoneHash) :
 * si le nombre d'annulations dépasse le seuil dans la fenêtre, la réservation
 * est flaggée et nécessite une validation manuelle.
 *
 * Cf. docs/anglemort-restaurant-mcc.md § L74 (HAUT).
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/modules/compliance/securite/AuditLogger';

const CANCEL_THRESHOLD = 3;
const WINDOW_HOURS = 2;

export interface TrustCheckInput {
  tenantId: string;
  ipAddress: string;
  phoneHash: string;
  action: 'reservation_cancel' | 'reservation_create';
  now?: number;
}

export interface TrustResult {
  flagged: boolean;
  cancelCount: number;
  requiresManualReview?: boolean;
}

export class TrustScoreAntiDDoSService {
  private static path(tenantId: string, key: string): string {
    return `tenants/${tenantId}/trust_counters/${key}`;
  }

  static async evaluate(input: TrustCheckInput): Promise<TrustResult> {
    const now = input.now ?? Date.now();
    const windowMs = WINDOW_HOURS * 3600_000;

    const ipKey = `ip_${input.ipAddress.replace(/[.:]/g, '_')}`;
    const phoneKey = `ph_${input.phoneHash}`;

    const [ipRecord, phoneRecord] = await Promise.all([
      Nexus.adapter.get<{ count: number; windowStart: number }>(this.path(input.tenantId, ipKey)),
      Nexus.adapter.get<{ count: number; windowStart: number }>(this.path(input.tenantId, phoneKey)),
    ]);

    const getCount = (rec: { count: number; windowStart: number } | null): number => {
      if (!rec) return 0;
      return now - rec.windowStart < windowMs ? rec.count : 0;
    };

    let ipCount = getCount(ipRecord);
    let phoneCount = getCount(phoneRecord);

    if (input.action === 'reservation_cancel') {
      ipCount++;
      phoneCount++;
      const ws = now;
      await Promise.all([
        Nexus.adapter.set(this.path(input.tenantId, ipKey), { count: ipCount, windowStart: ipRecord?.windowStart ?? ws }),
        Nexus.adapter.set(this.path(input.tenantId, phoneKey), { count: phoneCount, windowStart: phoneRecord?.windowStart ?? ws }),
      ]);
    }

    const maxCount = Math.max(ipCount, phoneCount);
    const flagged = maxCount >= CANCEL_THRESHOLD;

    if (flagged) {
      await NexusEventBus.emit('commerce.reservation_trust_flagged', {
        v: 1,
        tenantId: input.tenantId,
        ipAddress: input.ipAddress,
        phoneHash: input.phoneHash,
        cancelCount: maxCount,
        windowHours: WINDOW_HOURS,
        flaggedAt: now,
      });
      await AuditLogger.logAction(
        'system',
        'TRUST_SCORE_FLAGGED',
        `ip:${input.ipAddress}`,
        { ipCount, phoneCount, threshold: CANCEL_THRESHOLD },
      ).catch(() => null);
    }

    return { flagged, cancelCount: maxCount, requiresManualReview: flagged };
  }
}
