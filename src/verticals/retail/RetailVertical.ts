import { IVerticalPlugin, ICoreContext } from '@/kernel/plugins/IVerticalPlugin';
import { retailDefaultTokens, retailVerticalTokens } from '@nexus/tokens/verticals/retail';
import React from 'react';
import { logger } from '@/lib/logger';
import {
  RetailOpsAdapter,
  RetailCommerceAdapter,
  RetailFinanceAdapter,
  RetailLogisticsAdapter,
  RetailIntelligenceAdapter,
  RetailMccAdapter,
} from './adapters';

export class RetailVertical implements IVerticalPlugin {
  public readonly id = 'retail';
  public readonly name = 'Retail OS';
  public readonly version = '1.0.0';
  public readonly description = 'POS multi-article, retours, stock alerte, promotions, fidélité, NF525';
  public readonly dependencies = ['finance', 'logistics', 'commerce'];
  public readonly defaultTheme = retailDefaultTokens;
  public readonly verticalTokens = retailVerticalTokens;

  public async initialize(context: ICoreContext): Promise<void> {
    logger.info(`[${this.id}] Initialisation verticale retail…`);

    // Routes
    context.registerRoute('/retail-pos', React.lazy(() =>
      import('./ops/RetailPOSPage').then(m => ({ default: m.RetailPOSPage }))));
    context.registerRoute('/catalog', React.lazy(() =>
      import('./commerce/CatalogPage').then(m => ({ default: m.CatalogPage }))));
    context.registerRoute('/returns', React.lazy(() =>
      import('./ops/ReturnsPage').then(m => ({ default: m.ReturnsPage }))));
    context.registerRoute('/promotions', React.lazy(() =>
      import('./commerce/PromotionsPage').then(m => ({ default: m.PromotionsPage }))));
    context.registerRoute('/retail-stock', React.lazy(() =>
      import('./logistics/RetailStockPage').then(m => ({ default: m.RetailStockPage }))));

    // Ops — session POS ouverte
    context.registerEventHandler<{ tenantId: string; sessionId: string; operatorId: string; openedAt: string; openingFloat: number }>(
      'retail.pos_session_opened',
      (payload) => {
        RetailOpsAdapter.emitPosSessionOpened(payload);
        RetailMccAdapter.emitHealthPing({ tenantId: payload.tenantId, status: 'healthy', posOnline: true, stockAlertsCount: 0 });
      },
    );

    // Ops — vente terminée → sceau fiscal + stock + fidélité + métriques
    context.registerEventHandler<{ tenantId: string; saleId: string; customerId?: string; lines: { productId: string; quantity: number; unitPriceInMicrounits: number }[]; totalInMicrounits: number; paymentMethod: string }>(
      'retail.sale_completed',
      ({ tenantId, saleId, customerId, lines, totalInMicrounits }) => {
        RetailFinanceAdapter.emitSaleSealed({ tenantId, orderId: saleId, totalInMicrounits, operatorId: 'system' });
        RetailLogisticsAdapter.emitStockDeducted({ tenantId, orderId: saleId, lines: lines.map(l => ({ stockItemId: l.productId, quantity: l.quantity })) });
        if (customerId) {
          RetailCommerceAdapter.emitLoyaltyEarned({ tenantId, customerId, points: Math.floor(totalInMicrounits / 1_000_000), sourceSaleId: saleId });
        }
        RetailIntelligenceAdapter.emitMetricsSnapshot({ tenantId, date: new Date().toISOString().slice(0, 10), transactions: 1, revenueInMicrounits: totalInMicrounits, avgBasketInMicrounits: totalInMicrounits });
      },
    );

    // Ops — retour → remboursement + réintégration stock
    context.registerEventHandler<{ tenantId: string; returnId: string; originalSaleId: string; lines: { productId: string; quantity: number }[]; refundInMicrounits: number }>(
      'retail.return_processed',
      ({ tenantId, returnId, originalSaleId, refundInMicrounits }) => {
        RetailFinanceAdapter.emitRefundIssued({ tenantId, referenceId: originalSaleId, amountInMicrounits: refundInMicrounits, reason: `Retour ${returnId}` });
        RetailOpsAdapter.emitReturnProcessed({ tenantId, returnId, originalSaleId, lines: [], refundInMicrounits });
      },
    );

    // Logistics — alerte stock bas
    context.registerEventHandler<{ tenantId: string; productId: string; sku: string; currentStock: number; threshold: number }>(
      'retail.stock_alert',
      (payload) => {
        RetailLogisticsAdapter.emitStockAlert(payload);
        RetailIntelligenceAdapter.emitAnomalyDetected({ tenantId: payload.tenantId, metric: `stock.${payload.sku}`, value: payload.currentStock, threshold: payload.threshold, detectedAt: new Date().toISOString() });
      },
    );

    // Commerce — promotion activée
    context.registerEventHandler<{ tenantId: string; promotionId: string; discountPercent: number; productIds: string[]; validUntil: string }>(
      'retail.promotion_activated',
      (payload) => RetailCommerceAdapter.emitPromotionActivated(payload),
    );

    // Finance — bilan Z + audit fiscal si clôture de caisse (NF525)
    context.registerEventHandler<{ tenantId: string; operatorId: string; requestedAt: string }>(
      'finance.z_report_requested',
      (payload) => {
        RetailFinanceAdapter.emitZReportRequested(payload);
        RetailMccAdapter.emitFiscalAuditRequired({ tenantId: payload.tenantId, reason: `Clôture Z demandée par ${payload.operatorId} — vérification NF525`, urgency: 'low' });
      },
    );

    // MCC — health ping
    context.registerEventHandler<{ tenantId: string }>(
      'tenant.ready',
      ({ tenantId }) => {
        RetailMccAdapter.emitHealthPing({ tenantId, status: 'healthy', posOnline: true, stockAlertsCount: 0 });
      },
    );

    logger.info(`[${this.id}] Verticale retail active — ${context.getRegisteredRoutes().length} routes`);
  }

  public async destroy(): Promise<void> {
    logger.info(`[${this.id}] Arrêt de la verticale retail.`);
  }
}
