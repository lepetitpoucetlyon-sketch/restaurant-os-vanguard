import { IVerticalPlugin, ICoreContext } from '@/shared/plugins/IVerticalPlugin';
import { restaurantDefaultTokens, restaurantVerticalTokens } from '@/shared/nexus/tokens/verticals/restaurant';
import React from 'react';
import { logger } from '@/lib/logger';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { menuEngineeringService } from '@/modules/commerce/catalog/menu-engineering/application/services/MenuEngineeringService';
import { TenantRBACConfigSchema } from '@/domain/schemas/rbac';
import {
  RestaurantComplianceAdapter,
  RestaurantFinanceAdapter,
  RestaurantFacilityAdapter,
  RestaurantIntelligenceAdapter,
  RestaurantLogisticsAdapter,
  RestaurantMccAdapter,
} from './adapters';
import { toError } from "@/lib/toError";

export class RestaurantVertical implements IVerticalPlugin {
  public readonly id = 'restaurant';
  public readonly name = 'Restaurant OS';
  public readonly version = '1.0.0';
  public readonly description = 'NF525, Menu Engineering, Tip Pooling, Perishables, Table Service';
  public readonly dependencies = ['finance', 'compliance', 'logistics'];
  public readonly defaultTheme = restaurantDefaultTokens;
  public readonly verticalTokens = restaurantVerticalTokens;

  public readonly routes = [
    {
      path: '/menu-engineering',
      label: 'Ingénierie Menus',
      icon: 'ChartPie',
      roles: ['super_admin', 'directeur', 'manager'],
      componentLoader: () =>
        import('./presentation/MenuEngineeringDashboard').then(m => ({ default: m.MenuEngineeringDashboard })),
    },
    {
      path: '/floor-plan',
      label: 'Plan de Salle',
      icon: 'Layout',
      roles: ['super_admin', 'directeur', 'manager', 'chef_rang', 'serveur', 'hotesse'],
      componentLoader: () =>
        import('@/modules/facility/spaces/floor-plan').then(m => ({ default: m.FloorPlanPage })),
    },
    {
      path: '/nf525',
      label: 'Export FEC / NF525',
      icon: 'FileText',
      roles: ['super_admin', 'directeur', 'comptable'],
      componentLoader: () =>
        import('@/modules/finance/comptabilite/fec').then(m => ({ default: m.FECExportPage })),
    },
  ];

