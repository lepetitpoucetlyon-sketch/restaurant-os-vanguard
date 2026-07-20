import { logger } from '@/lib/axiom';
import type {
    IOpenBankingProvider,
    OpenBankingAccount,
    OpenBankingConnectionToken,
    OpenBankingUserToken,
    WebhookEnvelope,
} from './types';
import type { BankTransaction } from '@nexus/contracts';

interface TinkAccountDTO {
    id: string;
    balance: { amount: { value: number; currencyCode: string } };
    name: string;
    financialInstitutionId: string;
}

interface TinkTransactionDTO {
    id: string;
    dates: { booked: string };
    descriptions: { display?: string; original?: string };
    amount: { value: { unscaledValue: number; scale: number }; currencyCode: string };
    type: string;
}

/**
 * Implémentation Tink (filiale Visa) de IOpenBankingProvider.
 *
 * Variables d'env requises :
 *   TINK_CLIENT_ID     — App ID Tink console
 *   TINK_CLIENT_SECRET — Secret Tink
 *   TINK_API_URL       — défaut: https://api.tink.com
 *
 * Doc: https://docs.tink.com/api
 *
 * ⚠️ Comme Powens, les noms de champs exacts sont à revérifier contre la doc
 * Tink en vigueur — l'API Tink v1 est stable mais les champs optionnels varient.
 */
export class TinkProvider implements IOpenBankingProvider {
    readonly id = 'tink';
    readonly webhookSignatureHeader = 'x-tink-signature';

    private static API_URL    = process.env.TINK_API_URL    ?? 'https://api.tink.com';
    private static CLIENT_ID  = process.env.TINK_CLIENT_ID;
    private static get CLIENT_SECRET(): string {
        const s = process.env.TINK_CLIENT_SECRET;
        if (!s) throw new Error('TINK_CLIENT_SECRET manquant — accès bancaire refusé.');
        return s;
    }

    isDemoMode(): boolean {
        return !TinkProvider.CLIENT_ID;
    }

    async createConnectionToken(tenantId: string): Promise<OpenBankingConnectionToken> {
        if (this.isDemoMode()) return { token: `tink-demo-${tenantId}` };

        const res = await fetch(`${TinkProvider.API_URL}/api/v1/oauth/token`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id:     TinkProvider.CLIENT_ID!,
                client_secret: TinkProvider.CLIENT_SECRET,
                grant_type:    'client_credentials',
                scope:         'authorization:read,authorization:grant',
            }),
        });
        if (!res.ok) {
            logger.error('TinkProvider: createConnectionToken failed', { status: res.status });
            throw new Error('Impossible d\'initialiser la connexion Tink.');
        }
        const data = await res.json() as { access_token: string; expires_in?: number };
        return {
            token:     data.access_token,
            expiresAt: data.expires_in ? Date.now() + data.expires_in * 1000 : undefined,
        };
    }

    getConnectionUrl(token: string, redirectUri: string, state: string): string {
        const base = `${TinkProvider.API_URL}/1.0/authorize`;
        return `${base}?client_id=${TinkProvider.CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=accounts:read,transactions:read&market=FR&locale=fr_FR&state=${state}&access_token=${token}`;
    }

    async exchangeCode(code: string): Promise<OpenBankingUserToken> {
        if (this.isDemoMode()) return { userToken: `tink-user-demo-${code}` };

        const res = await fetch(`${TinkProvider.API_URL}/api/v1/oauth/token`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id:     TinkProvider.CLIENT_ID!,
                client_secret: TinkProvider.CLIENT_SECRET,
                grant_type:    'authorization_code',
                code,
            }),
        });
        if (!res.ok) {
            logger.error('TinkProvider: exchangeCode failed', { status: res.status });
            throw new Error('Impossible de finaliser la connexion Tink.');
        }
        const data = await res.json() as { access_token: string; expires_in?: number };
        return {
            userToken: data.access_token,
            expiresAt: data.expires_in ? Date.now() + data.expires_in * 1000 : undefined,
        };
    }

    async getAccounts(userToken: string): Promise<OpenBankingAccount[]> {
        if (this.isDemoMode()) return [];

        const res = await fetch(`${TinkProvider.API_URL}/data/v2/accounts`, {
            headers: { Authorization: `Bearer ${userToken}` },
        });
        if (!res.ok) throw new Error('TinkProvider: getAccounts failed');

        const data = await res.json() as { accounts?: TinkAccountDTO[] };
        return (data.accounts ?? []).map(acc => ({
            id:         acc.id,
            balance:    acc.balance.amount.value,
            bankName:   acc.financialInstitutionId,
            label:      acc.name,
            currency:   acc.balance.amount.currencyCode,
            lastUpdate: new Date().toISOString(),
        }));
    }

    async getTransactions(accountId: string, userToken: string, fromDate?: string): Promise<Omit<BankTransaction, 'id'>[]> {
        if (this.isDemoMode()) return [];

        const params = new URLSearchParams({ accountIdIn: accountId });
        if (fromDate) params.set('bookedDateGte', fromDate);

        const res = await fetch(`${TinkProvider.API_URL}/data/v2/transactions?${params}`, {
            headers: { Authorization: `Bearer ${userToken}` },
        });
        if (!res.ok) throw new Error('TinkProvider: getTransactions failed');

        const data  = await res.json() as { transactions?: TinkTransactionDTO[] };
        const { StatementIngestionService } = await import('@/modules/finance/accounting/domain/StatementIngestionService');

        const out: Omit<BankTransaction, 'id'>[] = [];
        for (const tx of data.transactions ?? []) {
            const rawAmount  = tx.amount.value.unscaledValue / Math.pow(10, tx.amount.value.scale);
            const label      = tx.descriptions.display ?? tx.descriptions.original ?? 'Transaction';
            const transaction: Omit<BankTransaction, 'id'> = {
                date:          tx.dates.booked,
                label,
                amountInCents: Math.round(Math.abs(rawAmount) * 100),
                type:          rawAmount >= 0 ? 'credit' : 'debit',
                isReconciled:  false,
                updatedAt:     new Date().toISOString(),
            };
            transaction.signature = await StatementIngestionService.generateSignature(transaction);
            out.push(transaction);
        }
        return out;
    }

    async refreshConnection(userToken: string): Promise<void> {
        if (this.isDemoMode()) return;
        await fetch(`${TinkProvider.API_URL}/api/v1/credentials/refresh`, {
            method:  'POST',
            headers: { Authorization: `Bearer ${userToken}`, 'Content-Type': 'application/json' },
        });
    }

    normalizeWebhookPayload(raw: unknown): WebhookEnvelope {
        // Tink webhook: { event: "account:updated", content: { credentialsId, userId } }
        const p = raw as { event?: string; content?: { userId?: string } };
        const event = p.event === 'account:updated' ? 'connection.synced' : (p.event ?? 'unknown');
        return { tenantId: undefined, event, raw };
    }
}
