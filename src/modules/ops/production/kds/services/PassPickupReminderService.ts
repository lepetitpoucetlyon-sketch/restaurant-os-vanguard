import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export interface PassOrderState {
  orderId: string;
  tableNumber: string;
  serverName: string;
  readyAtTimestamp: number;
  maxHoldMinutes?: number; // Défaut: 3 minutes
}

export interface PassPickupStatus {
  orderId: string;
  tableNumber: string;
  elapsedSeconds: number;
  isDelayed: boolean;
  alertLevel: 'none' | 'warning' | 'critical';
  buzzerAudioTone?: string;
}

/**
 * PassPickupReminderService — Angle mort B5.
 * Surveille le passe-plat et émet des alertes sonores/visuelles si un plat chaud n'est pas récupéré par le serveur dans les 3 minutes.
 */
export class PassPickupReminderService {
  static evaluatePassStatus(tenantId: string, order: PassOrderState): PassPickupStatus {
    const maxHoldSeconds = (order.maxHoldMinutes ?? 3) * 60;
    const elapsedSeconds = Math.floor((Date.now() - order.readyAtTimestamp) / 1000);

    let isDelayed = false;
    let alertLevel: 'none' | 'warning' | 'critical' = 'none';
    let buzzerAudioTone: string | undefined;

    if (elapsedSeconds >= maxHoldSeconds * 2) {
      isDelayed = true;
      alertLevel = 'critical';
      buzzerAudioTone = 'PASS_CRITICAL_ALARM_1000HZ';
    } else if (elapsedSeconds >= maxHoldSeconds) {
      isDelayed = true;
      alertLevel = 'warning';
      buzzerAudioTone = 'PASS_CHIME_WARNING';
    }

    if (isDelayed) {
      NexusEventBus.emit('kds.pass_pickup_delayed', {
        v: 1,
        tenantId,
        orderId: order.orderId,
        tableNumber: order.tableNumber,
        delayedMinutes: Math.floor(elapsedSeconds / 60),
        alertedAt: Date.now(),
      });
    }

    return {
      orderId: order.orderId,
      tableNumber: order.tableNumber,
      elapsedSeconds,
      isDelayed,
      alertLevel,
      buzzerAudioTone,
    };
  }
}