  public async initialize(context: ICoreContext): Promise<void> {
    logger.info(`[${this.id}] Initialisation verticale restaurant…`);

    // RBAC — config par défaut (overrides vides, les valeurs réelles sont chargées depuis Nexus par fetchRbacConfigAtom)
    context.registerRbacConfig(TenantRBACConfigSchema.parse({}));

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

    // Table libérée → notifier plan de salle via facility (event différent — évite la boucle table.released → table.released)
    context.registerEventHandler<{ tenantId: string; tableId: string }>(
      'table.released',
      ({ tenantId, tableId }) => {
        RestaurantFacilityAdapter.emitTableLayoutChanged({
          tenantId,
          floorId: 'main',
          tables: [{ id: tableId, capacity: 0, x: 0, y: 0 }],
        });
      },
    );

    // Commerce — réservation confirmée → notif cuisine (event différent — évite la boucle reservation.confirmed → reservation.confirmed)
    context.registerEventHandler<{ tenantId: string; reservationId: string; customerName: string; covers: number; date: string; time: string }>(
      'reservation.confirmed',
      ({ tenantId, reservationId, customerName, covers, date, time }) => {
        NexusEventBus.emit('notification.created', {
          v: 1,
          tenantId,
          id: crypto.randomUUID(),
          type: 'info',
          title: 'Réservation confirmée',
          message: `${customerName} — ${covers} couverts le ${date} à ${time} (résa #${reservationId})`,
          priority: 'medium',
          read: false,
          timestamp: new Date().toISOString(),
        });
      },
    );

    // No-show → CRM RFM trigger
    context.registerEventHandler<{ tenantId: string; reservationId: string; customerId?: string }>(
      'reservation.no_show',
      ({ tenantId, customerId }) => {
        if (customerId) {
          NexusEventBus.emit('crm.rfm_trigger', { tenantId, customerId });
        }
      },
    );

    // Finance — clôture Z : TicketZHandler (registerFinanceNf525Handlers) gère déjà finance.z_report_requested
    // Ne pas ré-émettre le même event depuis la vertical (boucle supprimée)

    // Compliance — anomalie température → alerte HACCP (event différent)
    context.registerEventHandler<{ v: 1; tenantId: string; sensorId: string; temperature: number; durationInMinutes: number }>(
      'sensor.temperature_anomaly',
      ({ tenantId, sensorId, temperature, durationInMinutes }) => {
        NexusEventBus.emit('haccp.alert', {
          v: 1,
          tenantId,
          sensorId,
          readingId: crypto.randomUUID(),
          alertType: 'temperature',
          severity: durationInMinutes > 30 ? 'CRITICAL' : 'HIGH',
          message: `Température anormale ${temperature}°C sur capteur ${sensorId} depuis ${durationInMinutes} min`,
        });
        if (durationInMinutes > 30) {
          RestaurantMccAdapter.emitFiscalAuditRequired({ tenantId, reason: `Anomalie température capteur ${sensorId}`, urgency: 'high' });
        }
      },
    );

    // Human — shift démarré : pas de coordination cross-domaine nécessaire (boucle supprimée)

    // Logistics — DLC expiré → notif cuisine (event différent)
    context.registerEventHandler<{ v: 1; tenantId: string; itemId: string; quantity: number; batchNumber: string }>(
      'dlc.expired',
      ({ tenantId, itemId, quantity }) => {
        NexusEventBus.emit('notification.created', {
          v: 1,
          tenantId,
          id: crypto.randomUUID(),
          type: 'alert',
          title: 'DLC expiré',
          message: `Lot ${itemId} — ${quantity} unités à retirer immédiatement`,
          priority: 'high',
          read: false,
          timestamp: new Date().toISOString(),
        });
      },
    );

    // Intelligence — menu engineering : appel direct au service (évite la boucle intelligence.menu_engineering_requested → intelligence.menu_engineering_requested)
    context.registerEventHandler<{ tenantId: string; periodDays: number }>(
      'intelligence.menu_engineering_requested',
      ({ tenantId, periodDays }) => {
        const periodEnd = new Date().toISOString();
        const periodStart = new Date(Date.now() - periodDays * 86_400_000).toISOString();
        menuEngineeringService.computeReport({ tenantId, periodStart, periodEnd }).then(report => {
          RestaurantIntelligenceAdapter.emitSalesDataReady({
            tenantId,
            periodStart: report.periodStart,
            periodEnd:   report.periodEnd,
            totalInMicrounits: report.avgContributionMarginInMicrounits,
            covers: report.items.length,
          });
        }).catch((err: unknown) => logger.warn(`[RestaurantVertical] menu engineering failed: ${toError(err).message}`));
      },
    );

    // Facility — plan de salle et maintenance
    context.registerEventHandler<{ tenantId: string; tableId: string; x: number; y: number }>(
      'floor_plan.table_moved' as never,
      ({ tenantId, tableId, x, y }: { tenantId: string; tableId: string; x: number; y: number }) => {
        RestaurantFacilityAdapter.emitTableLayoutChanged({
          tenantId,
          floorId: 'main',
          tables: [{ id: tableId, capacity: 0, x, y }],
        });
      },
    );

    context.registerEventHandler<{ tenantId: string; assetId: string; description: string }>(
      'maintenance.issue_reported' as never,
      ({ tenantId, assetId, description }: { tenantId: string; assetId: string; description: string }) => {
        RestaurantFacilityAdapter.emitMaintenanceRequired({ tenantId, assetId, assetType: 'equipment', description });
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
