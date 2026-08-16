/**
 * DeliveryDisputeService.ts
 * 
 * Moteur de traitement des litiges à la livraison et de suivi des avoirs fournisseurs.
 * Invariants :
 * - Montants en centimes entiers (zéro flottant).
 * - Traçabilité stricte des non-conformités (photos, motifs, écarts de prix/quantité).
 */

import {
  DeliveryDisputeEntity,
  DisputeLineItem,
  DisputeStatus,
} from './DeliveryDisputeTypes';

export class DeliveryDisputeService {
  /**
   * Crée une entité de litige structurée et calcule les totaux réclamés au centime près.
   */
  public static createDispute(params: {
    tenantId: string;
    disputeNumber: string;
    purchaseOrderId?: string;
    deliveryNoteNumber: string;
    supplierId: string;
    supplierName: string;
    reportedById: string;
    lines: Omit<DisputeLineItem, 'claimedAmountHtCts'>[];
    vatRatePct?: number;
  }): DeliveryDisputeEntity {
    const vatRate = params.vatRatePct ?? 5.5;

    let totalClaimedHtCts = 0;
    const lines: DisputeLineItem[] = params.lines.map((line) => {
      const missingCount = line.missingPackagesCount > 0 
        ? line.missingPackagesCount 
        : Math.max(0, line.expectedPackagesCount - line.receivedPackagesCount);

      const claimedAmountHtCts = missingCount * line.packagePriceHtCts;
      totalClaimedHtCts += claimedAmountHtCts;

      return {
        ...line,
        missingPackagesCount: missingCount,
        claimedAmountHtCts,
      };
    });

    const totalClaimedVatCts = Math.round((totalClaimedHtCts * vatRate) / 100);
    const totalClaimedTtcCts = totalClaimedHtCts + totalClaimedVatCts;

    const now = Date.now();

    return {
      id: `disp_${now}_${Math.random().toString(36).slice(2, 7)}`,
      tenantId: params.tenantId,
      disputeNumber: params.disputeNumber,
      purchaseOrderId: params.purchaseOrderId,
      deliveryNoteNumber: params.deliveryNoteNumber,
      supplierId: params.supplierId,
      supplierName: params.supplierName,
      reportedById: params.reportedById,
      status: 'OPEN',
      lines,
      totalClaimedHtCts,
      totalClaimedVatCts,
      totalClaimedTtcCts,
      isDeductedFromNextPayment: false,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Génère l'email de réclamation formelle pour le service comptabilité/commercial du fournisseur.
   */
  public static generateClaimEmailBody(
    dispute: DeliveryDisputeEntity,
    businessName: string
  ): string {
    const reasonLabels: Record<string, string> = {
      MISSING_ITEM: 'Article manquant au déchargement',
      DAMAGED_PACKAGE: 'Colis endommagé / emballage percé',
      TEMPERATURE_NON_COMPLIANT: 'Non-conformité température HACCP',
      SHORT_EXPIRY_DLC: 'Date limite de consommation (DLC) trop courte',
      QUALITY_DEFECT: 'Défaut de qualité / produit impropre',
      OVER_INVOICED_PRICE: 'Écart de prix facturé vs mercuriale',
      WRONG_ITEM_DELIVERED: 'Mauvaise référence livrée',
    };

    const linesHtml = dispute.lines.map((l) => {
      const reasonLabel = reasonLabels[l.reason] || l.reason;
      return `<tr>
        <td><strong>${l.ingredientName}</strong></td>
        <td align="center">${l.expectedPackagesCount}</td>
        <td align="center">${l.receivedPackagesCount}</td>
        <td align="center" style="color: red;"><strong>-${l.missingPackagesCount}</strong></td>
        <td>${reasonLabel}${l.comments ? ` (${l.comments})` : ''}</td>
        <td align="right">${(l.claimedAmountHtCts / 100).toFixed(2)} €</td>
      </tr>`;
    }).join('\n');

    return `Bonjour,<br/><br/>
Nous vous signalons une non-conformité lors de la réception de la livraison pour <strong>${businessName}</strong>.<br/><br/>
<strong>N° Bon de Livraison (BL) :</strong> ${dispute.deliveryNoteNumber}<br/>
${dispute.purchaseOrderId ? `<strong>Réf. Commande :</strong> ${dispute.purchaseOrderId}<br/>` : ''}
<strong>Réf. Réclamation interne :</strong> ${dispute.disputeNumber}<br/><br/>

<h3>Détail des anomalies constatées :</h3>
<table border="1" cellpadding="6" style="border-collapse: collapse; width: 100%;">
  <thead>
    <tr style="background-color: #f3f4f6;">
      <th>Article</th>
      <th>Qté Attendue</th>
      <th>Qté Reçue</th>
      <th>Écart</th>
      <th>Motif</th>
      <th>Montant HT</th>
    </tr>
  </thead>
  <tbody>
    ${linesHtml}
  </tbody>
</table>
<br/>
<strong>Montant total de l'avoir demandé : ${(dispute.totalClaimedHtCts / 100).toFixed(2)} € HT (${(dispute.totalClaimedTtcCts / 100).toFixed(2)} € TTC)</strong>
<br/><br/>
Merci de bien vouloir nous émettre l'avoir correspondant dans les meilleurs délais.<br/><br/>
Cordialement,<br/>
L'équipe ${businessName}`;
  }

  /**
   * Rapproche un avoir reçu du fournisseur avec le litige ouvert.
   */
  public static reconcileCreditNote(
    dispute: DeliveryDisputeEntity,
    creditNoteNumber: string,
    creditNoteAmountCts: number
  ): {
    updatedDispute: DeliveryDisputeEntity;
    isExactMatch: boolean;
    differenceCts: number;
  } {
    const differenceCts = creditNoteAmountCts - dispute.totalClaimedTtcCts;
    const isExactMatch = differenceCts === 0;

    const updatedDispute: DeliveryDisputeEntity = {
      ...dispute,
      creditNoteNumber,
      creditNoteAmountCts,
      creditNoteReceivedAtUtc: Date.now(),
      status: 'CREDIT_NOTE_RECEIVED',
      updatedAt: Date.now(),
    };

    return {
      updatedDispute,
      isExactMatch,
      differenceCts,
    };
  }
}
