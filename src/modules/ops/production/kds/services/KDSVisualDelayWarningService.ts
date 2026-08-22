import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export interface VisualDelayCheckRequest {
  tenantId: string;
  orderId: string;
  tableNumber: string;
  sentToKitchenTimestamp: number;
}

export interface VisualDelayStatus {
  elapsedMinutes: number;
  alertLevel: 'normal' | 'warning_11m' | 'critical_13m';
  colorBadgeHex: string;
  amuseBoucheTriggered: boolean;
  message: string;
}

/**
 * KDSVisualDelayWarningService — Angle mort L13.
 * Compteur psycho-visuel "Minute 14" : Clignotant orange à 11 min, rouge à 13 min et déclencheur automatique d'amuse-bouche en salle pour préserver l'expérience client.
 */
export class KDSVisualDelayWarningService {
  static evaluateDelay(req: VisualDelayCheckRequest): VisualDelayStatus {
    const elapsedMinutes = Math.floor((Date.now() - req.sentToKitchenTimestamp) / (60 * 1000));

    if (elapsedMinutes >= 13) {
      NexusEventBus.emit('kds.visual_delay_warning', {
        v: 1,
        tenantId: req.tenantId,
        orderId: req.orderId,
        tableNumber: req.tableNumber,
        elapsedMinutes,
        alertLevel: 'critical_13m',
        amuseBoucheTriggered: true,
        alertedAt: Date.now(),
      });

      return {
        elapsedMinutes,
        alertLevel: 'critical_13m',
        colorBadgeHex: '#EF4444', // Red
        amuseBoucheTriggered: true,
        message: '🚨 13 MIN DE DÉLAI : Offrir immédiatement un amuse-bouche / coupe d\'attente table ' + req.tableNumber,
      };
    }

    if (elapsedMinutes >= 11) {
      NexusEventBus.emit('kds.visual_delay_warning', {
        v: 1,
        tenantId: req.tenantId,
        orderId: req.orderId,
        tableNumber: req.tableNumber,
        elapsedMinutes,
        alertLevel: 'warning_11m',
        amuseBoucheTriggered: false,
        alertedAt: Date.now(),
      });

      return {
        elapsedMinutes,
        alertLevel: 'warning_11m',
        colorBadgeHex: '#F59E0B', // Amber
        amuseBoucheTriggered: false,
        message: '⚠️ 11 min : Finition et dressage urgents requis pour table ' + req.tableNumber,
      };
    }

    return {
      elapsedMinutes,
      alertLevel: 'normal',
      colorBadgeHex: '#10B981', // Green
      amuseBoucheTriggered: false,
      message: 'Délais de service nominaux.',
    };
  }
}
