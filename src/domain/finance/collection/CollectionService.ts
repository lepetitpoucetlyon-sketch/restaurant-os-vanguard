import { InvoiceTarget, CollectionAction } from './types';
import { EscalationEngine } from './EscalationEngine';
import { QuantumCrypto } from '@/lib/QuantumCrypto';
import { DocumentVault } from '@/domain/shared/DocumentVault';
import { NexusBridge } from '@/lib/nexus/NexusBridge';
import { NexusTelemetryService } from '@/domain/services/NexusTelemetryService';
import { SovereignMath } from '@/shared/services/SovereignMath';

/**
 * 🏛️ CollectionService - Grade X+++
 * Moteur principal de recouvrement de créances.
 */
export class CollectionService {
    /**
     * Traite un lot de factures en retard et applique l'escalade
     */
    static async processOverdueInvoices(invoices: InvoiceTarget[], tenantId: string = 'global'): Promise<CollectionAction[]> {
        const actions: CollectionAction[] = [];

        for (const invoice of invoices) {
            // Contrainte d'exclusion stricte Grade X
            if (invoice.status === 'disputed' || invoice.optOutCollection) {
                continue;
            }

            const level = EscalationEngine.determineLevel(invoice.dueDate);
            if (!level) continue;

            let actionTaken = '';
            let sealHash: string | undefined = undefined;
            const amountFormatted = SovereignMath.fromMicrounits(invoice.amountOwedInMicrounits).toFixed(2);

            switch (level) {
                case 'FRIENDLY_REMINDER':
                    await NexusBridge.sendCommunicationPulse({
                        type: 'MIXED',
                        recipient: `${invoice.customerEmail},${invoice.customerPhone}`,
                        subject: `Rappel Amiable - Facture ${invoice.id}`,
                        content: `Bonjour, un montant de ${amountFormatted}€ reste à régler.`
                    });
                    actionTaken = 'SENT_FRIENDLY_REMINDER_MIXED';
                    break;

                case 'FORMAL_NOTICE': {
                    const noticePdfContent = [
                        'MISE EN DEMEURE — NIVEAU 1',
                        `Facture       : ${invoice.id}`,
                        `Montant dû    : ${amountFormatted}€`,
                        `Date          : ${new Date().toISOString().slice(0, 10)}`,
                        `Destinataire  : ${invoice.customerEmail}`,
                        '',
                        'Veuillez régler la somme indiquée dans un délai de 8 jours.',
                        'Sans règlement, une mise en demeure légale sera engagée.',
                    ].join('\n');
                    const noticeHash = await QuantumCrypto.sign(noticePdfContent);
                    await DocumentVault.archive(`Relance_${invoice.id}.pdf`, noticePdfContent, {
                        tenantId,
                        type: 'FORMAL_NOTICE',
                        invoiceId: invoice.id,
                        sealHash: noticeHash,
                    });
                    await NexusBridge.sendCommunicationPulse({
                        type: 'EMAIL',
                        recipient: invoice.customerEmail,
                        subject: `Mise en demeure (Niveau 1) - Facture ${invoice.id}`,
                        content: `Veuillez régler la somme de ${amountFormatted}€ immédiatement. Voir PDF joint.`,
                        attachments: [{ filename: `Relance_${invoice.id}.pdf`, content: noticePdfContent }],
                    });
                    actionTaken = 'SENT_FORMAL_NOTICE_WITH_PDF';
                    break;
                }

                case 'LEGAL_WARNING':
                    const legalPdfContent = `MISE EN DEMEURE OFFICIELLE\nFacture: ${invoice.id}\nMontant: ${amountFormatted}€\n`;
                    sealHash = await QuantumCrypto.sign(legalPdfContent);
                    
                    await DocumentVault.archive(`Legal_Warning_${invoice.id}.pdf`, legalPdfContent, {
                        tenantId,
                        type: 'LEGAL_WARNING',
                        invoiceId: invoice.id,
                        sealHash
                    });

                    await NexusBridge.sendCommunicationPulse({
                        type: 'EMAIL',
                        recipient: invoice.customerEmail,
                        subject: `Dernier Avis Avant Poursuites - Facture ${invoice.id}`,
                        content: `Votre dossier est transmis. Voir mise en demeure légale ci-jointe.`,
                        attachments: [{ filename: `Legal_Warning_${invoice.id}.pdf`, content: legalPdfContent }]
                    });
                    
                    actionTaken = 'SENT_LEGAL_WARNING_AND_ARCHIVED';
                    break;
            }

            // Télémétrie Grade X Obligatoire
            NexusTelemetryService.emitAuditPulse('FINANCE', 'COLLECTION_ESCALATION', {
                invoiceId: invoice.id,
                level,
                actionTaken
            });

            actions.push({
                invoiceId: invoice.id,
                level,
                actionTaken,
                timestamp: new Date().toISOString(),
                sealHash
            });
        }

        return actions;
    }
}
