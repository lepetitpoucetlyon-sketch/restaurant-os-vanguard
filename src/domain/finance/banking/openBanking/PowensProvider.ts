import { logger } from '@/lib/axiom';
import { StatementIngestionService } from '@/modules/finance/accounting/domain/StatementIngestionService';
import type { BankTransaction } from '@nexus/contracts';
import type {
    IOpenBankingProvider,
    OpenBankingAccount,
    OpenBankingConnectionToken,
    OpenBankingUserToken,
} from './types';

interface PowensAccountDTO {
    id: number | string;
    balance: number;
    currency?: { id?: string } | string;
    name?: string;
    connection?: { bank?: { name?: string } };
}

interface PowensTransactionDTO {
    id: number | string;
    date: string;
    original_wording?: string;
    wording?: string;
    value: number;
}

/**
 * Implémentation Powens (ex-Budget Insight) de l'agrégateur PSD2.
 * Un tenant restera libre de brancher un autre agrégateur (Tink, Bridge…) en
 * ajoutant une classe qui implémente IOpenBankingProvider — aucun call site
 * (routes API, UI) ne dépend directement de Powens.
 *
 * ⚠️ Les noms de champs exacts de l'API Powens (auth/token, users/me/accounts…)
 * doivent être revérifiés contre la doc Powens en vigueur avant mise en prod —
 * cette implémentation suit la forme documentée publiquement au moment de l'écriture,
 * mais Powens fait évoluer son contrat régulièrement.
 */
export class PowensProvider implements IOpenBankingProvider {
    readonly id = 'powens';
    readonly webhookSignatureHeader = 'x-powens-signature';

    private static API_URL = process.env.POWENS_API_URL ?? 'https://sandbox.biapi.pro/2.0';
    private static CLIENT_ID = process.env.POWENS_CLIENT_ID ?? process.env.NEXT_PUBLIC_POWENS_CLIENT_ID;

    private static get CLIENT_SECRET(): string {
        const secret = process.env.POWENS_CLIENT_SECRET;
        if (!secret) {
            throw new Error('❌ SÉCURITÉ : POWENS_CLIENT_SECRET manquant. Accès bancaire refusé.');
        }
        return secret;
    }

    isDemoMode(): boolean {
        const clientId = PowensProvider.CLIENT_ID;
        return !clientId || clientId.includes('placeholder') || clientId === 'restaurant-os-master';
    }

    async createConnectionToken(tenantId: string): Promise<OpenBankingConnectionToken> {
        if (this.isDemoMode()) {
            return { token: `demo-token-${tenantId}` };
        }
        const res = await fetch(`${PowensProvider.API_URL}/auth/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: PowensProvider.CLIENT_ID!,
                client_secret: PowensProvider.CLIENT_SECRET,
                grant_type: 'client_credentials',
            }),
        });
        if (!res.ok) {
            logger.error('PowensProvider: createConnectionToken failed', { status: res.status });
            throw new Error('Impossible d\'initialiser la connexion bancaire.');
        }
        const data = (await res.json()) as { access_token: string; expires_in?: number };
        return {
            token: data.access_token,
            expiresAt: data.expires_in ? Date.now() + data.expires_in * 1000 : undefined,
        };
    }

    getConnectionUrl(token: string, redirectUri: string, state: string): string {
        const baseUrl = this.isDemoMode()
            ? 'https://restaurant-os-sandbox.biapi.pro/2.0/manage/connect'
            : `${PowensProvider.API_URL}/manage/connect`;
        const params = new URLSearchParams({
            client_id: PowensProvider.CLIENT_ID ?? '',
            token,
            redirect_uri: redirectUri,
            state,
        });
        return `${baseUrl}?${params.toString()}`;
    }

    async exchangeCode(code: string): Promise<OpenBankingUserToken> {
        if (this.isDemoMode()) {
            return { userToken: `demo-user-token-${code}` };
        }
        const res = await fetch(`${PowensProvider.API_URL}/auth/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: PowensProvider.CLIENT_ID!,
                client_secret: PowensProvider.CLIENT_SECRET,
                grant_type: 'authorization_code',
                code,
            }),
        });
        if (!res.ok) {
            logger.error('PowensProvider: exchangeCode failed', { status: res.status });
            throw new Error('Impossible de finaliser la connexion bancaire.');
        }
        const data = (await res.json()) as { access_token: string; expires_in?: number };
        return {
            userToken: data.access_token,
            expiresAt: data.expires_in ? Date.now() + data.expires_in * 1000 : undefined,
        };
    }

    async getAccounts(userToken: string): Promise<OpenBankingAccount[]> {
        if (this.isDemoMode()) return [];
        const res = await fetch(`${PowensProvider.API_URL}/users/me/accounts`, {
            headers: { Authorization: `Bearer ${userToken}` },
        });
        if (!res.ok) {
            logger.error('PowensProvider: getAccounts failed', { status: res.status });
            throw new Error('Impossible de récupérer les comptes bancaires.');
        }
        const data = (await res.json()) as { accounts?: PowensAccountDTO[] };
        return (data.accounts ?? []).map((acc) => ({
            id: String(acc.id),
            balance: acc.balance,
            bankName: acc.connection?.bank?.name ?? 'Banque inconnue',
            label: acc.name ?? 'Compte',
            currency: typeof acc.currency === 'string' ? acc.currency : (acc.currency?.id ?? 'EUR'),
            lastUpdate: new Date().toISOString(),
        }));
    }

    async getTransactions(
        accountId: string,
        userToken: string,
        fromDate?: string
    ): Promise<Omit<BankTransaction, 'id'>[]> {
        if (this.isDemoMode()) return [];
        const params = fromDate ? `?min_date=${encodeURIComponent(fromDate)}` : '';
        const res = await fetch(
            `${PowensProvider.API_URL}/users/me/accounts/${accountId}/transactions${params}`,
            { headers: { Authorization: `Bearer ${userToken}` } }
        );
        if (!res.ok) {
            logger.error('PowensProvider: getTransactions failed', { status: res.status, accountId });
            throw new Error('Impossible de récupérer les transactions bancaires.');
        }
        const data = (await res.json()) as { transactions?: PowensTransactionDTO[] };
        const out: Omit<BankTransaction, 'id'>[] = [];
        for (const tx of data.transactions ?? []) {
            const label = tx.wording ?? tx.original_wording ?? 'Transaction';
            const transaction: Omit<BankTransaction, 'id'> = {
                date: tx.date,
                label,
                amountInCents: Math.round(Math.abs(tx.value) * 100),
                type: tx.value >= 0 ? 'credit' : 'debit',
                isReconciled: false,
                updatedAt: new Date().toISOString(),
            };
            transaction.signature = await StatementIngestionService.generateSignature(transaction);
            out.push(transaction);
        }
        return out;
    }

    normalizeWebhookPayload(raw: unknown): import('./types').WebhookEnvelope {
        const p = raw as { tenant_id?: string; event?: string };
        return {
            tenantId: p.tenant_id,
            event:    p.event ?? 'unknown',
            raw,
        };
    }

    async refreshConnection(userToken: string): Promise<void> {
        if (this.isDemoMode()) return;
        const res = await fetch(`${PowensProvider.API_URL}/users/me/connections`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${userToken}`, 'Content-Type': 'application/json' },
        });
        if (!res.ok) {
            logger.error('PowensProvider: refreshConnection failed', { status: res.status });
            throw new Error('Erreur Powens lors de la synchronisation.');
        }
    }
}
