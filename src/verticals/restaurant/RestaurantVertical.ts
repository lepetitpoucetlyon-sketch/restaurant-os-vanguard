import { IVerticalPlugin, ICoreContext } from '@/shared/plugins/IVerticalPlugin';
import React from 'react';
import { logger } from '@/lib/logger';
import {
  RestaurantOpsAdapter,
  RestaurantCommerceAdapter,
  RestaurantComplianceAdapter,
  RestaurantFinanceAdapter,
  RestaurantHumanAdapter,
  RestaurantIntelligenceAdapter,
  RestaurantLogisticsAdapter,
  RestaurantMccAdapter,
} from './adapters';

export class RestaurantVertical implements IVerticalPlugin {
  public readonly id = 'restaurant';
  public readonly name = 'Restaurant OS';
  public readonly version = '1.0.0';
  public readonly description = 'NF525, Menu Engineering, Tip Pooling, Perishables, Table Service';
  public readonly dependencies = ['finance', 'compliance', 'logistics'];

  public async initialize(context: ICoreContext): Promise<void> {
    logger.info(`[${this.id}] Initialisation verticale restaurant…`);

    // Routes
    context.registerRoute('/menu-engineering', React.lazy(() =>
      import('./presentation/MenuEngineeringDashboard').then(m => ({ default: m.MenuEngineeringDashboard }))));
    context.registerRoute('/floor-plan', React.lazy(() =>
      import('@/modules/facility/spaces/floor-plan').then(m => ({ default: m.FloorPlanPage }))));
    context.registerRoute('/nf525', React.lazy(() =>
      import('@/modules/finance/comptabilite/fec').then(m => ({ default: m.FECExportPage }))));

    // Ops — commande → sceau fiscal + déduction stock
    context.registerEventHandler<{ tenantId: string; orderId: string; tableId?: string; totalInMicrounits: number }>(
      'ops.order_notification',
      ({ tenantId, orderId, totalInMicrounits }) => {
        RestaurantFinanceAdapter.emitOrderFiscalSeal({ tenantId, orderId, totalInMicrounits, operatorId: 'system' });
        RestaurantIntelligenceAdapter.emitSalesDataReady({
          tenantId,
          periodStart: new Date().toISOString(),
          periodEnd: new Date().toISOString(),
          totalInMicrounits,
          covers: 1,
        });
      },
    );

    // Table libérée → mise à jour plan de salle
    context.registerEventHandler<{ tenantId: string; tableId: string }>(
      'table.released',
      ({ tenantId, tableId }) => {
        RestaurantOpsAdapter.emitTableReleased({ tenantId, tableId });
      },
    );

    // Commerce — réservation confirmée → tâche cuisine
    context.registerEventHandler<{ tenantId: string; reservationId: string; customerName: string; covers: number; date: string; time: string }>(
      'reservation.confirmed',
      ({ tenantId, reservationId, customerName, covers, date, time }) => {
        RestaurantCommerceAdapter.emitReservationConfirmed({ tenantId, reservationId, customerName, covers, date, time });
      },
    );

    // No-show → CRM RFM trigger
    context.registerEventHandler<{ tenantId: string; reservationId: string; customerId?: string }>(
      'reservation.no_show',
      ({ tenantId, customerId }) => {
        if (customerId) RestaurantCommerceAdapter.emitCustomerRFMTrigger({ tenantId, customerId });
      },
    );

    // Finance — clôture Z
    context.registerEventHandler<{ tenantId: string; operatorId: string; requestedAt: string }>(
      'finance.z_report_requested',
      ({ tenantId, operatorId, requestedAt }) => {
        RestaurantFinanceAdapter.emitZReportRequested({ tenantId, operatorId, requestedAt });
      },
    );

    // Compliance — anomalie température → alerte MCC
    context.registerEventHandler<{ v: 1; tenantId: string; sensorId: string; temperature: number; durationInMinutes: number }>(
      'sensor.temperature_anomaly',
      ({ tenantId, sensorId, temperature, durationInMinutes }) => {
        RestaurantComplianceAdapter.emitTemperatureAnomaly({ tenantId, sensorId, temperature, durationInMinutes });
        if (durationInMinutes > 30) {
          RestaurantMccAdapter.emitFiscalAuditRequired({ tenantId, reason: `Anomalie température capteur ${sensorId}`, urgency: 'high' });
        }
      },
    );

    // Human — shift démarré
    context.registerEventHandler<{ v: 1; tenantId: string; shiftId: string; employeeId: string; role: string; startedAt: number }>(
      'hr.shift_started',
      ({ tenantId, shiftId, employeeId, role, startedAt }) => {
        RestaurantHumanAdapter.emitShiftStarted({ tenantId, shiftId, employeeId, role, startedAt });
      },
    );

    // Logistics — DLC proche → alerte
    context.registerEventHandler<{ v: 1; tenantId: string; itemId: string; quantity: number; batchNumber: string }>(
      'dlc.expired',
      ({ tenantId, itemId, quantity, batchNumber }) => {
        RestaurantLogisticsAdapter.emitDlcExpiry({ tenantId, itemId, quantity, batchNumber });
      },
    );

    // Intelligence — demande menu engineering
    context.registerEventHandler<{ tenantId: string; periodDays: number }>(
      'intelligence.menu_engineering_requested',
      ({ tenantId, periodDays }) => {
        RestaurantIntelligenceAdapter.emitMenuEngineeringRequest({ tenantId, periodDays });
      },
    );

    // MCC — health ping au démarrage
    context.registerEventHandler<{ tenantId: string }>(
      'tenant.ready',
      ({ tenantId }) => {
        RestaurantMccAdapter.emitHealthPing({ tenantId, status: 'healthy', posOnline: true, kdsOnline: true, printerOnline: true });
      },
    );

    logger.info(`[${this.id}] Verticale restaurant active — ${context.getRegisteredRoutes().length} routes, ${context.getRegisteredAtoms().length} atoms`);
  }

  public async destroy(): Promise<void> {
    logger.info(`[${this.id}] Arrêt de la verticale restaurant.`);
  }
}
