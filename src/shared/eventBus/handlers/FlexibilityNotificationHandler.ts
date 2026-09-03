import { NexusEventBus } from '../NexusEventBus';
import { logger } from '@/lib/logger';

/**
 * FlexibilityNotificationHandler
 * 
 * Assure la chaîne complète de Rappel, d'Alerte et de Notification
 * pour tous les événements de flexibilité temporelle et résilience asynchrone :
 * 
 * 1. Stock négatif -> Alerte urgente (WebPush + Centre de notifications)
 * 2. Vente sans recette -> Rappel de rédaction de fiche technique
 * 3. Réconciliation rétroactive -> Notification de régularisation réussie
 * 4. Écart de prix fournisseur (PUMP) -> Notification d'écart financier
 * 5. Shift RH rétroactif -> Notification de traçabilité RH
 * 6. Clôture en rafale (Batch Z) -> Notification de bilan de clôture
 */
export function registerFlexibilityNotificationHandler(): Array<() => void> {
  const unsubscribers: Array<() => void> = [];

  // 1. Alerte Stock Négatif
  unsubscribers.push(
    NexusEventBus.on('stock.negative_alert', async (payload) => {
      try {
        const itemId = payload.itemId ?? 'inconnu';
        // Correctif N0-5 : id déterministe (une alerte par article, pas par occurrence).
        const notifId = `notif_neg_stock_${itemId}`;
        const message = `Stock négatif détecté sur l'article ${payload.itemName || itemId} (Déficit : ${payload.deficit}, Quantité actuelle : ${payload.currentQuantity}).`;

        // Alerte push urgente pour cuisine et direction.
        // Correctif N0-3 : rôles canoniques (minuscules) — sinon sendToRole ne résout personne.
        await NexusEventBus.emit('notification.urgent', {
          v: 1,
          tenantId: payload.tenantId,
          roles: ['admin', 'manager', 'chef_cuisinier'],
          message,
          priority: 'HIGH',
          metadata: { itemId, deficit: payload.deficit },
        });

        // Notification persistante in-app
        await NexusEventBus.emit('notification.created', {
          v: 1,
          tenantId: payload.tenantId,
          id: notifId,
          type: 'alert',
          title: 'Alerte Rupture de Stock',
          message,
          priority: 'high',
          read: false,
          timestamp: new Date().toISOString(),
          action: { label: 'Voir le stock', href: '/inventory' },
        });
      } catch (err) {
        logger.error('[FlexibilityNotif] Échec alerte stock négatif', err);
      }
    })
  );

  // 2. Rappel Fiche Technique Manquante
  unsubscribers.push(
    NexusEventBus.on('stock.pending_recipe_deduction', async (payload) => {
      try {
        const notifId = `notif_pending_recipe_${payload.deductionId}`;
        const message = `L'article ${payload.productId} a été vendu sans fiche technique. Créez la recette pour régulariser automatiquement les stocks.`;

        await NexusEventBus.emit('notification.created', {
          v: 1,
          tenantId: payload.tenantId,
          id: notifId,
          type: 'warning',
          title: 'Fiche Technique Manquante',
          message,
          priority: 'medium',
          read: false,
          timestamp: new Date().toISOString(),
          action: { label: 'Créer la fiche technique', href: '/menu-builder' },
        });
      } catch (err) {
        logger.error('[FlexibilityNotif] Échec rappel fiche technique', err);
      }
    })
  );

  // 3. Notification Réconciliation Rétroactive de Recette
  unsubscribers.push(
    NexusEventBus.on('stock.deductions_reconciled', async (payload) => {
      try {
        // Correctif N0-5 : id déterministe par recette réconciliée.
        const notifId = `notif_reconciled_${payload.recipeId}`;
        const message = `La recette ${payload.recipeId} a permis de réconcilier rétroactivement ${payload.reconciledCount} déduction(s) en attente.`;

        await NexusEventBus.emit('notification.created', {
          v: 1,
          tenantId: payload.tenantId,
          id: notifId,
          type: 'info',
          title: 'Stocks Régularisés Rétroactivement',
          message,
          priority: 'low',
          read: false,
          timestamp: new Date().toISOString(),
          action: { label: 'Voir le stock', href: '/inventory' },
        });
      } catch (err) {
        logger.error('[FlexibilityNotif] Échec notification réconciliation', err);
      }
    })
  );

  // 4. Notification Écart Fournisseur / PUMP
  unsubscribers.push(
    NexusEventBus.on('finance.purchase_variance_detected', async (payload) => {
      try {
        const notifId = `notif_variance_${payload.invoiceId}_${payload.stockItemId}`;
        const diffEuro = (payload.varianceAmountCts / 100).toFixed(2);
        const sign = payload.varianceAmountCts > 0 ? '+' : '';
        const message = `Écart de coût constaté sur ${payload.stockItemId} (Facture ${payload.invoiceId}) : ${sign}${diffEuro} € par rapport au prix estimé.`;

        await NexusEventBus.emit('notification.created', {
          v: 1,
          tenantId: payload.tenantId,
          id: notifId,
          type: 'warning',
          title: 'Écart Prix Achat Détecté',
          message,
          priority: 'medium',
          read: false,
          timestamp: new Date().toISOString(),
          action: { label: 'Voir l\'écart', href: '/suppliers' },
        });
      } catch (err) {
        logger.error('[FlexibilityNotif] Échec notification écart achat', err);
      }
    })
  );

  // 5. Notification Régularisation RH Rétroactive
  unsubscribers.push(
    NexusEventBus.on('hr.shift_regularized', async (payload) => {
      try {
        const notifId = `notif_shift_reg_${payload.shiftId}`;
        const hours = Math.floor(payload.durationMinutes / 60);
        const mins = payload.durationMinutes % 60;
        const message = `Vacation du ${payload.businessDay} régularisée pour l'employé ${payload.employeeId} (${hours}h${mins > 0 ? mins : ''}) par ${payload.approvedByManagerId}.`;

        await NexusEventBus.emit('notification.created', {
          v: 1,
          tenantId: payload.tenantId,
          id: notifId,
          type: 'info',
          title: 'Pointage Régularisé',
          message,
          priority: 'low',
          read: false,
          timestamp: new Date().toISOString(),
          action: { label: 'Voir les pointages', href: '/timeclock' },
        });
      } catch (err) {
        logger.error('[FlexibilityNotif] Échec notification RH', err);
      }
    })
  );

  // 6. Notification Clôture Batch Multi-Jours
  unsubscribers.push(
    NexusEventBus.on('finance.period_closed_batch', async (payload) => {
      try {
        const notifId = `notif_batch_close_${payload.fromDay}_${payload.toDay}`;
        const caEuro = (payload.totalInMicrounits / 1_000_000).toFixed(2);
        const message = `Clôture en rafale de ${payload.closedDays.length} journée(s) scellée(s) (du ${payload.fromDay} au ${payload.toDay}). CA total : ${caEuro} €.`;

        await NexusEventBus.emit('notification.created', {
          v: 1,
          tenantId: payload.tenantId,
          id: notifId,
          type: 'info',
          title: 'Clôture Multi-Jours Validée',
          message,
          priority: 'medium',
          read: false,
          timestamp: new Date().toISOString(),
          action: { label: 'Voir la clôture', href: '/finance' },
        });
      } catch (err) {
        logger.error('[FlexibilityNotif] Échec notification batch close', err);
      }
    })
  );

  return unsubscribers;
}
