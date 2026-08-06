import { IVerticalPlugin, ICoreContext } from '@/shared/plugins/IVerticalPlugin';
import React from 'react';
import { logger } from '@/lib/logger';
import {
  BakeryOpsAdapter,
  BakeryCommerceAdapter,
  BakeryComplianceAdapter,
  BakeryFinanceAdapter,
  BakeryFacilityAdapter,
  BakeryIntelligenceAdapter,
  BakeryLogisticsAdapter,
  BakeryMccAdapter,
} from './adapters';

export class BakeryVertical implements IVerticalPlugin {
  public readonly id = 'bakery';
  public readonly name = 'Bakery OS';
  public readonly version = '1.0.0';
  public readonly description = 'Production par fournées, précommandes, allergènes INCO, stock vitrine';
  public readonly dependencies = ['finance', 'compliance', 'logistics'];

  public async initialize(context: ICoreContext): Promise<void> {
    logger.info(`[${this.id}] Initialisation verticale boulangerie…`);

    // Routes
    context.registerRoute('/production', React.lazy(() =>
      import('./ops/BatchProductionDashboard').then(m => ({ default: m.BatchProductionDashboard }))));
    context.registerRoute('/preorders', React.lazy(() =>
      import('./commerce/PreorderManagement').then(m => ({ default: m.PreorderManagement }))));
    context.registerRoute('/display-stock', React.lazy(() =>
      import('./logistics/DisplayStockPage').then(m => ({ default: m.DisplayStockPage }))));
    context.registerRoute('/allergens', React.lazy(() =>
      import('./compliance/AllergenRegistry').then(m => ({ default: m.AllergenRegistry }))));

    // Ops — fournée démarrée → déduction ingrédients
    context.registerEventHandler<{ tenantId: string; batchId: string; recipe: string; quantity: number; ovenId: string; startedAt: string }>(
      'bakery.batch_started',
      ({ tenantId, batchId }) => {
        BakeryLogisticsAdapter.emitIngredientConsumed({ tenantId, batchId, lines: [] });
      },
    );

    // Ops — fournée terminée → mise à jour stock vitrine + analytics
    context.registerEventHandler<{ tenantId: string; batchId: string; recipe: string; yield: number; completedAt: string }>(
      'bakery.batch_completed',
      ({ tenantId, batchId, recipe, yield: qty, completedAt }) => {
        BakeryIntelligenceAdapter.emitMetricsSnapshot({
          tenantId,
          date: completedAt.slice(0, 10),
          batchesProduced: 1,
          wastePercent: 0,
          revenueInMicrounits: 0,
        });
        BakeryOpsAdapter.emitBatchCompleted({ tenantId, batchId, recipe, yield: qty, completedAt });
      },
    );

    // Compliance — anomalie température four → alerte HACCP
    context.registerEventHandler<{ tenantId: string; ovenId: string; currentTemp: number; targetTemp: number; severity: 'warning' | 'critical' }>(
      'bakery.oven_temp_alert',
      ({ tenantId, ovenId, currentTemp, targetTemp, severity }) => {
        BakeryComplianceAdapter.emitOvenTempAlert({ tenantId, sensorId: ovenId, temperature: currentTemp, durationInMinutes: 5 });
        if (severity === 'critical') {
          BakeryMccAdapter.emitFiscalAuditRequired({ tenantId, reason: `Four ${ovenId} : température critique ${currentTemp}°C vs ${targetTemp}°C`, urgency: 'critical' });
          BakeryFacilityAdapter.emitOvenMaintenanceRequired({ tenantId, assetId: ovenId, assetType: 'oven', description: `Défaillance température : ${currentTemp}°C` });
        }
      },
    );

    // Commerce — précommande reçue → réservation stock
    context.registerEventHandler<{ tenantId: string; preorderId: string; customerId: string; items: { productId: string; quantity: number }[]; pickupDate: string }>(
      'bakery.preorder_received',
      ({ tenantId, customerId, preorderId, items, pickupDate }) => {
        BakeryCommerceAdapter.emitPreorderReceived({ tenantId, preorderId, customerId, items, pickupDate });
        BakeryCommerceAdapter.emitLoyaltyPointsEarned({ tenantId, customerId, points: items.reduce((s, i) => s + i.quantity, 0), sourceOrderId: preorderId });
      },
    );

    // Logistics — stock vitrine bas → réassort fournée
    context.registerEventHandler<{ tenantId: string; productId: string; currentStock: number; threshold: number }>(
      'bakery.display_stock_low',
      ({ tenantId, productId, currentStock, threshold }) => {
        BakeryLogisticsAdapter.emitDisplayStockLow({ tenantId, productId, currentStock, threshold });
        BakeryIntelligenceAdapter.emitAnomalyDetected({ tenantId, metric: `display_stock.${productId}`, value: currentStock, threshold, detectedAt: new Date().toISOString() });
      },
    );

    // Compliance — allergènes déclarés → registre INCO
    context.registerEventHandler<{ tenantId: string; productId: string; allergens: string[]; updatedAt: string }>(
      'bakery.allergen_declared',
      (payload) => BakeryComplianceAdapter.emitAllergenDeclared(payload),
    );

    // Finance — fin de journée → bilan Z
    context.registerEventHandler<{ tenantId: string; operatorId: string; requestedAt: string }>(
      'finance.z_report_requested',
      (payload) => BakeryFinanceAdapter.emitZReportRequested(payload),
    );

    // MCC — health ping
    context.registerEventHandler<{ tenantId: string }>(
      'tenant.ready',
      ({ tenantId }) => {
        BakeryMccAdapter.emitHealthPing({ tenantId, status: 'healthy', ovensOnline: 0, activeBatches: 0 });
      },
    );

    logger.info(`[${this.id}] Verticale boulangerie active — ${context.getRegisteredRoutes().length} routes`);
  }

  public async destroy(): Promise<void> {
    logger.info(`[${this.id}] Arrêt de la verticale boulangerie.`);
  }
}
