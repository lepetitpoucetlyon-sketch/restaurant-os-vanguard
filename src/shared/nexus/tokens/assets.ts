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
    logo:    (brandTokens as unknown as {logoUrl?: string})?.logoUrl,
    favicon: (brandTokens as unknown as {faviconUrl?: string})?.faviconUrl,
    banner:  (brandTokens as unknown as {bannerUrl?: string})?.bannerUrl,
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

export interface BrandLogoResolutions {
  logo1x: string;
  logo2x?: string;
  logo3x?: string;
}

// Fonction utilitaire pour obtenir les résolutions de logo du tenant
export function getBrandLogoSet(
  brandTokens?: { logoUrl?: string | null; logoUrl_1x?: string | null; logoUrl_2x?: string | null; logoUrl_3x?: string | null }
): BrandLogoResolutions {
  const base = brandTokens?.logoUrl || brandTokens?.logoUrl_1x || defaultAssets.logo;
  return {
    logo1x: base,
    logo2x: brandTokens?.logoUrl_2x || base,
    logo3x: brandTokens?.logoUrl_3x || base,
  };
}


