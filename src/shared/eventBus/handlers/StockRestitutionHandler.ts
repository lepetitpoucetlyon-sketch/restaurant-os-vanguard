/* eslint-disable no-restricted-imports -- infrastructure/aggregator: deep path required */
import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/infrastructure/services/audit';
import type { Order } from '@nexus/contracts';
import type { CartItem } from '@/modules/ops/workflow/engine/types';
import { FinancialNexusBridge } from '@/modules/finance/comptabilite/FinancialNexusBridge';

/** Produit avec recette (forme runtime Firestore) */
interface ProductWithRecipe {
  id: string;
  name: string;
  recipe?: {
    ingredients: Array<{
      id: string;
      name: string;
      quantity: number;  // par portion
    }>;
  };
}
/** Article de stock (état Firestore) */
interface StockRecord {
  id: string;
  quantity: number;
  prmp?: number;         // Prix de Revient Moyen Pondéré en microunits
  name?: string;
}
/** Commande enrichie avec le mode de paiement */
type OrderWithPayment = Order & { paymentMode?: string };

/**
 * StockRestitutionHandler (P1)
 * Consomme les événements 'order.cancelled' et restitue les stocks au gramme
 * en re-parcourant la BOM des items de la commande (effet inverse de StockDeductionHandler).
 */
export function registerStockRestitutionHandler(): () => void {
  return NexusEventBus.on(
    'order.cancelled',
    async (payload) => {
      const { tenantId, orderId, operatorId, reason } = payload;
      
      // 1. Lire la commande annulée pour récupérer ses items
      const order = await Nexus.adapter.get<Order>(`tenants/${tenantId}/flows/${orderId}`) 
                 || await Nexus.adapter.get<Order>(`tenants/${tenantId}/deliveryOrders/${orderId}`);
      
      if (!order || !order.items) {
        logger.warn(`[StockRestitution] Impossible de restituer le stock: commande ${orderId} introuvable ou sans items.`);
        return;
      }

      // 2. Agréger les ingrédients à recréditer via les BOMs (simplifié: on prend les items direct s'ils ont une BOM)
      const restitutions = new Map<string, { qty: number; name: string }>();

      for (const item of order.items) {
        const product = await Nexus.adapter.get<ProductWithRecipe>(`tenants/${tenantId}/products/${item.productId}`);
        if (!product || !product.recipe || !product.recipe.ingredients) continue;
        
        for (const ing of product.recipe.ingredients) {
          const needed = (ing.quantity ?? 0) * (item.quantity ?? 1);
          if (needed > 0) {
            const current = restitutions.get(ing.id) ?? { qty: 0, name: ing.name };
            restitutions.set(ing.id, { ...current, qty: current.qty + needed });
          }
        }
      }

      // 3. Appliquer la restitution sur chaque stock item
      for (const [stockItemId, data] of restitutions.entries()) {
        const path = `tenants/${tenantId}/stockItems/${stockItemId}`;
        const stockItem = await Nexus.adapter.get<StockRecord>(path);
        if (!stockItem) continue;

        const newQty = (stockItem.quantity ?? 0) + data.qty;

        await Nexus.adapter.update(path, {
          quantity: newQty,
          updatedAt: new Date().toISOString(),
        });

        logger.info(`[StockRestitution] ${data.name} +${data.qty} → nouveau stock ${newQty} (Annulation ${orderId})`);

        empireAudit.log({
          module: 'inventory',
          action: 'STOCK_RESTITUTED',
          details: { orderId, stockItemId, added: data.qty, newQty, reason },
          severity: 'low',
          timestamp: new Date(),
        });
      }

      // 4. (P01-I) Création de l'avoir comptable
      try {
        const cartItemsForRefund = order.items.map(i => ({
          productId: i.productId,
          name: i.name,
          quantity: -1 * (i.quantity ?? 1), // Quantité négative = Avoir
          unitPriceInMicrounits: i.unitPriceInMicrounits ?? 0,
          categoryId: i.categoryId,
          taxRate: i.taxRate
        })) as unknown as CartItem[];

        await FinancialNexusBridge.processOrder({
          cartItems: cartItemsForRefund,
          operatorId,
          tableId: order.tableId ?? null,
          tenantId,
          paymentMode: ((order as OrderWithPayment).paymentMode ?? 'card') as import('@/modules/finance/comptabilite/FinancialNexusBridge').PaymentMode, // Mode de paiement original
        });
        
        // Avoir document for traceability
        await Nexus.adapter.update(`tenants/${tenantId}/avoirs/avoir_${orderId}`, {
          type: 'CREDIT_NOTE',
          orderId,
          operatorId,
          reason,
          totalInMicrounits: cartItemsForRefund.reduce((acc, i) => acc + (i.unitPriceInMicrounits * i.quantity), 0),
          createdAt: Date.now(),
        });

        logger.info(`[StockRestitution] Avoir comptable généré avec succès pour l'annulation ${orderId}`);
      } catch (err) {
        logger.error(`[StockRestitution] Erreur lors de la génération de l'avoir pour ${orderId}`, err);
      }
    },
    { id: 'stock-restitution', priority: 'HIGH' }
  );
}
