import { logger } from '@/lib/axiom';
import { StatementIngestionService } from '@/modules/finance';
import type { BankTransaction } from '@nexus/contracts';
import type {
    IOpenBankingProvider,
    OpenBankingAccount,
    OpenBankingConnectionToken,
    OpenBankingUserToken,
    WebhookEnvelope,
} from './types';

interface GCLTokenResponse {
    access: string;
    refresh: string;
    access_expires: number;
    refresh_expires: number;
}

interface GCLRequisition {
    id: string;
    link: string;
    accounts: string[];
    reference: string;
    status: string;
}

interface GCLAccountDetail {
    id: string;
    iban?: string;
    currency?: string;
    ownerName?: string;
    name?: string;
    resourceId?: string;
    institution_id?: string;
}

interface GCLBalance {
    balanceAmount: { amount: string; currency: string };
    balanceType: string;
}

interface GCLTransaction {
    transactionId?: string;
    bookingDate?: string;
    valueDate?: string;
    transactionAmount: { amount: string; currency: string };
    remittanceInformationUnstructured?: string;
    remittanceInformationStructured?: string;
}

/**
 * Implémentation GoCardless Bank Account Data (ex-Nordigen) de IOpenBankingProvider.
 * Sandbox gratuit et instantané — idéal pour valider le flux avant Powens prod.
 *
 * Variables d'env requises :
 *   GOCARDLESS_SECRET_ID   — Secret ID depuis GoCardless Developer Portal
 *   GOCARDLESS_SECRET_KEY  — Secret Key depuis GoCardless Developer Portal
 *   GOCARDLESS_API_URL     — défaut: https://bankaccountdata.gocardless.com/api/v2
 *
 * Institution sandbox : SANDBOXFINANCE_SFIN0000 (banque de test GoCardless)
 *
 * ⚠️ Les noms de champs GoCardless suivent la spec Berlin Group PSD2 — à revérifier
 * contre la doc GoCardless en vigueur avant mise en prod.
 */
export class GoCardlessProvider implements IOpenBankingProvider {
    readonly id = 'gocardless';
    readonly webhookSignatureHeader = 'authorization';

    private static API_URL = process.env.GOCARDLESS_API_URL ?? 'https://bankaccountdata.gocardless.com/api/v2';
    private static SANDBOX_INSTITUTION = process.env.GOCARDLESS_SANDBOX_INSTITUTION ?? 'SANDBOXFINANCE_SFIN0000';

    private static get SECRET_ID(): string {
        const s = process.env.GOCARDLESS_SECRET_ID;
        if (!s) throw new Error('❌ SÉCURITÉ : GOCARDLESS_SECRET_ID manquant — accès bancaire refusé.');
        return s;
    }

    private static get SECRET_KEY(): string {
        const s = process.env.GOCARDLESS_SECRET_KEY;
        if (!s) throw new Error('❌ SÉCURITÉ : GOCARDLESS_SECRET_KEY manquant — accès bancaire refusé.');
        return s;
    }

    isDemoMode(): boolean {
        return !process.env.GOCARDLESS_SECRET_ID || !process.env.GOCARDLESS_SECRET_KEY;
    }

