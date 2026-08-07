import { IVerticalPlugin, ICoreContext } from '@/shared/plugins/IVerticalPlugin';
import { salonDefaultTokens, salonVerticalTokens } from '@/shared/nexus/tokens/verticals/salon';
import React from 'react';
import { logger } from '@/lib/logger';
import {
  SalonOpsAdapter,
  SalonCommerceAdapter,
  SalonFinanceAdapter,
  SalonHumanAdapter,
  SalonIntelligenceAdapter,
  SalonLogisticsAdapter,
  SalonMccAdapter,
} from './adapters';

export class SalonVertical implements IVerticalPlugin {
  public readonly id = 'salon';
  public readonly name = 'Salon OS';
  public readonly version = '1.0.0';
  public readonly description = 'Agenda stylistes, produits cabine, fidélité, caisse NF525';
  public readonly dependencies = ['finance', 'commerce', 'human', 'logistics'];
  public readonly defaultTheme = salonDefaultTokens;
  public readonly verticalTokens = salonVerticalTokens;

  public async initialize(context: ICoreContext): Promise<void> {
    logger.info(`[${this.id}] Initialisation verticale salon…`);

    // Routes
    context.registerRoute('/agenda', React.lazy(() =>
      import('./commerce/AppointmentCalendar').then(m => ({ default: m.AppointmentCalendar }))));
    context.registerRoute('/stylists', React.lazy(() =>
      import('./human/StylistDashboard').then(m => ({ default: m.StylistDashboard }))));
    context.registerRoute('/cabin-stock', React.lazy(() =>
      import('./logistics/CabinStockPage').then(m => ({ default: m.CabinStockPage }))));

    // Commerce — RDV réservé → assignation styliste
    context.registerEventHandler<{ tenantId: string; appointmentId: string; customerId: string; stylistId: string; service: string; slot: string }>(
      'salon.appointment_booked',
      ({ tenantId, stylistId, appointmentId }) => {
        SalonHumanAdapter.emitStylistAssigned({ tenantId, stylistId, appointmentId });
      },
    );

    // Ops — RDV terminé → sceau fiscal + points fidélité + métriques
    context.registerEventHandler<{ tenantId: string; appointmentId: string; customerId: string; stylistId: string; durationMinutes: number; totalInMicrounits: number }>(
      'salon.appointment_completed',
      ({ tenantId, appointmentId, customerId, durationMinutes, totalInMicrounits }) => {
        SalonFinanceAdapter.emitServiceSealed({ tenantId, orderId: appointmentId, totalInMicrounits, operatorId: 'system' });
        SalonCommerceAdapter.emitLoyaltyEarned({ tenantId, customerId, points: Math.floor(totalInMicrounits / 1_000_000), sourceAppointmentId: appointmentId });
        SalonIntelligenceAdapter.emitChairMetricsSnapshot({ tenantId, date: new Date().toISOString().slice(0, 10), totalAppointments: 1, utilization: durationMinutes / 480, revenueInMicrounits: totalInMicrounits });
      },
    );

    // Commerce — no-show → CRM RFM trigger
    context.registerEventHandler<{ tenantId: string; appointmentId: string; customerId: string; stylistId: string }>(
      'salon.no_show',
      ({ tenantId, customerId }) => {
        SalonCommerceAdapter.emitRFMTrigger({ tenantId, customerId });
        SalonOpsAdapter.emitNoShow({ tenantId, appointmentId: 'unknown', customerId, stylistId: 'unknown' });
      },
    );

    // Logistics — produit consommé → alerte stock bas
    context.registerEventHandler<{ tenantId: string; productId: string; quantity: number; appointmentId: string }>(
      'salon.product_consumed',
      ({ tenantId, productId, quantity, appointmentId }) => {
        SalonLogisticsAdapter.emitProductConsumed({ tenantId, productId, quantity, appointmentId });
        SalonLogisticsAdapter.emitStockAlert({ tenantId, productId, currentStock: 0, threshold: 5 });
      },
    );

    // Human — shift
    context.registerEventHandler<{ v: 1; tenantId: string; shiftId: string; employeeId: string; role: string; startedAt: number }>(
      'hr.shift_started',
      ({ tenantId, shiftId, employeeId, role, startedAt }) => {
        SalonHumanAdapter.emitShiftStarted({ tenantId, shiftId, employeeId, role, startedAt });
      },
    );

    // Finance — bilan Z + audit fiscal (caisse salon = NF525)
    context.registerEventHandler<{ tenantId: string; operatorId: string; requestedAt: string }>(
      'finance.z_report_requested',
      (payload) => {
        SalonFinanceAdapter.emitZReportRequested(payload);
        SalonMccAdapter.emitFiscalAuditRequired({ tenantId: payload.tenantId, reason: `Clôture Z salon demandée par ${payload.operatorId}`, urgency: 'low' });
      },
    );

    // MCC — health ping
    context.registerEventHandler<{ tenantId: string }>(
      'tenant.ready',
      ({ tenantId }) => {
        SalonMccAdapter.emitHealthPing({ tenantId, status: 'healthy', chairsActive: 0, appointmentsToday: 0 });
      },
    );

    logger.info(`[${this.id}] Verticale salon active — ${context.getRegisteredRoutes().length} routes`);
  }

  public async destroy(): Promise<void> {
    logger.info(`[${this.id}] Arrêt de la verticale salon.`);
  }
}
