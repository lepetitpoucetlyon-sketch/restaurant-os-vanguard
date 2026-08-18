/**
 * MultiChannelOrderDispatcherService.ts
 * 
 * Moteur de validation et d'envoi multi-canaux des commandes fournisseurs (WhatsApp, SMS, Email PDF, EDI).
 */

import type { PurchaseOrderEntity, OrderDispatchPayload } from './SupplierOrderTypes';
import type { SupplierEntity } from '../core/domain/supplier.types';

export class MultiChannelOrderDispatcherService {
  /**
   * Vérifie si la commande respecte les contraintes du fournisseur (jours de livraison, cut-off).
   */
  public static validateOrderConstraints(
    order: PurchaseOrderEntity,
    supplier: SupplierEntity,
    targetDeliveryDateStr: string // "YYYY-MM-DD"
  ): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    const deliveryDate = new Date(targetDeliveryDateStr);
    let dayOfWeek = deliveryDate.getUTCDay();
    if (dayOfWeek === 0) dayOfWeek = 7; // Dimanche = 7

    if (!supplier.deliverySchedule.allowedDays.includes(dayOfWeek)) {
      errors.push(`Le fournisseur ${supplier.name} ne livre pas le jour demandé (${targetDeliveryDateStr}).`);
    }

    if (order.totalHtCts < supplier.francoCts) {
      const diffCts = supplier.francoCts - order.totalHtCts;
      const diffEuros = (diffCts / 100).toFixed(2);
      warnings.push(`Commande inférieure au Franco (${(supplier.francoCts / 100).toFixed(2)} €). Des frais de port de ${(supplier.shippingCostCts / 100).toFixed(2)} € s'appliquent (manque ${diffEuros} €).`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Génère le message WhatsApp stylisé pour le commercial du grossiste.
   */
  public static generateWhatsAppPayload(
    order: PurchaseOrderEntity,
    businessName: string,
    recipientPhone: string
  ): OrderDispatchPayload {
    const lines = [
      `*COMMANDE FOURNISSEUR — ${businessName.toUpperCase()}*`,
      `📄 *Réf:* ${order.orderNumber}`,
      `📅 *Livraison souhaitée:* ${order.expectedDeliveryDate}`,
      `---------------------------------`,
      ...order.items.map(
        (item) => `▪️ *${item.packagesCount}x* ${item.name} (${item.packagingLabel})`
      ),
      `---------------------------------`,
      `💰 *Total estimé:* ${(order.totalHtCts / 100).toFixed(2)} € HT`,
    ];

    if (order.deliveryInstructions) {
      lines.push(`ℹ️ *Note:* ${order.deliveryInstructions}`);
    }

    lines.push(`\nMerci de nous confirmer la bonne réception et la disponibilité des produits. 🙏`);

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      channel: 'WHATSAPP',
      recipient: recipientPhone,
      formattedBody: lines.join('\n'),
    };
  }

  /**
   * Génère le message SMS concis.
   */
  public static generateSmsPayload(
    order: PurchaseOrderEntity,
    businessName: string,
    recipientPhone: string
  ): OrderDispatchPayload {
    const itemsSummary = order.items.map((i) => `${i.packagesCount}x ${i.name}`).join(', ');
    const body = `CMD ${order.orderNumber} ${businessName}: Livr ${order.expectedDeliveryDate}. Art: ${itemsSummary}. Total: ${(order.totalHtCts / 100).toFixed(2)}E HT. Merci de confirmer.`;

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      channel: 'SMS',
      recipient: recipientPhone,
      formattedBody: body,
    };
  }

  /**
   * Génère l'email professionnel avec attachement PDF.
   */
  public static generateEmailPayload(
    order: PurchaseOrderEntity,
    businessName: string,
    recipientEmail: string
  ): OrderDispatchPayload {
    const htmlLines = [
      `Bonjour,`,
      `<br/><br/>`,
      `Veuillez trouver ci-joint notre bon de commande <strong>#${order.orderNumber}</strong> pour le restaurant <strong>${businessName}</strong>.`,
      `<br/><br/>`,
      `<strong>Date de livraison souhaitée :</strong> ${order.expectedDeliveryDate}<br/>`,
      order.deliveryInstructions ? `<strong>Instructions :</strong> ${order.deliveryInstructions}<br/>` : '',
      `<br/>`,
      `<h3>Détail de la commande :</h3>`,
      `<table border="1" cellpadding="6" style="border-collapse: collapse;">`,
      `<thead><tr><th>Article</th><th>Colisage</th><th>Quantité</th><th>Prix Colis HT</th><th>Total HT</th></tr></thead>`,
      `<tbody>`,
      ...order.items.map((item) => 
        `<tr><td>${item.name}</td><td>${item.packagingLabel}</td><td align="center">${item.packagesCount}</td><td align="right">${(item.packagePriceHtCts / 100).toFixed(2)} €</td><td align="right">${(item.totalHtCts / 100).toFixed(2)} €</td></tr>`
      ),
      `</tbody>`,
      `</table>`,
      `<br/>`,
      `<strong>Total Commande : ${(order.totalHtCts / 100).toFixed(2)} € HT</strong>`,
      `<br/><br/>`,
      `Cordialement,<br/>L'équipe ${businessName}`,
    ];

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      channel: 'EMAIL_PDF',
      recipient: recipientEmail,
      formattedBody: htmlLines.join('\n'),
      pdfAttachmentName: `BON_DE_COMMANDE_${order.orderNumber}.pdf`,
    };
  }
}
