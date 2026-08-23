/**
 * POST /api/admin/mcc/tenants/scrape-charter
 *
 * Body : { websiteUrl: string, fallbackName?: string, siren?: string, forceVariant?: PlatformVariant }
 *
 * Preview côté MCC : extrait la charte graphique (couleur/logo/font) et le profil
 * d'entreprise depuis un site public, SANS provisionner. L'opérateur MCC valide
 * ensuite les valeurs proposées avant d'appeler `TenantProvisioningService.provisionNewClient()`
 * avec `websiteUrl` (qui rescrape) ou avec `branding` pré-rempli à partir du preview.
 *
 * Différence avec `/api/tenant/onboarding/auto-morphogenesis` :
 *  - cette route MCC est protégée par `requireMccLevel('mcc_support')` (opérateur flotte)
 *  - l'autre est protégée par `requireTenantUser` (opérateur intra-tenant)
 *  - même moteur de scrape en dessous — human-in-the-loop obligatoire dans les deux.
 *
 * Réponse (200) :
 *   {
 *     ok: true,
 *     profile: CompanyProfile,          // complet (identité, catalogue, branding, etc.)
 *     brandingOverlay: {                // extrait pour usage direct par provisioning
 *       primaryColor, secondaryColor?, logoUrl?, fontFamily?
 *     } | null,
 *   }
 *
 * Réponse (400) : erreurs sécurité SSRF / URL invalide / redirections excessives.
 * Réponse (500) : erreurs inattendues (page géante, timeout, parse crashé).
 */

import { NextRequest, NextResponse } from 'next/server';

import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';
import { scrapeCompany } from '@/modules/commerce';
import { tenantBrandingFromScrape } from '@/lib/tenantBrandingFromScrape';

export async function POST(req: NextRequest) {
    const caller = await requireMccLevel(req, 'mcc_support');
    if (isDenied(caller)) return caller;

    let body: {
        websiteUrl?: string;
        fallbackName?: string;
        siren?: string;
        forceVariant?: string;
    };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ ok: false, error: 'JSON body invalide' }, { status: 400 });
    }

    const { websiteUrl, fallbackName, siren, forceVariant } = body ?? {};
    if (!websiteUrl || typeof websiteUrl !== 'string') {
        return NextResponse.json(
            { ok: false, error: 'websiteUrl requis (string)' },
            { status: 400 },
        );
    }

    logger.info('[MCC/scrape-charter] Preview scrape', {
        operatorUid: caller.uid,
        websiteUrl,
    });

    try {
        const profile = await scrapeCompany({
            websiteUrl,
            fallbackName,
            siren,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            forceVariant: forceVariant as any,
        });
        const brandingOverlay = tenantBrandingFromScrape(profile);

        return NextResponse.json({
            ok: true,
            profile,
            brandingOverlay,
            note: brandingOverlay
                ? 'Overlay branding disponible — passez websiteUrl à provisionNewClient pour rescrape, ou pré-remplissez request.branding.'
                : 'Scrape sans branding exploitable (source=default). Le pipeline retombera sur request.branding.',
        });
    } catch (err) {
        const error = toError(err);
        const isSecurityBlock = /interdit|IP privée|Résolution DNS|Trop de redirections|URL invalide/i.test(
            error.message,
        );
        logger.warn('[MCC/scrape-charter] Scrape refusé', {
            operatorUid: caller.uid,
            error: error.message,
        });
        return NextResponse.json(
            { ok: false, error: error.message },
            { status: isSecurityBlock ? 400 : 500 },
        );
    }
}
