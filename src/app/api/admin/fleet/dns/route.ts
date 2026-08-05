/**
 * POST /api/admin/fleet/dns
 * Auto-DNS : crée automatiquement le sous-domaine {slug}.restaurantos.app
 * via l'API Vercel ou Cloudflare selon les env vars configurées.
 *
 * Body : { tenantId: string, slug: string }
 * Retourne : { domain: string, provider: 'vercel' | 'cloudflare' | 'manual' }
 *
 * Variables d'env requises (l'une ou l'autre) :
 *   VERCEL_TOKEN + VERCEL_PROJECT_ID  → Vercel Domains API
 *   CLOUDFLARE_API_TOKEN + CLOUDFLARE_ZONE_ID → Cloudflare DNS API
 *
 * Protégé : fleet_admin.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

const BASE_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'restaurantos.app';

async function provisionVercelDomain(slug: string): Promise<string> {
  const domain   = `${slug}.${BASE_DOMAIN}`;
  const token    = process.env.VERCEL_TOKEN!;
  const project  = process.env.VERCEL_PROJECT_ID!;

  const res = await fetch(
    `https://api.vercel.com/v9/projects/${project}/domains`,
    {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name: domain }),
    },
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Vercel API error: ${err}`);
  }

  return domain;
}

async function provisionCloudflareDns(slug: string): Promise<string> {
  const domain  = `${slug}.${BASE_DOMAIN}`;
  const token   = process.env.CLOUDFLARE_API_TOKEN!;
  const zone    = process.env.CLOUDFLARE_ZONE_ID!;
  const target  = process.env.CLOUDFLARE_CNAME_TARGET ?? BASE_DOMAIN;

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zone}/dns_records`,
    {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        type:    'CNAME',
        name:    `${slug}.${BASE_DOMAIN}`,
        content: target,
        ttl:     1,
        proxied: true,
      }),
    },
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Cloudflare API error: ${err}`);
  }

  return domain;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'fleet_admin');
  if (isDenied(caller)) return caller as NextResponse;

  let body: { tenantId: string; slug: string };
  try {
    body = await req.json() as { tenantId: string; slug: string };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { tenantId, slug } = body;
  if (!tenantId || !slug) {
    return NextResponse.json({ error: 'tenantId et slug requis' }, { status: 400 });
  }

  // Validation slug
  if (!/^[a-z0-9-]{3,40}$/.test(slug)) {
    return NextResponse.json({ error: 'slug invalide (a-z0-9-, 3-40 chars)' }, { status: 400 });
  }

  let domain: string;
  let provider: 'vercel' | 'cloudflare' | 'manual';

  try {
    if (process.env.VERCEL_TOKEN && process.env.VERCEL_PROJECT_ID) {
      domain   = await provisionVercelDomain(slug);
      provider = 'vercel';
    } else if (process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ZONE_ID) {
      domain   = await provisionCloudflareDns(slug);
      provider = 'cloudflare';
    } else {
      domain   = `${slug}.${BASE_DOMAIN}`;
      provider = 'manual';
      logger.warn(`[DNS] Aucun provider DNS configuré — domaine ${domain} à créer manuellement`);
    }

    // Persister dans le tenantConfig
    await Nexus.adapter.set(`tenants/${tenantId}/tenantConfig`, {
      domain, slug, dnsProvider: provider, dnsProvisionedAt: new Date().toISOString(),
    }, { merge: true });

    empireAudit.log({
      module: 'fleet',
      action: 'DNS_PROVISIONED',
      severity: 'medium',
      details: { tenantId, domain, provider } as unknown as import('@/shared/nexus-contract').SovereignData,
      timestamp: new Date(),
    });

    logger.info(`[DNS] ${provider} → ${domain} pour tenant ${tenantId}`);
    return NextResponse.json({ success: true, domain, provider });

  } catch (err) {
    logger.error('[DNS] Erreur provisioning', err);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
