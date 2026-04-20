export interface IntegrationSettings {
    id: string;
    name: string;
    provider: string;
    apiKey?: string;
    environment: 'sandbox' | 'production' | string;
    isActive: boolean;
    lastSyncDate?: string;
    webhookUrl?: string;
}

export interface IntegrationsConfig {
    stripePublicKey: string;
    stripeSecretKey: string;
    stripeWebhookSecret: string;
    webhooks: {
        id: string;
        event: string;
        url: string;
        isActive: boolean;
    }[];
}
