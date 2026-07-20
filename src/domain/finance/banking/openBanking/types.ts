import type { BankTransaction } from '@nexus/contracts';

/**
 * 🏛️ Open Banking (PSD2 aggregation) — Grade X+++
 * Contrat commun à tous les agrégateurs bancaires (Powens, Tink, Bridge…).
 * Un tenant lit ainsi son propre compte bancaire externe (reconciliation),
 * à ne pas confondre avec IBankingProvider (BaaS — Swan — émission de comptes/cartes).
 */

export interface OpenBankingAccount {
    id: string;
    balance: number;
    bankName: string;
    label: string;
    currency: string;
    lastUpdate: string;
}

export interface OpenBankingConnectionToken {
    /** Jeton court-terme à injecter dans l'URL de la webview de connexion. */
    token: string;
    expiresAt?: number;
}

export interface OpenBankingUserToken {
    /** Jeton long-terme (persisté chiffré) permettant d'appeler getAccounts/getTransactions. */
    userToken: string;
    expiresAt?: number;
}

export interface WebhookEnvelope {
    /** tenantId normalisé (peut être absent si le provider ne l'inclut pas dans le payload). */
    tenantId?: string;
    /** Événement normalisé — toujours 'connection.synced' pour déclencher une sync. */
    event: string;
    /** Payload brut original pour debug / audit. */
    raw: unknown;
}

export interface IOpenBankingProvider {
    readonly id: string;

    /**
     * Nom du header HTTP portant la signature HMAC du webhook.
     * Ex: 'x-powens-signature', 'x-tink-signature', 'x-bridge-signature'.
     */
    readonly webhookSignatureHeader: string;

    /** True si aucun credential réel n'est configuré (mode sandbox/démo). */
    isDemoMode(): boolean;

    /** Étape 1 — jeton temporaire pour ouvrir la webview de connexion bancaire. */
    createConnectionToken(tenantId: string): Promise<OpenBankingConnectionToken>;

    /** Construit l'URL de la webview à partir du jeton temporaire + redirect_uri + state (anti-CSRF, porte le tenantId). */
    getConnectionUrl(token: string, redirectUri: string, state: string): string;

    /** Étape 2 — échange le code de callback contre un jeton utilisateur long-terme. */
    exchangeCode(code: string): Promise<OpenBankingUserToken>;

    /** Étape 3 — liste des comptes connectés pour ce jeton utilisateur. */
    getAccounts(userToken: string): Promise<OpenBankingAccount[]>;

    /** Étape 4 — transactions d'un compte depuis une date donnée. */
    getTransactions(
        accountId: string,
        userToken: string,
        fromDate?: string
    ): Promise<Omit<BankTransaction, 'id'>[]>;

    /** Force un rafraîchissement de la connexion côté agrégateur. */
    refreshConnection(userToken: string): Promise<void>;

    /**
     * Normalise le payload brut du webhook en enveloppe canonique.
     * Chaque provider a ses propres noms de champs — cette méthode fait le mapping.
     */
    normalizeWebhookPayload(raw: unknown): WebhookEnvelope;
}
