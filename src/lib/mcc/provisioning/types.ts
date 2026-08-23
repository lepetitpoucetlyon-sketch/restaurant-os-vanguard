import type { PlatformVariant } from '@/modules/system';

export interface ProvisioningRequest {
    ownerEmail: string;
    ownerName: string;
    companyName: string;
    siret: string;
    planId: 'STANDARD' | 'PREMIUM';
    variant?: PlatformVariant;
    branding: {
        primaryColor: string;
        logoUrl?: string;
    };
    /**
     * URL publique du site du client (facultative). Si fournie, le pipeline MCC
     * appelle `scrapeCompany({websiteUrl})` puis `tenantBrandingFromScrape(profile)`
     * pour dériver un overlay branding réel (couleur/logo/font/couleur secondaire).
     *
     * L'overlay REMPLACE `branding.primaryColor / logoUrl` de la request s'il aboutit.
     * En cas d'échec du scrape (SSRF / timeout / page vide), on retombe silencieusement
     * sur `branding.*` — jamais d'exception au caller. C'est du best-effort, pas un
     * bloquant.
     *
     * Human-in-the-loop : pour la CRÉATION interactive depuis le MCC, préférer
     * d'abord un preview via `POST /api/admin/mcc/tenants/scrape-charter` puis
     * confirmer côté opérateur avant d'appeler `provisionNewClient()`.
     */
    websiteUrl?: string;
}

export interface ProvisioningResult {
    tenantId: string;
    ownerId: string;
    stripeCustomerId: string;
    ragWorkspaceId: string;
    status: 'SUCCESS' | 'FAILED';
}
