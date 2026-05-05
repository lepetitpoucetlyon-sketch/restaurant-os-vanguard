// src/shared/nexus/tokens/assets.ts
import { useAtomValue } from 'jotai';
import { tenantBrandTokensAtom } from '@/store/pillars/sovereign';

// Clés d'assets disponibles
export type BrandAssetKey = 'logo' | 'favicon' | 'banner' | 'placeholder' | 'texture';

// Assets par défaut (Restaurant OS)
const defaultAssets: Record<BrandAssetKey, string> = {
  logo:        '/assets/brand/logo-default.svg',
  favicon:     '/favicon.ico',
  banner:      '/assets/brand/banner-default.jpg',
  placeholder: '/assets/ui/image-placeholder.svg',
  texture:     'https://www.transparenttextures.com/patterns/carbon-fibre.png',
};

// Hook React pour usage dans les composants
export function useBrandAsset(key: BrandAssetKey): string {
  const brandTokens = useAtomValue(tenantBrandTokensAtom);

  const tenantAssets: Partial<Record<BrandAssetKey, string | null | undefined>> = {
    logo:    brandTokens?.logoUrl,
    favicon: brandTokens?.faviconUrl,
    banner:  brandTokens?.bannerUrl,
  };

  return tenantAssets[key] || defaultAssets[key];
}

// Fonction pure pour usage hors composant (ex: metadata Next.js)
export function getBrandAsset(
  key: BrandAssetKey,
  brandTokens?: { logoUrl?: string | null; faviconUrl?: string | null; bannerUrl?: string | null }
): string {
  const tenantAssets: Partial<Record<BrandAssetKey, string | null | undefined>> = {
    logo:    brandTokens?.logoUrl,
    favicon: brandTokens?.faviconUrl,
    banner:  brandTokens?.bannerUrl,
  };
  return tenantAssets[key] || defaultAssets[key];
}