    /** Authentification serveur → access_token court-terme. */
    private async authenticate(): Promise<string> {
        const res = await fetch(`${GoCardlessProvider.API_URL}/token/new/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({
                secret_id:  GoCardlessProvider.SECRET_ID,
                secret_key: GoCardlessProvider.SECRET_KEY,
            }),
        });
        if (!res.ok) {
            logger.error('GoCardlessProvider: authenticate failed', { status: res.status });
            throw new Error('Impossible d\'authentifier le serveur auprès de GoCardless.');
        }
        const data = await res.json() as GCLTokenResponse;
        return data.access;
    }

    /** Étape 1 : accès serveur → retourne l'access_token comme "token de connexion". */
    async createConnectionToken(tenantId: string): Promise<OpenBankingConnectionToken> {
        if (this.isDemoMode()) return { token: `gcl-demo-${tenantId}` };
        const accessToken = await this.authenticate();
        return { token: accessToken };
    }

    /**
     * Étape 2 : crée une réquisition GoCardless (lien bancaire) et retourne l'URL de la webview.
     * Le `state` signé est encodé dans le redirect_uri pour être récupéré au callback.
     * GoCardless appende `?ref=<requisition_id>` à l'URL de retour.
     */
    async getConnectionUrl(token: string, redirectUri: string, state: string): Promise<string> {
        if (this.isDemoMode()) {
            return `https://bankaccountdata.gocardless.com/psd2/start/demo-requisition/${GoCardlessProvider.SANDBOX_INSTITUTION}`;
        }

        // Encode le state dans le redirect_uri — GoCardless préserve les query params existants
        const redirectWithState = `${redirectUri}?state=${encodeURIComponent(state)}`;

        const res = await fetch(`${GoCardlessProvider.API_URL}/requisitions/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept:         'application/json',
                Authorization:  `Bearer ${token}`,
            },
            body: JSON.stringify({
                redirect:        redirectWithState,
                institution_id:  GoCardlessProvider.SANDBOX_INSTITUTION,
                reference:       state,
                user_language:   'FR',
                account_selection: false,
            }),
        });

        if (!res.ok) {
            logger.error('GoCardlessProvider: createRequisition failed', { status: res.status });
            throw new Error('Impossible de créer la réquisition bancaire GoCardless.');
        }
        const data = await res.json() as GCLRequisition;
        return data.link;
    }

    /**
     * Étape 3 : le callback reçoit `ref=<requisition_id>` de GoCardless.
     * On stocke le requisition_id comme "userToken" — c'est la clé d'accès aux comptes.
     */
    async exchangeCode(requisitionId: string): Promise<OpenBankingUserToken> {
        if (this.isDemoMode()) return { userToken: `gcl-user-demo-${requisitionId}` };
        // Le requisition_id IS le userToken pour GoCardless.
        return { userToken: requisitionId };
    }

    /** Récupère les comptes liés à la réquisition. */
    async getAccounts(userToken: string): Promise<OpenBankingAccount[]> {
        if (this.isDemoMode()) return [{
            id:         'demo-account-001',
            balance:    12_450.50,
            bankName:   'GoCardless Sandbox Finance',
            label:      'Compte courant pro — Restaurant Démo',
            currency:   'EUR',
            lastUpdate: new Date().toISOString(),
        }];

        const accessToken = await this.authenticate();

        // Récupérer les account IDs depuis la réquisition
        const reqRes = await fetch(`${GoCardlessProvider.API_URL}/requisitions/${userToken}/`, {
            headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
        });
        if (!reqRes.ok) {
            logger.error('GoCardlessProvider: getRequisition failed', { status: reqRes.status });
            throw new Error('Impossible de récupérer la réquisition bancaire.');
        }
        const requisition = await reqRes.json() as GCLRequisition;

        const accounts: OpenBankingAccount[] = [];
        for (const accountId of requisition.accounts ?? []) {
            const [detailRes, balanceRes] = await Promise.all([
                fetch(`${GoCardlessProvider.API_URL}/accounts/${accountId}/details/`, {
                    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
                }),
                fetch(`${GoCardlessProvider.API_URL}/accounts/${accountId}/balances/`, {
                    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
                }),
            ]);

            if (!detailRes.ok || !balanceRes.ok) continue;

            const detail  = (await detailRes.json() as { account?: GCLAccountDetail }).account;
            const balance = (await balanceRes.json() as { balances?: GCLBalance[] }).balances;

            const closingBalance = balance?.find(b => b.balanceType === 'closingBooked')
                ?? balance?.[0];

            accounts.push({
                id:         accountId,
                balance:    closingBalance ? parseFloat(closingBalance.balanceAmount.amount) : 0,
                bankName:   detail?.institution_id ?? 'GoCardless',
                label:      detail?.name ?? detail?.iban ?? accountId,
                currency:   closingBalance?.balanceAmount.currency ?? detail?.currency ?? 'EUR',
                lastUpdate: new Date().toISOString(),
            });
        }
        return accounts;
    }

    /** Récupère les transactions d'un compte depuis une date. */
    async getTransactions(
        accountId: string,
        _userToken: string,
        fromDate?: string
    ): Promise<Omit<BankTransaction, 'id'>[]> {
        if (this.isDemoMode()) {
            const today = new Date();
            const day = (offset: number) => {
                const d = new Date(today);
                d.setDate(d.getDate() - offset);
                return d.toISOString().slice(0, 10);
            };
            const demoTx: Array<{ date: string; label: string; amount: number }> = [
                { date: day(0),  label: 'ENCAISSEMENT CB JOUR',           amount:  +1_843.20 },
                { date: day(1),  label: 'METRO CASH AND CARRY LYON',      amount:    -612.40 },
                { date: day(1),  label: 'UBER EATS VIREMENT SEMAINE',     amount:    +387.60 },
                { date: day(2),  label: 'ENCAISSEMENT CB JOUR',           amount:  +2_104.80 },
                { date: day(3),  label: 'EDF PRO PRELEVEMENT',            amount:    -284.17 },
                { date: day(4),  label: 'LOYER LOCAL COMMERCIAL',         amount:  -3_200.00 },
                { date: day(5),  label: 'DELIVEROO RESTAURANT PAIEMENT',  amount:    +543.10 },
                { date: day(6),  label: 'TRANSGOURMET FOURNISSEUR',       amount:    -891.30 },
                { date: day(7),  label: 'ENCAISSEMENT CB JOUR',           amount:  +1_567.40 },
                { date: day(8),  label: 'ORANGE PRO TELEPHONIE',          amount:     -89.90 },
                { date: day(9),  label: 'METRO CASH AND CARRY LYON',      amount:    -445.60 },
                { date: day(10), label: 'ENCAISSEMENT CB JOUR',           amount:  +1_923.50 },
                { date: day(11), label: 'JUST EAT VIREMENT',             amount:    +276.80 },
                { date: day(12), label: 'MAIRIE TAXE TERRASSE',           amount:    -180.00 },
                { date: day(14), label: 'ENCAISSEMENT CB JOUR',           amount:  +2_340.00 },
            ];

            const out: Omit<BankTransaction, 'id'>[] = [];
            for (const tx of demoTx) {
                const skip = fromDate && tx.date < fromDate;
                if (skip) continue;
                const transaction: Omit<BankTransaction, 'id'> = {
                    date:          tx.date,
                    label:         tx.label,
                    amountInCents: Math.round(Math.abs(tx.amount) * 100),
                    type:          tx.amount >= 0 ? 'credit' : 'debit',
                    isReconciled:  false,
                    updatedAt:     new Date().toISOString(),
                };
                transaction.signature = await StatementIngestionService.generateSignature(transaction);
                out.push(transaction);
            }
            return out;
        }

        const accessToken = await this.authenticate();
        const params = fromDate ? `?date_from=${encodeURIComponent(fromDate)}` : '';
        const res = await fetch(
            `${GoCardlessProvider.API_URL}/accounts/${accountId}/transactions/${params}`,
            { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } }
        );
        if (!res.ok) {
            logger.error('GoCardlessProvider: getTransactions failed', { status: res.status, accountId });
            throw new Error('Impossible de récupérer les transactions GoCardless.');
        }

        const data = await res.json() as { transactions?: { booked?: GCLTransaction[]; pending?: GCLTransaction[] } };
        const booked = data.transactions?.booked ?? [];

        const out: Omit<BankTransaction, 'id'>[] = [];
        for (const tx of booked) {
            const rawAmount = parseFloat(tx.transactionAmount.amount);
            const label = tx.remittanceInformationUnstructured
                ?? tx.remittanceInformationStructured
                ?? 'Transaction';
            const transaction: Omit<BankTransaction, 'id'> = {
                date:          tx.bookingDate ?? tx.valueDate ?? new Date().toISOString().slice(0, 10),
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

    /** GoCardless n'a pas d'endpoint "refresh" explicite — l'auth se fait à chaque appel. */
    async refreshConnection(_userToken: string): Promise<void> {
        if (this.isDemoMode()) return;
        await this.authenticate();
    }

    normalizeWebhookPayload(raw: unknown): WebhookEnvelope {
        // GoCardless webhook: { id, created, organization, results: [{ id, status, ... }] }
        const p = raw as { results?: Array<{ status?: string; requisition_id?: string }> };
        const result = p.results?.[0];
        const event = result?.status === 'LN' ? 'connection.synced' : 'unknown';
        return { tenantId: undefined, event, raw };
    }
}
