/**
 * POST /api/tenant/onboarding/auto-morphogenesis
 * Body: { websiteUrl?: string, businessName?: string, siren?: string, forceVariant?: PlatformVariant }
 *
 * Retourne un `CompanyProfile` (Zod) issu du scrape RÉEL du site public de
 * l'entreprise (identité, catalogue, branding, signaux de secteur, confidence).
 *
 * ⚠️ NOUVELLE SÉMANTIQUE (P0 dé-stubbing) — 2026-08-22 :
 *  L'ancien `DigitalDnaCrawlerService` couplait scrape + provisioning en un seul
 *  appel (auto-provision silencieux sur données inférées). Cette route est
 *  désormais **PREVIEW-ONLY** : elle expose ce que l'agent a compris, l'opérateur
 *  valide/corrige côté UI, puis un endpoint séparé de confirmation (à créer en P2
 *  avec le QualificationEngine) déclenche `TenantSeeder.seed(...)` sur les
 *  données validées. C'est la règle du human-in-the-loop (frontière sécurité
 *  onboarding — cf. MEGA-PLAN Forge Stack §C.1.3).
 */
import { NextRequest, NextResponse } from 'next/server';

import { requireTenantUser, isDenied } from '@/lib/server/adminAuthGuard';
import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';
import { scrapeCompany } from '@/modules/commerce';

export async function POST(req: NextRequest) {
    const caller = await requireTenantUser(req);
    if (isDenied(caller)) return caller;

    try {
        const body = await req.json();
        const { websiteUrl, businessName, siren, forceVariant } = body ?? {};

        logger.info('[auto-morphogenesis] Preview scrape', {
            tenantId: caller.tenantId,
            websiteUrl,
        });

        const profile = await scrapeCompany({
            websiteUrl,
            fallbackName: businessName,
            siren,
            forceVariant,
        });

        return NextResponse.json({
            ok: true,
            profile,
            note: 'Preview scrape (P0). Ce profil n\'est PAS provisionné : validez-le puis appelez l\'endpoint de confirmation.',
        });
    } catch (err) {
        // Les erreurs SSRF/protocole sont VOLONTAIRES : on les remonte en 400 pour que l'opérateur voit ce qu'il s'est passé.
        const error = toError(err);
        const isSecurityBlock = /interdit|IP privée|Résolution DNS|Trop de redirections|URL invalide/.test(error.message);
        logger.warn('[auto-morphogenesis] Scrape refusé', { error: error.message });
        return NextResponse.json(
            { ok: false, error: error.message },
            { status: isSecurityBlock ? 400 : 500 },
        );
    }
}
