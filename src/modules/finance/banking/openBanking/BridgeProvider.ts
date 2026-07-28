import type {
    IOpenBankingProvider,
    OpenBankingAccount,
    OpenBankingConnectionToken,
    OpenBankingUserToken,
    WebhookEnvelope,
} from './types';
import type { BankTransaction } from '@nexus/contracts';
import { logger } from '@/lib/logger';

const BRIDGE_BASE = 'https://api.bridgeapi.io/v2';

/**
 * Bridge by Bankin' — API similaire à Powens.
 * Variables requises : BRIDGE_CLIENT_ID, BRIDGE_CLIENT_SECRET
 * Doc : https://docs.bridgeapi.io/
 */
export class BridgeProvider implements IOpenBankingProvider {
    readonly id = 'bridge';
    readonly webhookSignatureHeader = 'x-bridge-signature';

    isDemoMode(): boolean {
        return !process.env.BRIDGE_CLIENT_ID || process.env.BRIDGE_CLIENT_ID.startsWith('test_');
    }

    async createConnectionToken(_tenantId: string): Promise<OpenBankingConnectionToken> {
        const res = await this.fetch<{ access_token: string; expires_at: number }>(
            '/auth/token', { method: 'POST' }
        );
        return { token: res.access_token, expiresAt: res.expires_at };
    }

    async getConnectionUrl(token: string, redirectUri: string, state: string): Promise<string> {
        return `https://connect.bridgeapi.io/v2/connect?access_token=${token}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
    }

    async exchangeCode(code: string): Promise<OpenBankingUserToken> {
        const res = await this.fetch<{ access_token: string; expires_at: number }>(
            '/auth/token', { method: 'POST', body: JSON.stringify({ code }) }
        );
        return { userToken: res.access_token, expiresAt: res.expires_at };
    }

    async getAccounts(userToken: string): Promise<OpenBankingAccount[]> {
        const res = await this.fetch<{ resources: Array<Record<string, unknown>> }>(
            '/accounts', {}, userToken
        );
        return res.resources.map(a => ({
            id:         String(a['id'] ?? ''),
            balance:    Number(a['balance'] ?? 0),
            bankName:   String((a['bank'] as Record<string, unknown> | undefined)?.['name'] ?? ''),
            label:      String(a['name'] ?? ''),
            currency:   String(a['currency_code'] ?? 'EUR'),
            lastUpdate: String(a['updated_at'] ?? ''),
        }));
    }

    async getTransactions(
        accountId: string,
        userToken: string,
        fromDate?: string
    ): Promise<Omit<BankTransaction, 'id'>[]> {
        const query = fromDate ? `?since=${fromDate}` : '';
        const res   = await this.fetch<{ resources: Array<Record<string, unknown>> }>(
            `/accounts/${accountId}/transactions${query}`, {}, userToken
        );
        return res.resources.map(t => {
            const amount = Number(t['amount'] ?? 0);
            return {
                date:           String(t['date'] ?? ''),
                label:          String(t['description'] ?? ''),
                amount,
                amountInCents:  Math.round(amount * 100),
                type:           amount >= 0 ? 'credit' : 'debit',
                isReconciled:   false,
                updatedAt:      new Date().toISOString(),
                currency:       String(t['currency_code'] ?? 'EUR'),
                accountId,
                category:       (t['category'] as Record<string, unknown> | undefined)?.['name']
                                    ? String((t['category'] as Record<string, unknown>)['name'])
                                    : undefined,
            };
        });
    }

    async refreshConnection(_userToken: string): Promise<void> {
        logger.info('[BridgeProvider] refreshConnection');
    }

    normalizeWebhookPayload(raw: unknown): WebhookEnvelope {
        const payload = raw as Record<string, unknown>;
        return {
            tenantId: payload['user_uuid'] ? String(payload['user_uuid']) : undefined,
            event:    'connection.synced',
            raw,
        };
    }

    private async fetch<T>(path: string, options: RequestInit = {}, userToken?: string): Promise<T> {
        const clientId     = process.env.BRIDGE_CLIENT_ID ?? '';
        const clientSecret = process.env.BRIDGE_CLIENT_SECRET ?? '';
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Bridge-Version': '2021-06-01',
            'Client-Id':      clientId,
            'Client-Secret':  clientSecret,
        };
        if (userToken) headers['Authorization'] = `Bearer ${userToken}`;
        const res = await fetch(`${BRIDGE_BASE}${path}`, { ...options, headers });
        if (!res.ok) throw new Error(`Bridge ${path} → ${res.status}`);
        return res.json() as Promise<T>;
    }
}
