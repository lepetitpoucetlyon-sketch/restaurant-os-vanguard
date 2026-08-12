import type {
    IOpenBankingProvider,
    OpenBankingAccount,
    OpenBankingConnectionToken,
    OpenBankingUserToken,
    WebhookEnvelope,
} from './types';
import type { BankTransaction } from '@nexus/contracts';
import { logger } from '@/lib/logger';
import { JsonObject } from "@/lib/types/json";

const QONTO_BASE = 'https://thirdparty.qonto.com/v2';

/**
 * Qonto — API directe (sans agrégateur), très bien documentée.
 * Variables requises : QONTO_LOGIN, QONTO_SECRET_KEY (pas d'OAuth complexe)
 * Doc : https://api-doc.qonto.com/
 */
export class QontoProvider implements IOpenBankingProvider {
    readonly id = 'qonto';
    readonly webhookSignatureHeader = 'x-qonto-signature';

    isDemoMode(): boolean {
        return !process.env.QONTO_SECRET_KEY;
    }

    async createConnectionToken(_tenantId: string): Promise<OpenBankingConnectionToken> {
        return { token: 'qonto-direct', expiresAt: Date.now() + 3600 * 1000 };
    }

    async getConnectionUrl(_token: string, _redirectUri: string, _state: string): Promise<string> {
        return 'https://app.qonto.com/signin';
    }

    async exchangeCode(_code: string): Promise<OpenBankingUserToken> {
        return { userToken: `${process.env.QONTO_LOGIN}:${process.env.QONTO_SECRET_KEY}` };
    }

    async getAccounts(_userToken: string): Promise<OpenBankingAccount[]> {
        const res = await this.fetch<{ organization: { bank_accounts: Array<Record<string, unknown>> } }>(
            '/organization'
        );
        return (res.organization.bank_accounts ?? []).map(a => ({
            id:         String(a['slug'] ?? ''),
            balance:    Number(a['balance_cents'] ?? 0) / 100,
            bankName:   'Qonto',
            label:      String(a['name'] ?? ''),
            currency:   String(a['currency'] ?? 'EUR'),
            lastUpdate: String(a['updated_at'] ?? ''),
        }));
    }

    async getTransactions(
        accountId: string,
        _userToken: string,
        fromDate?: string
    ): Promise<Omit<BankTransaction, 'id'>[]> {
        const query = fromDate ? `&settled_at_from=${fromDate}` : '';
        const res   = await this.fetch<{ transactions: Array<Record<string, unknown>> }>(
            `/transactions?bank_account_slug=${accountId}&per_page=100${query}`
        );
        return res.transactions.map(t => {
            const amountRaw = Number(t['amount_cents'] ?? 0) / 100;
            const amount    = t['side'] === 'debit' ? -amountRaw : amountRaw;
            return {
                date:          String(t['settled_at'] ?? t['emitted_at'] ?? ''),
                label:         String(t['label'] ?? ''),
                amount,
                amountInMicrounits: Math.round(amount * 1_000_000),
                amountInCents: Math.round(amount * 100),
                type:          t['side'] === 'credit' ? 'credit' : 'debit',
                isReconciled:  false,
                updatedAt:     new Date().toISOString(),
                currency:      String(t['currency'] ?? 'EUR'),
                accountId,
            };
        });
    }

    async refreshConnection(_userToken: string): Promise<void> {
        logger.info('[QontoProvider] refreshConnection (noop — direct API)');
    }

    normalizeWebhookPayload(raw: unknown): WebhookEnvelope {
        const payload = raw as JsonObject;
        return {
            event:    'connection.synced',
            raw,
            tenantId: payload['organization_slug'] ? String(payload['organization_slug']) : undefined,
        };
    }

    private async fetch<T>(path: string): Promise<T> {
        const login  = process.env.QONTO_LOGIN ?? '';
        const secret = process.env.QONTO_SECRET_KEY ?? '';
        const res    = await fetch(`${QONTO_BASE}${path}`, {
            headers: {
                'Authorization': `${login}:${secret}`,
                'Content-Type':  'application/json',
            },
        });
        if (!res.ok) throw new Error(`Qonto ${path} → ${res.status}`);
        return res.json() as Promise<T>;
    }
}
