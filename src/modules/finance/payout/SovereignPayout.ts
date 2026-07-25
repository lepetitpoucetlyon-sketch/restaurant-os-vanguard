import { PayoutInvoice, PayoutRequest } from './types';
import { FinancialNexusBridge } from '@/modules/finance/banking/FinancialNexusBridge';
import { QuantumCrypto } from '@/lib/QuantumCrypto';
import { NexusTelemetryService } from '@/domain/services/NexusTelemetryService';
import { SovereignLedger } from '@/domain/services/SovereignLedger';

/**
 * 🏛️ SovereignPayout - Grade X+++
 * Virements Fournisseurs Intégrés avec Approbation Duale
 */
export class SovereignPayout {
    private static readonly MCC_APPROVAL_THRESHOLD_CENTS = 50000; // 500.00€

    /**
     * Initie une demande de paiement fournisseur.
     */
    static async initiatePayout(invoice: PayoutInvoice, initiatorAdminId: string, tenantId: string): Promise<PayoutRequest> {
        if (invoice.status !== 'validated') {
            throw new Error('PAYOUT_001: Invoice must be validated before payout.');
        }

        const currentBalance = await FinancialNexusBridge.getBalance();
        if (currentBalance < invoice.amountInCents) {
            throw new Error('PAYOUT_002: Insufficient funds for payout.');
        }

        const isHighValue = invoice.amountInCents > this.MCC_APPROVAL_THRESHOLD_CENTS;
        
        const request: PayoutRequest = {
            id: `REQ-${invoice.id}-${Date.now()}`,
            invoiceId: invoice.id,
            amountInCents: invoice.amountInCents,
            status: isHighValue ? 'pending_approval' : 'approved',
            approvals: []
        };

        // Première signature Post-Quantique par l'initiateur
        const signature = await QuantumCrypto.sign(`APPROVE_${request.id}_${initiatorAdminId}`);
        request.approvals.push({
            adminId: initiatorAdminId,
            signatureHash: signature,
            timestamp: new Date().toISOString()
        });

        if (!isHighValue) {
            await this.executePayout(request, invoice, tenantId);
        }

        NexusTelemetryService.emitAuditPulse('FINANCE', 'PAYOUT_INITIATED', {
            requestId: request.id,
            amountInCents: request.amountInCents,
            requiresDualApproval: isHighValue
        });

        return request;
    }

    /**
     * Valide le paiement via l'Approbation Duale (MCC).
     */
    static async approvePayout(request: PayoutRequest, invoice: PayoutInvoice, secondAdminId: string, tenantId: string): Promise<PayoutRequest> {
        if (request.status !== 'pending_approval') {
            throw new Error('PAYOUT_003: Request is not pending approval.');
        }

        // Zéro Null / Strict Guard: Vérification d'unicité de l'admin
        const hasAlreadyApproved = request.approvals.some(a => a.adminId === secondAdminId);
        if (hasAlreadyApproved) {
            throw new Error('PAYOUT_004: Dual approval requires two distinct administrators.');
        }

        // Seconde signature
        const signature = await QuantumCrypto.sign(`APPROVE_${request.id}_${secondAdminId}`);
        request.approvals.push({
            adminId: secondAdminId,
            signatureHash: signature,
            timestamp: new Date().toISOString()
        });

        request.status = 'approved';

        NexusTelemetryService.emitAuditPulse('FINANCE', 'PAYOUT_DUAL_APPROVED', {
            requestId: request.id,
            secondAdminId
        });

        await this.executePayout(request, invoice, tenantId);

        return request;
    }

    /**
     * Exécute le paiement SEPA et suture le registre comptable.
     */
    private static async executePayout(request: PayoutRequest, invoice: PayoutInvoice, tenantId: string): Promise<void> {
        if (request.status !== 'approved') {
            throw new Error('PAYOUT_005: Cannot execute unapproved payout.');
        }

        request.status = 'processing';

        try {
            // Exécution du virement SCT SEPA via le Bridge BaaS
            const sepaRef = await FinancialNexusBridge.executeSepaTransfer(
                invoice.bankAccountIban, 
                request.amountInCents, 
                `INV-${invoice.id}`
            );

            request.sepaReference = sepaRef;
            request.status = 'completed';

            // Suture Financière: Extinction de la dette (Débit 401) et sortie de trésorerie (Crédit 512 / CASH)
            await SovereignLedger.getInstance(tenantId).recordTransfer({
                debitAccount: 'SUPPLIER_DEBT_401',
                creditAccount: 'CASH',
                amountInCents: request.amountInCents,
                referenceId: request.id,
                description: `Paiement fournisseur SEPA ${sepaRef}`
            });

            NexusTelemetryService.emitAuditPulse('FINANCE', 'PAYOUT_COMPLETED', {
                requestId: request.id,
                sepaRef
            });

        } catch (error) {
            request.status = 'failed';
            NexusTelemetryService.emitAuditPulse('FINANCE', 'PAYOUT_FAILED', {
                requestId: request.id,
                error: error instanceof Error ? error.message : 'Unknown SEPA error'
            });
            throw new Error('PAYOUT_006: SEPA Transfer Failed.');
        }
    }
}
