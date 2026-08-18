import { NextRequest, NextResponse } from 'next/server';
import { Nexus } from '@/lib/nexus/NexusAdapter';

const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'sign',
  'mcc',
  'static',
  'auth',
  'login',
  'root',
  'support',
  'billing',
  'status',
  'app',
  'dashboard',
  'mail',
  'smtp',
  'dev',
  'staging',
  'prod',
]);

const DOMAIN_SUFFIX = process.env.NEXT_PUBLIC_DOMAIN_ROOT || 'webapp.fr';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawSlug = searchParams.get('slug') || '';
  const slug = rawSlug.trim().toLowerCase();

  if (!slug) {
    return NextResponse.json({ error: 'Le paramètre slug est requis' }, { status: 400 });
  }

  // 1. Validation syntaxique (a-z, 0-9, tirets, entre 3 et 30 caractères)
  const isValidFormat = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(slug);
  if (!isValidFormat) {
    return NextResponse.json({
      available: false,
      slug,
      fullDomain: `${slug}.${DOMAIN_SUFFIX}`,
      reason: 'Format invalide : 3 à 30 caractères minuscules, chiffres et tirets autorisés.',
    });
  }

  // 2. Vérification des noms réservés système
  if (RESERVED_SLUGS.has(slug)) {
    return NextResponse.json({
      available: false,
      slug,
      fullDomain: `${slug}.${DOMAIN_SUFFIX}`,
      reason: 'Ce nom de sous-domaine est réservé par le système.',
    });
  }

  // 3. Vérification de la disponibilité dans le registre Nexus
  try {
    const domainIndex = (await Nexus.adapter.get<Record<string, string>>('mcc_domain_registry')) || {};
    const existingTenant = domainIndex[slug];

    if (existingTenant) {
      return NextResponse.json({
        available: false,
        slug,
        fullDomain: `${slug}.${DOMAIN_SUFFIX}`,
        reason: 'Ce sous-domaine est déjà attribué à un autre établissement.',
      });
    }

    return NextResponse.json({
      available: true,
      slug,
      fullDomain: `${slug}.${DOMAIN_SUFFIX}`,
    });
  } catch {
    // Fallback optimiste
    return NextResponse.json({
      available: true,
      slug,
      fullDomain: `${slug}.${DOMAIN_SUFFIX}`,
    });
  }
}
