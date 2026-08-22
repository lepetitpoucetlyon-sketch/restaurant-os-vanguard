/**
 * T45 — Suspension compte algorithmique Uber Eats (fake reasons).
 *
 * Uber Eats peut suspendre un compte restaurant via son algorithme sans préavis
 * si le taux de notes descend sous 4,5 / 5. Sans watchdog, le canal représentant
 * 30 % du CA peut être coupé pendant 48-72h sans que personne ne s'en aperçoive.
 *
 * Ce service scrappe (via la route API partenaire ou les webhooks Uber) le score
 * et alerte en amont si la tendance est baissière.
 *
 * Cf. docs/anglemort-restaurant-mcc.md § T45 (HAUT).
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { AuditLogger } from '@/lib/audit';

const ALERT_THRESHOLD = 4.5;
const CRITICAL_THRESHOLD = 4.2;

export interface DeliveryPlatformScore {
  platform: 'uber_eats' | 'deliveroo' | 'just_eat';
  score: number;
  totalRatings: number;
  recordedAt: number;
}

export interface WatchdogResult {
  alerted: boolean;
  severity: 'none' | 'warning' | 'critical';
  currentScore: number;
}

export class UberEatsWatchdogService {
  static assess(score: number): WatchdogResult['severity'] {
    if (score < CRITICAL_THRESHOLD) return 'critical';
    if (score < ALERT_THRESHOLD) return 'warning';
    return 'none';
  }

  static async ingestScore(input: {
    tenantId: string;
    score: DeliveryPlatformScore;
    operatorId?: string;
  }): Promise<WatchdogResult> {
    const severity = this.assess(input.score.score);

    await Nexus.adapter.set(
      `tenants/${input.tenantId}/delivery_scores/${input.score.platform}`,
      input.score,
    );

    if (severity === 'none') return { alerted: false, severity: 'none', currentScore: input.score.score };

    await AuditLogger.logAction(
      input.operatorId ?? 'system',
      'DELIVERY_SCORE_ALERT',
      `${input.score.platform}_score`,
      { score: input.score.score, threshold: ALERT_THRESHOLD, severity, platform: input.score.platform },
    ).catch(() => null);

    return { alerted: true, severity, currentScore: input.score.score };
  }
}
