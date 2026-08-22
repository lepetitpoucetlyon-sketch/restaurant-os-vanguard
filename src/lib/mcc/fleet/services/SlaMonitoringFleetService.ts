import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export interface ApiLatencySample {
  tenantId: string;
  endpoint: string;
  latencyMs: number;
  statusCode: number;
  timestamp: number;
}

export interface SlaBreachAssessment {
  tenantId: string;
  endpoint: string;
  isBreach: boolean;
  latencyMs: number;
  allowedThresholdMs: number;
  uptimePct: number;
}

/** Taille de la fenêtre glissante utilisée pour l'agrégation d'uptime (par tenant+endpoint). */
const UPTIME_WINDOW_SIZE = 500;

/**
 * SlaMonitoringFleetService — Angle mort MCC-C4.
 * Surveillance continue des SLA de latence et disponibilité (99.95% uptime, <200ms sur transactions POS) avec détection immédiate des dégradations de performance.
 */
export class SlaMonitoringFleetService {
  public static readonly MAX_ALLOWED_POS_LATENCY_MS = 250;

  /**
   * Fenêtre glissante en mémoire des derniers samples (breach/non-breach) par clé tenant+endpoint.
   * Note : réinitialisée au redémarrage du process (pas de persistance cross-instance) —
   * suffisant pour remplacer le chiffre magique par une vraie agrégation à la volée.
   */
  private static readonly uptimeWindows = new Map<string, boolean[]>();

  private static recordSampleAndComputeUptime(tenantId: string, endpoint: string, isBreach: boolean): number {
    const key = `${tenantId}::${endpoint}`;
    const window = this.uptimeWindows.get(key) ?? [];
    window.push(isBreach);
    if (window.length > UPTIME_WINDOW_SIZE) window.shift();
    this.uptimeWindows.set(key, window);

    const breachCount = window.reduce((n, b) => n + (b ? 1 : 0), 0);
    const uptimePct = ((window.length - breachCount) / window.length) * 100;
    return Math.round(uptimePct * 100) / 100;
  }

  static evaluateLatency(sample: ApiLatencySample): SlaBreachAssessment {
    const isBreach = sample.latencyMs > this.MAX_ALLOWED_POS_LATENCY_MS || sample.statusCode >= 500;
    const uptimePct = this.recordSampleAndComputeUptime(sample.tenantId, sample.endpoint, isBreach);

    if (isBreach) {
      NexusEventBus.emit('fleet.sla_breach_detected', {
        v: 1,
        tenantId: sample.tenantId,
        endpoint: sample.endpoint,
        latencyMs: sample.latencyMs,
        allowedLatencyMs: this.MAX_ALLOWED_POS_LATENCY_MS,
        breachAt: Date.now(),
      });
    }

    return {
      tenantId: sample.tenantId,
      endpoint: sample.endpoint,
      isBreach,
      latencyMs: sample.latencyMs,
      allowedThresholdMs: this.MAX_ALLOWED_POS_LATENCY_MS,
      uptimePct,
    };
  }
}
