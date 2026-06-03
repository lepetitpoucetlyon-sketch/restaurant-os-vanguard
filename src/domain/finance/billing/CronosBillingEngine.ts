import { BillingSubscription, BillingEvent } from './types';
import { SovereignLedger } from '@/domain/services/SovereignLedger';
import { NexusTelemetryService } from '@/domain/services/NexusTelemetryService';
import { EscalationEngine } from '@/domain/finance/collection/EscalationEngine';
import { InvoiceTarget } from '@/domain/finance/collection/types';
import { CollectionService } from '@/domain/finance/collection/CollectionService';

/**
 * 🏛️ CronosBillingEngine - Grade X+++
 * Moteur de facturation récurrente avec logique de retry asynchrone (J+1, J+3).
 */
export class CronosBillingEngine {
    
    /**
     * Traite un lot d'abonnements dus à la date du jour.
     */
    static async processDueSubscriptions(subscriptions: BillingSubscription[], currentDate: Date = new Date()): Promise<BillingEvent[]> {
        const events: BillingEvent[] = [];

        for (const sub of subscriptions) {
            if (sub.status !== 'active') continue;

            const isDue = this.isSubscriptionDue(sub, currentDate);
            if (!isDue) continue;

            try {
                // 1. Tentative de charge (Simulée pour le module)
                await this.chargeSubscription(sub);

                // 2. Suture Financière: Reconnaissance du revenu et entrée en trésorerie
                await SovereignLedger.getInstance(sub.tenantId).recordTransfer({
                    debitAccount: 'CASH',
                    creditAccount: 'SALES',
                    amountInCents: sub.amountInCents,
                    referenceId: `SUB-${sub.id}-${currentDate.getTime()}`,
                    description: `Paiement abonnement #${sub.id}`
                });

                // 3. Mise à jour de l'abonnement en cas de succès
                sub.consecutiveFailures = 0;
                this.advanceBillingDate(sub);

                events.push({
                    subscriptionId: sub.id,
                    status: 'success',
                    amountChargedInCents: sub.amountInCents,
                    timestamp: new Date().toISOString()
                });

                NexusTelemetryService.emitAuditPulse('FINANCE', 'BILLING_SUCCESS', { subscriptionId: sub.id });

            } catch (error) {
                // Gestion de l'échec (Logique de Retry Grade X)
                sub.consecutiveFailures += 1;
                
                const event: BillingEvent = {
                    subscriptionId: sub.id,
                    status: 'failed',
                    amountChargedInCents: 0,
                    timestamp: new Date().toISOString(),
                    failureReason: error instanceof Error ? error.message : 'Charge failed'
                };
                events.push(event);

                await this.handleBillingFailure(sub, currentDate);
            }
        }

        return events;
    }

    /**
     * 🛡️ Logique de Retry Grade X
     */
    private static async handleBillingFailure(sub: BillingSubscription, currentDate: Date): Promise<void> {
        NexusTelemetryService.emitAuditPulse('FINANCE', 'BILLING_FAILED', {
            subscriptionId: sub.id,
            failureCount: sub.consecutiveFailures
        });

        // Retry J+1
        if (sub.consecutiveFailures === 1) {
            this.setNextRetryDate(sub, currentDate, 1);
            return;
        }

        // Retry J+3 (Échec J+1 -> J+3)
        if (sub.consecutiveFailures === 2) {
            this.setNextRetryDate(sub, currentDate, 2); // 1 + 2 jours = J+3 global
            return;
        }

        // Si Échec J+3 (soit 3 failures) -> Transfert à ThemisCollector & Suspension
        if (sub.consecutiveFailures >= 3) {
            sub.status = 'suspended';
            
            // Conversion de l'abonnement en facture en retard pour ThemisCollector
            const fakeInvoice: InvoiceTarget = {
                id: `INV-SUB-${sub.id}`,
                customerId: sub.customerId,
                customerEmail: 'customer@example.com', // A résoudre via le CRM dans le monde réel
                customerPhone: '+3300000000',
                dueDate: currentDate, // La date actuelle sert de point de départ pour l'escalade
                amountOwedInCents: sub.amountInCents,
                status: 'overdue',
                optOutCollection: false
            };

            NexusTelemetryService.emitAuditPulse('FINANCE', 'BILLING_SUSPENDED', {
                subscriptionId: sub.id,
                reason: 'Max failures reached. Transferring to ThemisCollector.'
            });

            // Injection directe dans le collecteur niveau 1 (Friendly Reminder immédiat)
            await CollectionService.processOverdueInvoices([fakeInvoice], sub.tenantId);
        }
    }

    private static isSubscriptionDue(sub: BillingSubscription, currentDate: Date): boolean {
        const nextDate = typeof sub.nextBillingDate === 'string' ? new Date(sub.nextBillingDate) : sub.nextBillingDate;
        // Zéro native operator sur le temps si possible, mais ici c'est du timestamp standard.
        return currentDate.getTime() >= nextDate.getTime();
    }

    private static advanceBillingDate(sub: BillingSubscription): void {
        const date = typeof sub.nextBillingDate === 'string' ? new Date(sub.nextBillingDate) : sub.nextBillingDate;
        if (sub.billingCycle === 'monthly') {
            date.setMonth(date.getMonth() + 1);
        } else {
            date.setFullYear(date.getFullYear() + 1);
        }
        sub.nextBillingDate = date.toISOString();
    }

    private static setNextRetryDate(sub: BillingSubscription, currentDate: Date, daysToAdd: number): void {
        const retryDate = new Date(currentDate);
        retryDate.setDate(retryDate.getDate() + daysToAdd);
        sub.nextBillingDate = retryDate.toISOString();
    }

    private static async chargeSubscription(sub: BillingSubscription): Promise<void> {
        // Stub: Simulation de charge Stripe/Swan.
        // Génère aléatoirement un échec pour tester la boucle de retry.
        if (Math.random() < 0.2) {
            throw new Error('Payment gateway declined the card.');
        }
    }
}
