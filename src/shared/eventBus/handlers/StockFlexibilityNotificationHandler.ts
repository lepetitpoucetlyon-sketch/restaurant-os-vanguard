import { NexusEventBus } from '../NexusEventBus';
import { logger } from '@/lib/logger';

/**
 * StockFlexibilityNotificationHandler (audit P2 — event pairing)
 *
 * Onze events métier logistiques et RH ont été rendus émis par des services
 * dédiés (RfaContract, SupplierDispute, DlcExpiryAlert, PerpetualInventory,
 * VariableWeightStock, DoublePassOcr, SkuSubstitutionAlert, CommodityPriceSurge,
 * SupplierOrderCutoff, InterStationTransferTracker, HCRPayrollCalculator) mais
 * n'avaient AUCUN consommateur → effet de bord perdu (aucune notification,
 * aucun log métier, aucune traçabilité côté utilisateur).
 *
 * Ce handler assure la fan-out vers `notification.created` (in-app) pour que
 * les alertes cutoff/DLC/écart PUMP/substitution/etc. remontent à la
 * direction ou au chef de cuisine. Les ids sont déterministes (une
 * notification par entité concernée, pas par occurrence) : re-jeu = pas de
 * doublon dans le centre de notifications.
 *
 * Rythme d'alerte / rôles ciblés / gravité respectent le contrat existant
 * (voir FlexibilityNotificationHandler pour la matrice canonique).
 */
