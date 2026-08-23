import type { MetadataRoute } from 'next';
import { headers, cookies } from 'next/headers';
import { whiteLabelInstanceConfig, DEFAULT_TENANT_ID } from '@/config/instance';
import { defaultBrandTokens } from '@/shared/nexus/tokens/brand';

const RESERVED_SUBDOMAINS = new Set(['admin', 'master', 'www', 'localhost', 'api', 'app']);

function resolveTenantFromHostString(host: string): string | null {
  const cleanHost = host.split(':')[0];
  const parts = cleanHost.split('.');
  if (parts.length < 2) return null;
  const sub = parts[0].toLowerCase();
  return RESERVED_SUBDOMAINS.has(sub) ? null : sub;
}

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const headersList = await headers();
  const host = headersList.get('host') ?? '';
  const cookieStore = await cookies();
  const tenantFromCookie = cookieStore.get('nexus_tenant_id')?.value;
  const tenantFromSubdomain = resolveTenantFromHostString(host);
  const activeTenantId = tenantFromSubdomain || tenantFromCookie || DEFAULT_TENANT_ID;

  // Surcharge de marque dynamique selon le tenant résolu
  const appName = activeTenantId
    ? `${activeTenantId.charAt(0).toUpperCase() + activeTenantId.slice(1)} — Restaurant OS`
    : (whiteLabelInstanceConfig.appName || 'Restaurant OS — Intelligence Opérationnelle');

  const shortName = activeTenantId
    ? activeTenantId.charAt(0).toUpperCase() + activeTenantId.slice(1)
    : (whiteLabelInstanceConfig.appName || 'Restaurant OS');

  const themeColor = defaultBrandTokens.primaryColor || whiteLabelInstanceConfig.primaryColor || '#C5A059';
  const backgroundColor = defaultBrandTokens.surfaceBg || '#0B0B0C';

  return {
    name: appName,
    short_name: shortName,
    description: whiteLabelInstanceConfig.appDescription || 'Métaplateforme souveraine pour la restauration',
    start_url: '/',
    display: 'standalone',
    background_color: backgroundColor,
    theme_color: themeColor,
    orientation: 'any',
    scope: '/',
    id: '/',
    categories: ['business', 'productivity', 'food'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Point de Vente (POS)',
        url: '/pos',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Écran Cuisine (KDS)',
        url: '/kds',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Plan de Salle',
        url: '/floor-plan',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Comptabilité & Clôture',
        url: '/finance',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
    ],
    share_target: {
      action: '/api/share-target',
      method: 'POST',
      enctype: 'multipart/form-data',
      params: {
        title: 'name',
        text: 'description',
        files: [
          {
            name: 'media',
            accept: ['image/*', 'application/pdf'],
          },
        ],
      },
    },
  };
}
