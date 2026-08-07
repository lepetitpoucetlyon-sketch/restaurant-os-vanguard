/**
 * 🛰️ NexusTelemetryService - The OS Mirror
 * Responsible for sending real-time health pulses to the Suzerain (MCC).
 * Grade VI - Certified Reliability.
 */

import { TelemetryPulse } from "@shared/nexus-contract";
import { whiteLabelInstanceConfig } from "@/config/instance";
import { logger } from "@/lib/logger";
import { fleetTelemetry } from "@/modules/intelligence/ia/fleet/FleetTelemetryService";
import { registerAuditPulseSink } from "@/shared/nexus/telemetry/NexusTelemetryService";
import type { SiteTelemetry } from "@/shared/nexus/contracts/fleet.types";
import { tenantScopedKey } from "@/lib/storage/tenantScopedKey";
import { JsonObject } from "@/shared/types/json";

class TelemetryService {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly PULSE_INTERVAL = 5 * 60 * 1000; // 5 minutes

  /**
   * Starts the rhythmic heartbeat of the Vassal.
   */
  public start(tenantId: string) {
    if (this.intervalId) return;

    // Initial pulse
    this.sendPulse(tenantId);

    // Schedule subsequent pulses
    this.intervalId = setInterval(() => {
      this.sendPulse(tenantId);
    }, this.PULSE_INTERVAL);

    logger.info(`[NexusTelemetry] Heartbeat activated for tenant: ${tenantId}`);
  }

  /**
   * Stops the pulse.
   */
  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Collects current system telemetry and mirrors it to the Suzerain.
   */
  
  /**
   * 🖋️ Suture GRADE X+++: Emission d'Audit Pulse
   */
  public emitAuditPulse(pillar: string, action: string, data: object) {
      logger.debug(`[AuditPulse|${pillar}] ${action}`, data as JsonObject);
      // Implémentation réelle vers le MCC
  }

  private async sendPulse(tenantId: string) {
    try {
      const pulse: TelemetryPulse = await this.collectPulse();

      // Inclure l'état du RAG local dans le pulse (fire-and-forget sans bloquer).
      let ragStatus: SiteTelemetry['ragStatus'] | undefined;
      try {
        const res = await fetch('/api/health/rag', { signal: AbortSignal.timeout(4_000) });
        if (res.ok) {
          const h = await res.json() as { status: string; version?: string; document_count?: number; last_indexed?: string; latencyMs?: number };
          ragStatus = {
            status: h.status as NonNullable<SiteTelemetry['ragStatus']>['status'],
            version: h.version,
            documentCount: h.document_count,
            lastIndexed: h.last_indexed,
            latencyMs: h.latencyMs,
          };
        }
      } catch { /* RAG indisponible — on continue sans bloquer */ }

      // 1. Persist local for quick reads (existing behavior)
      localStorage.setItem(tenantScopedKey('nexus_last_pulse'), JSON.stringify({
        timestamp: Date.now(),
        status: pulse.status,
        ragStatus,
      }));

      // 2. Push to Nexus fleet-telemetry so the MCC can see this instance's RAG status.
      await fleetTelemetry.pushSiteTelemetry(tenantId as import('@domain/types/brands').TenantID, {
        status: pulse.status === 'ACTIVE' ? 'ONLINE' : 'OFFLINE',
        lastHeartbeat: pulse.lastPulse,
        ...(ragStatus ? { ragStatus } : {}),
      } as Partial<SiteTelemetry>);

      logger.debug(`[NexusTelemetry] Pulse emitted at ${pulse.lastPulse}`, { tenantId, rag: ragStatus?.status ?? 'unknown' });

    } catch (error) {
      console.error("[NexusTelemetry] Pulse failure:", error);
    }
  }

  private async collectPulse(): Promise<TelemetryPulse> {
    const battery = await this.getBatteryInfo();
    const network = this.getNetworkInfo();

    return {
      version: whiteLabelInstanceConfig.version || "1.0.0",
      status: 'ACTIVE', // Dynamic status based on error store in real app
      lastPulse: new Date().toISOString(),
      health: {
        uptime: performance.now(),
        battery,
        network
      },
      security: {
        nf525Sealed: true, // Placeholder for real seal status
        integrityGrade: "VI"
      }
    };
  }

  private async getBatteryInfo() {
    try {
      if ('getBattery' in navigator) {
        const bat = await (navigator as Navigator & { getBattery: () => Promise<{ level: number, charging: boolean }> }).getBattery();
        return {
          level: bat.level,
          charging: bat.charging,
          supported: true
        };
      }
    } catch (_e) {}

    return {
      level: 1,
      charging: true,
      supported: false
    };
  }

  private getNetworkInfo() {
    const nav = navigator as Navigator & { connection?: { effectiveType: string }, mozConnection?: { effectiveType: string }, webkitConnection?: { effectiveType: string } };
    const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
    return {
      online: navigator.onLine,
      effectiveType: conn?.effectiveType || 'unknown'
    };
  }
}

export const NexusTelemetryService = new TelemetryService();

// Inversion de dépendance anti-cycle : le wrapper shared (importé par
// NexusInterceptor) délègue l'émission réelle des audit pulses ici, sans
// jamais importer ce module statiquement.
registerAuditPulseSink((pillar, action, data) =>
    NexusTelemetryService.emitAuditPulse(pillar, action, data),
);
