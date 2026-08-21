/**
 * T08 — Dine & Dash (départ sans payer).
 *
 * Le "Dine & Dash" est un vol qualifié (art. 311-1 Code Pénal) mais sans
 * preuve (CCTV + trace POS), le restaurateur ne peut pas porter plainte
 * efficacement. Ce service :
 *  1. Détecte les tables avec commande ouverte depuis > MAX_OPEN_MINUTES
 *     sans paiement (signal "départ suspicieux")
 *  2. Alerte le serveur en temps réel
 *  3. Enregistre un incident avec timestamp et référence légale
 *
 * Cf. docs/anglemort-restaurant-mcc.md § T08.
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/modules/compliance/securite/AuditLogger';

const MAX_OPEN_MINUTES = 120;

export interface OpenOrderState {
  orderId: string;
  tableId: string;
  openedAt: number;
  totalInMicrounits: number;
  couverts: number;
}

export interface DineAndDashAlert {
  incidentId: string;
  tenantId: string;
  orderId: string;
  tableId: string;
  openSinceMinutes: number;
  estimatedLossInMicrounits: number;
  detectedAt: number;
  legalRef: 'Art. 311-1 Code Penal';
}

export class DineAndDashDetectorService {
  static isSuspicious(openedAt: number, now: number): boolean {
    return (now - openedAt) / 60_000 > MAX_OPEN_MINUTES;
  }

  static async scanOpenOrders(input: {
    tenantId: string;
    operatorId: string;
    now?: number;
  }): Promise<DineAndDashAlert[]> {
    const now = input.now ?? Date.now();
    const openOrders = await Nexus.adapter.query<OpenOrderState>(
      `tenants/${input.tenantId}/pos_orders`,
    );

    const suspects = openOrders.filter(o => this.isSuspicious(o.openedAt, now));
    const alerts: DineAndDashAlert[] = [];

    for (const order of suspects) {
      const openSinceMinutes = Math.floor((now - order.openedAt) / 60_000);
      const incidentId = `dnd_${order.orderId}_${now}`;

      const alert: DineAndDashAlert = {
        incidentId,
        tenantId: input.tenantId,
        orderId: order.orderId,
        tableId: order.tableId,
        openSinceMinutes,
        estimatedLossInMicrounits: order.totalInMicrounits,
        detectedAt: now,
        legalRef: 'Art. 311-1 Code Penal',
      };

      await Nexus.adapter.set(
        `tenants/${input.tenantId}/dine_and_dash_incidents/${incidentId}`,
        alert,
      );

      await NexusEventBus.emit('ops.dine_and_dash_suspected', {
        v: 1,
        tenantId: input.tenantId,
        orderId: order.orderId,
        tableId: order.tableId,
        openSinceMinutes,
        estimatedLossInMicrounits: order.totalInMicrounits,
        detectedAt: now,
      }).catch(() => null);

      await AuditLogger.logAction(
        input.operatorId,
        'CUSTOMER_MASS_EXPORT',
        order.orderId,
        { type: 'dine_and_dash_suspected', openSinceMinutes, tableId: order.tableId },
      ).catch(() => null);

      alerts.push(alert);
    }

    return alerts;
  }
}
