import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { logger } from '@/lib/logger';

export interface StationHeartbeat {
  stationId: string;
  lastPingTimestamp: number;
  unacknowledgedOrderIds: string[];
}

export interface RecoveryActionPlan {
  stationId: string;
  isRecovered: boolean;
  replayedOrderIds: string[];
  replayedCount: number;
  recoveredAt: number;
}

/**
 * KDSStationRecoveryService — Angle mort B2.
 * Gère le heartbeat des postes KDS et le rejeu automatique sans perte des commandes en attente après un plantage ou déconnexion réseau d'un écran de cuisine.
 */
export class KDSStationRecoveryService {
  public static readonly MAX_OFFLINE_THRESHOLD_MS = 60_000; // 1 min sans heartbeat = offline

  static recoverStation(
    tenantId: string,
    station: StationHeartbeat,
    incomingBufferedOrders: string[]
  ): RecoveryActionPlan {
    const isStationBack = Date.now() - station.lastPingTimestamp < this.MAX_OFFLINE_THRESHOLD_MS;
    const ordersToReplay = Array.from(new Set([...station.unacknowledgedOrderIds, ...incomingBufferedOrders]));

    if (isStationBack && ordersToReplay.length > 0) {
      logger.info(`[KDS-RECOVERY] Replaying ${ordersToReplay.length} missed orders to station ${station.stationId}`);

      NexusEventBus.emit('kds.station_recovered', {
        v: 1,
        tenantId,
        stationId: station.stationId,
        missedOrdersReplayedCount: ordersToReplay.length,
        recoveredAt: Date.now(),
      });

      return {
        stationId: station.stationId,
        isRecovered: true,
        replayedOrderIds: ordersToReplay,
        replayedCount: ordersToReplay.length,
        recoveredAt: Date.now(),
      };
    }

    return {
      stationId: station.stationId,
      isRecovered: isStationBack,
      replayedOrderIds: [],
      replayedCount: 0,
      recoveredAt: Date.now(),
    };
  }
}
