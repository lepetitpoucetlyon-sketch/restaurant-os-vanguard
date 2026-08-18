import type { IBankingProvider, KYBData, BankAccount, VirtualCard } from './types';
import { SwanProvider } from './providers/SwanProvider';
import { NexusTelemetryService } from '@/lib/NexusTelemetryService';

/**
 * 🏛️ FinancialNexusBridge - Grade X+++
 * Interface principale unifiée pour les opérations bancaires BaaS.
 */
export class BankingNexusBridge {
    private static provider: IBankingProvider = new SwanProvider(); // Injection de dépendance basique

    /**
     * Initialisation KYB (Know Your Business) du Vassal.
     */
    static async createAccount(tenantId: string, kyb: KYBData): Promise<BankAccount> {
        NexusTelemetryService.emitAuditPulse('FINANCE', 'BAAS_ACCOUNT_CREATION_STARTED', { tenantId });
        const account = await this.provider.createAccount(tenantId, kyb);
        NexusTelemetryService.emitAuditPulse('FINANCE', 'BAAS_ACCOUNT_CREATION_SUCCESS', { accountId: account.id });
        return account;
    }

    /**
     * Récupère le solde disponible en temps réel
     */
    static async getBalance(accountId: string = 'default'): Promise<number> {
        return this.provider.getBalance(accountId);
    }

    /**
     * Exécute un virement SEPA SCT
     */
    static async executeSepaTransfer(iban: string, amountInCents: number, reference: string): Promise<string> {
        return this.provider.executeSepaTransfer(iban, amountInCents, reference);
    }

    /**
     * Émet une carte virtuelle plafonnée par Pillar
     */
    static async issueVirtualCard(accountId: string, pillarId: string, limitInCents: number): Promise<VirtualCard> {
        // Le PillarId assure que la carte ne peut être utilisée que pour les dépenses de ce pilier.
        const card = await this.provider.issueVirtualCard(accountId, pillarId, limitInCents);
        NexusTelemetryService.emitAuditPulse('FINANCE', 'BAAS_VIRTUAL_CARD_ISSUED', { 
            cardId: card.id, 
            pillarId, 
            limitInCents 
        });
        return card;
    }
}