export function registerStockFlexibilityNotificationHandler(): Array<() => void> {
  const unsub: Array<() => void> = [];

  // 1. RFA fournisseur calculée (fin d'exercice)
  unsub.push(NexusEventBus.on('stock.rfa_computed', async (p) => {
    try {
      const notifId = `notif_rfa_${p.supplierId}_${p.periodYear}`;
      const rfaEuro = (p.rfaDueInMicrounits / 1_000_000).toFixed(2);
      await NexusEventBus.emit('notification.created', {
        v: 1,
        tenantId: p.tenantId,
        id: notifId,
        type: 'info',
        title: 'RFA fournisseur calculée',
        message: `Ristourne annuelle due par ${p.supplierId} sur ${p.periodYear} : ${rfaEuro} €.`,
        priority: 'medium',
        read: false,
        timestamp: new Date().toISOString(),
        action: { label: 'Voir le fournisseur', href: '/suppliers' },
      });
    } catch (err) { logger.error('[StockFlexNotif] rfa_computed', err); }
  }));

  // 2. Litige fournisseur ouvert
  unsub.push(NexusEventBus.on('stock.supplier_dispute_opened', async (p) => {
    try {
      const notifId = `notif_dispute_${p.deliverySlipId}`;
      const disputeEuro = (p.disputedAmountInMicrounits / 1_000_000).toFixed(2);
      await NexusEventBus.emit('notification.created', {
        v: 1,
        tenantId: p.tenantId,
        id: notifId,
        type: 'warning',
        title: 'Litige fournisseur ouvert',
        message: `BL ${p.deliverySlipId} — ${p.supplierId}. Montant contesté : ${disputeEuro} €.${p.sepaHoldActive ? ' Prélèvement SEPA suspendu.' : ''}`,
        priority: 'high',
        read: false,
        timestamp: new Date().toISOString(),
        action: { label: 'Voir le litige', href: '/suppliers' },
      });
    } catch (err) { logger.error('[StockFlexNotif] supplier_dispute_opened', err); }
  }));

  // 3. Alerte DLC
  unsub.push(NexusEventBus.on('stock.dlc_alert_triggered', async (p) => {
    try {
      const notifId = `notif_dlc_${p.batchId}`;
      const severityLabel =
        p.severity === 'expired' ? 'expiré' :
        p.severity === 'j_minus_1' ? 'J-1' : 'J-3';
      await NexusEventBus.emit('notification.urgent', {
        v: 1,
        tenantId: p.tenantId,
        roles: ['admin', 'manager', 'chef_cuisinier'],
        message: `DLC ${severityLabel} — ${p.sku} (lot ${p.batchId}).`,
        priority: 'HIGH',
        metadata: { sku: p.sku, batchId: p.batchId, daysRemaining: p.daysRemaining },
      });
      await NexusEventBus.emit('notification.created', {
        v: 1,
        tenantId: p.tenantId,
        id: notifId,
        type: 'alert',
        title: `DLC ${severityLabel}`,
        message: `${p.sku} — lot ${p.batchId} (${p.daysRemaining} j restants).`,
        priority: 'high',
        read: false,
        timestamp: new Date().toISOString(),
        action: { label: 'Voir le stock', href: '/inventory' },
      });
    } catch (err) { logger.error('[StockFlexNotif] dlc_alert_triggered', err); }
  }));

  // 4. Inventaire permanent réconcilié
  unsub.push(NexusEventBus.on('stock.perpetual_inventory_reconciled', async (p) => {
    try {
      const notifId = `notif_perpetual_${p.category}_${p.reconciledAt}`;
      const varianceEuro = (p.totalVarianceInMicrounits / 1_000_000).toFixed(2);
      await NexusEventBus.emit('notification.created', {
        v: 1,
        tenantId: p.tenantId,
        id: notifId,
        type: 'info',
        title: 'Inventaire permanent réconcilié',
        message: `${p.category} — ${p.countedItemsCount} articles comptés, écart total ${varianceEuro} €.`,
        priority: 'low',
        read: false,
        timestamp: new Date().toISOString(),
        action: { label: 'Voir l\'inventaire', href: '/inventory' },
      });
    } catch (err) { logger.error('[StockFlexNotif] perpetual_inventory_reconciled', err); }
  }));

  // 5. Pesée variable enregistrée
  unsub.push(NexusEventBus.on('stock.variable_weight_recorded', async (p) => {
    try {
      const notifId = `notif_var_weight_${p.lotId}`;
      const yieldPct = Math.round(p.yieldPct);
      // Alerte seulement si rendement anormal (<80% ou >100%)
      if (yieldPct < 80 || yieldPct > 100) {
        await NexusEventBus.emit('notification.created', {
          v: 1,
          tenantId: p.tenantId,
          id: notifId,
          type: 'warning',
          title: 'Rendement pesée anormal',
          message: `${p.sku} (lot ${p.lotId}) — rendement ${yieldPct}% (brut ${p.grossWeightGrams} g → net ${p.netWeightGrams} g).`,
          priority: 'medium',
          read: false,
          timestamp: new Date().toISOString(),
          action: { label: 'Voir le stock', href: '/inventory' },
        });
      }
    } catch (err) { logger.error('[StockFlexNotif] variable_weight_recorded', err); }
  }));

  // 6. OCR double-passe traité (revue manuelle si confiance basse)
  unsub.push(NexusEventBus.on('stock.double_pass_ocr_processed', async (p) => {
    try {
      if (!p.requiresManualReview) return;
      const notifId = `notif_ocr_review_${p.invoiceId}`;
      await NexusEventBus.emit('notification.created', {
        v: 1,
        tenantId: p.tenantId,
        id: notifId,
        type: 'warning',
        title: 'Facture OCR à vérifier',
        message: `Confiance OCR ${p.confidencePct}% sur ${p.invoiceId} — revue manuelle recommandée.`,
        priority: 'medium',
        read: false,
        timestamp: new Date().toISOString(),
        action: { label: 'Voir la facture', href: '/suppliers' },
      });
    } catch (err) { logger.error('[StockFlexNotif] double_pass_ocr_processed', err); }
  }));

  // 7. Substitution SKU non autorisée
  unsub.push(NexusEventBus.on('stock.sku_substitution_alert', async (p) => {
    try {
      const notifId = `notif_substitution_${p.supplierId}_${p.orderedSku}_${p.deliveredSku}`;
      await NexusEventBus.emit('notification.created', {
        v: 1,
        tenantId: p.tenantId,
        id: notifId,
        type: 'warning',
        title: 'Substitution SKU non autorisée',
        message: `${p.supplierId} a livré ${p.deliveredSku} à la place de ${p.orderedSku}.`,
        priority: 'high',
        read: false,
        timestamp: new Date().toISOString(),
        action: { label: 'Voir la livraison', href: '/suppliers' },
      });
    } catch (err) { logger.error('[StockFlexNotif] sku_substitution_alert', err); }
  }));

  // 8. Envol de prix commodité
  unsub.push(NexusEventBus.on('stock.commodity_price_surge_detected', async (p) => {
    try {
      const notifId = `notif_surge_${p.ingredientSku}_${p.detectedAt}`;
      const surgePct = Math.round(p.surgePct);
      const prevEuro = (p.previousPriceInMicrounits / 1_000_000).toFixed(2);
      const curEuro = (p.currentPriceInMicrounits / 1_000_000).toFixed(2);
      await NexusEventBus.emit('notification.created', {
        v: 1,
        tenantId: p.tenantId,
        id: notifId,
        type: 'warning',
        title: 'Envol de prix matière première',
        message: `${p.ingredientSku} : +${surgePct}% (${prevEuro} € → ${curEuro} €). Revoir la carte ?`,
        priority: 'medium',
        read: false,
        timestamp: new Date().toISOString(),
        action: { label: 'Voir les fournisseurs', href: '/suppliers' },
      });
    } catch (err) { logger.error('[StockFlexNotif] commodity_price_surge_detected', err); }
  }));

  // 9. Cutoff commande fournisseur imminent
  unsub.push(NexusEventBus.on('stock.cutoff_alert_triggered', async (p) => {
    try {
      const notifId = `notif_cutoff_${p.supplierId}_${p.cutoffTimeIso}`;
      const draftEuro = (p.draftOrderValueInMicrounits / 1_000_000).toFixed(2);
      await NexusEventBus.emit('notification.urgent', {
        v: 1,
        tenantId: p.tenantId,
        roles: ['admin', 'manager'],
        message: `Cutoff ${p.supplierId} dans ${p.minutesRemaining} min. Panier en cours : ${draftEuro} €.`,
        priority: 'HIGH',
        metadata: { supplierId: p.supplierId, minutesRemaining: p.minutesRemaining },
      });
      await NexusEventBus.emit('notification.created', {
        v: 1,
        tenantId: p.tenantId,
        id: notifId,
        type: 'alert',
        title: 'Cutoff commande imminent',
        message: `${p.supplierId} — ${p.minutesRemaining} min avant coupure. Panier : ${draftEuro} €.`,
        priority: 'high',
        read: false,
        timestamp: new Date().toISOString(),
        action: { label: 'Voir la commande', href: '/suppliers' },
      });
    } catch (err) { logger.error('[StockFlexNotif] cutoff_alert_triggered', err); }
  }));

  // 10. Transfert inter-poste tracé
  unsub.push(NexusEventBus.on('stock.inter_station_transfer_recorded', async (p) => {
    try {
      const notifId = `notif_transfer_${p.sku}_${p.transferredAt}`;
      await NexusEventBus.emit('notification.created', {
        v: 1,
        tenantId: p.tenantId,
        id: notifId,
        type: 'info',
        title: 'Transfert inter-poste',
        message: `${p.quantity}× ${p.sku} : ${p.fromStation} → ${p.toStation}.`,
        priority: 'low',
        read: false,
        timestamp: new Date().toISOString(),
        action: { label: 'Voir le stock', href: '/inventory' },
      });
    } catch (err) { logger.error('[StockFlexNotif] inter_station_transfer_recorded', err); }
  }));

  // 11. Fiche de paie HCR calculée
  unsub.push(NexusEventBus.on('hr.hcr_payroll_computed', async (p) => {
    try {
      const notifId = `notif_hcr_payroll_${p.employeeId}_${p.periodLabel}`;
      const grossEuro = (p.totalGrossInMicrounits / 1_000_000).toFixed(2);
      await NexusEventBus.emit('notification.created', {
        v: 1,
        tenantId: p.tenantId,
        id: notifId,
        type: 'info',
        title: 'Paie HCR calculée',
        message: `Employé ${p.employeeId} — ${p.periodLabel} : brut ${grossEuro} €.`,
        priority: 'medium',
        read: false,
        timestamp: new Date().toISOString(),
        action: { label: 'Voir la paie', href: '/staff' },
      });
    } catch (err) { logger.error('[StockFlexNotif] hcr_payroll_computed', err); }
  }));

  return unsub;
}
