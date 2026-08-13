import { IVerticalPlugin, ICoreContext } from '@/kernel/plugins/IVerticalPlugin';
import { garageDefaultTokens, garageVerticalTokens } from '@nexus/tokens/verticals/garage';
import React from 'react';
import { logger } from '@/lib/logger';
import {
  AutoOpsAdapter,
  AutoCommerceAdapter,
  AutoFinanceAdapter,
  AutoFacilityAdapter,
  AutoHumanAdapter,
  AutoIntelligenceAdapter,
  AutoLogisticsAdapter,
  AutoMccAdapter,
} from './adapters';

export class GarageVertical implements IVerticalPlugin {
  public readonly id = 'auto';
  public readonly name = 'Garage OS';
  public readonly version = '1.0.0';
  public readonly description = 'Diagnostic Intake, Workshop Scheduling, Parts Inventory, Warranty Claims';
  public readonly dependencies = ['finance', 'logistics', 'commerce'];
  public readonly defaultTheme = garageDefaultTokens;
  public readonly verticalTokens = garageVerticalTokens;

  public async initialize(context: ICoreContext): Promise<void> {
    logger.info(`[${this.id}] Initialisation verticale garage…`);

    // Routes
    context.registerRoute('/garage', React.lazy(() =>
      import('./ops/components/GarageDashboard').then(m => ({ default: m.GarageDashboard }))));
    context.registerRoute('/workshop', React.lazy(() =>
      import('./ops/workshop-scheduling').then(m => ({ default: m.WorkshopSchedulingPage }))));
    context.registerRoute('/parts', React.lazy(() =>
      import('./logistics/parts-inventory').then(m => ({ default: m.PartsInventoryPage }))));
    context.registerRoute('/warranty', React.lazy(() =>
      import('./finance/warranty-claims').then(m => ({ default: m.WarrantyClaimsPage }))));

    // Ops — véhicule réceptionné → assignation technicien
    context.registerEventHandler<{ tenantId: string; vehicleId: string; vin: string; customerId: string; mileage: number; checkedInAt: string }>(
      'auto.vehicle_checked_in',
      ({ tenantId, vehicleId, customerId, checkedInAt }) => {
        AutoHumanAdapter.emitTechnicianAssigned({
          tenantId,
          technicianId: 'auto',
          workOrderId: `wo-${vehicleId}-${Date.now()}`,
          estimatedHours: 2,
        });
        AutoCommerceAdapter.emitAppointmentBooked({
          tenantId,
          appointmentId: `appt-${vehicleId}`,
          customerId,
          vehicleId,
          serviceType: 'intake',
          slot: checkedInAt,
        });
      },
    );

    // Ops — diagnostic terminé → devis automatique
    context.registerEventHandler<{ tenantId: string; vehicleId: string; workOrderId: string; faults: { code: string; severity: 'low' | 'medium' | 'critical' }[] }>(
      'auto.diagnostic_completed',
      ({ tenantId, vehicleId, workOrderId, faults }) => {
        AutoOpsAdapter.emitRepairStarted({ tenantId, workOrderId, technicianId: 'auto', startedAt: new Date().toISOString() });
        const hasCritical = faults.some(f => f.severity === 'critical');
        if (hasCritical) {
          AutoMccAdapter.emitHealthPing({ tenantId, status: 'degraded', liftsOperational: 0, activeWorkOrders: 1 });
        }
      },
    );

    // Finance — facture émise → satisfaction client + audit fiscal si montant élevé
    context.registerEventHandler<{ tenantId: string; workOrderId: string; customerId: string; totalInMicrounits: number; laborInMicrounits: number; partsInMicrounits: number }>(
      'auto.invoice_issued',
      ({ tenantId, workOrderId, customerId, totalInMicrounits }) => {
        AutoIntelligenceAdapter.emitWorkshopMetricsSnapshot({
          tenantId,
          date: new Date().toISOString().slice(0, 10),
          workOrdersCompleted: 1,
          avgRepairTimeMinutes: 120,
          revenueInMicrounits: totalInMicrounits,
        });
        AutoCommerceAdapter.emitCustomerSatisfactionLogged({ tenantId, workOrderId, customerId, score: 0 });
        // Audit fiscal si facture > 5 000 € (seuil garage NF525 caisse)
        if (totalInMicrounits > 5_000 * 1_000_000) {
          AutoMccAdapter.emitFiscalAuditRequired({ tenantId, reason: `Facture atelier ${workOrderId} : ${(totalInMicrounits / 1_000_000).toFixed(2)} € — vérification NF525`, urgency: 'high' });
        }
      },
    );

    // Logistics — pièce consommée → réassort si stock bas
    context.registerEventHandler<{ tenantId: string; partId: string; workOrderId: string; quantity: number }>(
      'auto.part_consumed',
      ({ tenantId, partId, quantity }) => {
        AutoLogisticsAdapter.emitPartConsumed({ tenantId, partId, workOrderId: 'system', quantity });
        AutoLogisticsAdapter.emitPartReorderNeeded({ tenantId, partId, partNumber: partId, currentStock: 0, reorderQty: 10 });
      },
    );

    // Finance — garantie soumise
    context.registerEventHandler<{ tenantId: string; vehicleId: string; claimId: string; amountInMicrounits: number; manufacturerId: string }>(
      'auto.warranty_claim_submitted',
      ({ tenantId, vehicleId, claimId, amountInMicrounits, manufacturerId }) => {
        AutoFinanceAdapter.emitWarrantyClaimSubmitted({ tenantId, vehicleId, claimId, amountInMicrounits, manufacturerId });
      },
    );

    // Facility — lift en maintenance
    context.registerEventHandler<{ tenantId: string; liftId: string; issue: string; dueDate: string }>(
      'auto.lift_maintenance_required',
      ({ tenantId, liftId, issue, dueDate }) => {
        AutoFacilityAdapter.emitLiftMaintenanceRequired({ tenantId, liftId, issue, dueDate });
      },
    );

    // MCC — health ping
    context.registerEventHandler<{ tenantId: string }>(
      'tenant.ready',
      ({ tenantId }) => {
        AutoMccAdapter.emitHealthPing({ tenantId, status: 'healthy', liftsOperational: 0, activeWorkOrders: 0 });
      },
    );

    logger.info(`[${this.id}] Verticale garage active — ${context.getRegisteredRoutes().length} routes`);
  }

  public async destroy(): Promise<void> {
    logger.info(`[${this.id}] Arrêt de la verticale garage.`);
  }
}
