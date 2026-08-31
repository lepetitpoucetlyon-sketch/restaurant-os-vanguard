/**
 * GET  /api/tenant/custom-domain  — statut domaine + instructions CNAME
 * POST /api/tenant/custom-domain  — enregistrer un domaine personnalisé
 * DELETE /api/tenant/custom-domain — supprimer le domaine personnalisé
 *
 * Le tenant peut apporter son propre domaine (bistro.com) qui pointe vers
 * l'app via un CNAME. Le MCC peut aussi le faire via POST en passant tenantId.
 *
 * Stockage Nexus :
 *   tenants/{tenantId}/tenantConfig.customDomain   → domaine enregistré
 *   platform/customDomains/{encodedDomain}         → { tenantId, slug, createdAt }
 *
 * Instructions CNAME à communiquer au restaurateur :
 *   bistro.com → CNAME → {slug}.restaurantos.app
 */
import 'server-only';
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireTenantAdmin, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import type { JsonObject } from "@/shared/types/json";

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'restaurantos.app';

function encodeDomainKey(domain: string) {
  return domain.replace(/\./g, '__');
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const caller = await requireTenantAdmin(req);
  if (isDenied(caller)) return caller as NextResponse;
  const { tenantId } = caller as { tenantId: string };

  const config = await Nexus.adapter.get(`tenants/${tenantId}/tenantConfig`) as JsonObject | null;
  const customDomain = (config?.customDomain as string | undefined) ?? null;
  const slug = (config?.slug as string | undefined) ?? tenantId;
  const cnameTarget = `${slug}.${APP_DOMAIN}`;

  return NextResponse.json({
    customDomain,
    cnameTarget,
    instructions: customDomain
      ? `Vérifiez que ${customDomain} a un enregistrement CNAME → ${cnameTarget}`
      : `Créez un CNAME : votre-domaine.com → ${cnameTarget}`,
  });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const caller = await requireTenantAdmin(req);
  if (isDenied(caller)) return caller as NextResponse;
  const { tenantId } = caller as { tenantId: string };

  const body = await req.json() as { customDomain?: string };
  const domain = (body.customDomain ?? '').trim().toLowerCase();

  if (!domain) {
    return NextResponse.json({ error: 'customDomain requis' }, { status: 400 });
  }

  // Validation format domain
  if (!/^([a-z0-9-]+\.)+[a-z]{2,}$/.test(domain)) {
    return NextResponse.json({ error: 'Format de domaine invalide' }, { status: 400 });
  }

  // Bloquer les sous-domaines de l'app (éviter les conflits avec les slugs)
  if (domain.endsWith(`.${APP_DOMAIN}`) || domain === APP_DOMAIN) {
    return NextResponse.json({ error: `Impossible d'utiliser un sous-domaine ${APP_DOMAIN}` }, { status: 400 });
  }

  const config = await Nexus.adapter.get(`tenants/${tenantId}/tenantConfig`) as JsonObject | null;
  const slug = (config?.slug as string | undefined) ?? tenantId;

  // Persister dans tenantConfig
  await Nexus.adapter.set(
    `tenants/${tenantId}/tenantConfig`,
    { customDomain: domain, customDomainAddedAt: Date.now() },
    { merge: true },
  );

  // Index global domaine → tenant (utilisé par le middleware)
  await Nexus.adapter.set(
    `platform/customDomains/${encodeDomainKey(domain)}`,
    { tenantId, slug, domain, createdAt: Date.now() },
  );

  logger.info(`[CustomDomain] ${domain} → tenant ${tenantId} (slug: ${slug})`);

  return NextResponse.json({
    customDomain: domain,
    cnameTarget: `${slug}.${APP_DOMAIN}`,
    message: `Domaine enregistré. Créez un CNAME ${domain} → ${slug}.${APP_DOMAIN} chez votre registrar.`,
  }, { status: 201 });
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const caller = await requireTenantAdmin(req);
  if (isDenied(caller)) return caller as NextResponse;
  const { tenantId } = caller as { tenantId: string };

  const config = await Nexus.adapter.get(`tenants/${tenantId}/tenantConfig`) as JsonObject | null;
  const domain = config?.customDomain as string | undefined;

  if (domain) {
    await Nexus.adapter.set(
      `tenants/${tenantId}/tenantConfig`,
      { customDomain: null },
      { merge: true },
    );
    await Nexus.adapter.set(
      `platform/customDomains/${encodeDomainKey(domain)}`,
      { removed: true, removedAt: Date.now() },
    );
    logger.info(`[CustomDomain] Suppression ${domain} pour tenant ${tenantId}`);
  }

  return NextResponse.json({ ok: true });
}
