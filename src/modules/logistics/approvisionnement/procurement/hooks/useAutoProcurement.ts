'use client';

import { useMemo, useState, useCallback } from 'react';
import { AutoProcurementEngine, type SupplierBasketDraft } from '../AutoProcurementEngine';
import { MultiChannelOrderDispatcherService } from '../../orders/MultiChannelOrderDispatcherService';
import type { StockItem } from '@/modules/logistics/domain/schemas/inventory';
import type { MercurialeItem } from '../../mercuriales/MercurialeTypes';
import type { SupplierEntity, SupplierContact } from '../../core/domain/supplier.types';
import type { PurchaseOrderEntity } from '../../orders/SupplierOrderTypes';

export interface UseAutoProcurementProps {
  tenantId: string;
  stockItems: StockItem[];
  mercurialeItems: MercurialeItem[];
  suppliers: SupplierEntity[];
  currentUserId: string;
  restaurantName?: string;
}

export function useAutoProcurement({
  tenantId,
  stockItems,
  mercurialeItems,
  suppliers,
  currentUserId,
  restaurantName = 'Restaurant OS',
}: UseAutoProcurementProps) {
  const [safetyFactor, setSafetyFactor] = useState<number>(1.2);
  const [targetDeliveryDate, setTargetDeliveryDate] = useState<string>(() => {
    const tomorrow = new Date(Date.now() + 86400000);
    return tomorrow.toISOString().slice(0, 10);
  });
  const [activeSupplierId, setActiveSupplierId] = useState<string | null>(null);
  const [dispatchedOrders, setDispatchedOrders] = useState<PurchaseOrderEntity[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Exécution de l'analyse d'auto-approvisionnement
  const analysis = useMemo(() => {
    return AutoProcurementEngine.generateRestockRecommendations(
      stockItems,
      mercurialeItems,
      suppliers,
      safetyFactor
    );
  }, [stockItems, mercurialeItems, suppliers, safetyFactor]);

  // Définir le fournisseur actif par défaut
  const selectedBasket = useMemo(() => {
    if (!analysis.supplierBaskets.length) return null;
    if (!activeSupplierId) return analysis.supplierBaskets[0];
    return analysis.supplierBaskets.find((b) => b.supplierId === activeSupplierId) || analysis.supplierBaskets[0];
  }, [analysis.supplierBaskets, activeSupplierId]);

  // Génération et engagement d'une commande individuelle
  const dispatchSingleBasket = useCallback(
    async (basket: SupplierBasketDraft): Promise<PurchaseOrderEntity> => {
      const order = AutoProcurementEngine.buildPurchaseOrderFromBasket(
        tenantId,
        basket,
        currentUserId,
        Math.floor(1000 + Math.random() * 9000),
        targetDeliveryDate
      );

      // Si le canal est WhatsApp, on génère le payload formaté
      if (order.dispatchChannel === 'WHATSAPP') {
        const supplier = suppliers.find((s) => s.id === basket.supplierId);
        const contact = supplier?.contacts.find((c: SupplierContact) => c.phone)?.phone || '+33600000000';
        MultiChannelOrderDispatcherService.generateWhatsAppPayload(order, restaurantName, contact);
      }

      return order;
    },
    [tenantId, currentUserId, targetDeliveryDate, suppliers, restaurantName]
  );

  // Engagement de tous les paniers en un clic
  const dispatchAllBaskets = useCallback(async () => {
    setIsProcessing(true);
    try {
      const orders: PurchaseOrderEntity[] = [];
      for (const basket of analysis.supplierBaskets) {
        const order = await dispatchSingleBasket(basket);
        orders.push(order);
      }
      setDispatchedOrders(orders);
      return orders;
    } finally {
      setIsProcessing(false);
    }
  }, [analysis.supplierBaskets, dispatchSingleBasket]);

  return {
    analysis,
    selectedBasket,
    activeSupplierId: selectedBasket?.supplierId || null,
    setActiveSupplierId,
    safetyFactor,
    setSafetyFactor,
    targetDeliveryDate,
    setTargetDeliveryDate,
    dispatchSingleBasket,
    dispatchAllBaskets,
    dispatchedOrders,
    isProcessing,
  };
}
