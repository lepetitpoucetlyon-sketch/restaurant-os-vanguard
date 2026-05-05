// src/infrastructure/components/BrandingProvider.tsx
'use client';

import { useEffect } from 'react';
import { tenantBrandTokensAtom, tenantIdAtom } from '@/store/pillars/sovereign';
import { generateCSSVariables, semanticTokens } from '@/shared/nexus/tokens/semantic';
import { BrandTokensSchema, defaultBrandTokens } from '@/shared/nexus/tokens/brand';
import { useFirestoreBrand } from '@/hooks/useFirestoreBrand';

export function BrandingProvider() {
  const tenantId = useAtomValue(tenantIdAtom);
  const rawBrandTokens = useAtomValue(tenantBrandTokensAtom);

  // Synchronisation temps réel Google Stitch
  useFirestoreBrand(tenantId || '');

  useEffect(() => {
    // Valider les tokens tenant via Zod avant injection
    const result = BrandTokensSchema.safeParse(rawBrandTokens || defaultBrandTokens);
    const brandTokens = result.success ? result.data : defaultBrandTokens;

    // Construire le override de tokens sémantiques
    const overrides: any = {};
    
    if (brandTokens.primaryColor) {
        overrides.action = {
            ...semanticTokens.action,
            primary:      brandTokens.primaryColor,
            primaryHover: brandTokens.primaryHover ?? brandTokens.primaryColor,
        };
        overrides.text = {
            ...semanticTokens.text,
            brand: brandTokens.primaryColor,
        };
        overrides.border = {
            ...semanticTokens.border,
            focus: brandTokens.primaryColor,
        };
    }

    if (brandTokens.surfaceModal) {
        overrides.surface = {
            ...semanticTokens.surface,
            modal: brandTokens.surfaceModal,
        };
    }

    // Générer et injecter les variables CSS
    const cssVars = generateCSSVariables({ ...semanticTokens, ...overrides });

    const root = document.documentElement;
    Object.entries(cssVars).forEach(([key, value]) => {
      if (value) {
        root.style.setProperty(key, value as string);
      }
    });

    // Injection de la police brand
    if (brandTokens.fontBrand) {
      root.style.setProperty('--font-brand', `'${brandTokens.fontBrand}', Georgia, serif`);

      // Charger la police depuis URL si fournie
      if (brandTokens.fontBrandUrl) {
        const existing = document.querySelector(`link[data-brand-font]`);
        if (!existing) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = brandTokens.fontBrandUrl;
          link.setAttribute('data-brand-font', 'true');
          document.head.appendChild(link);
        }
      }
    }

    if (brandTokens.fontUI) {
      root.style.setProperty('--font-ui', `'${brandTokens.fontUI}', Inter, sans-serif`);
    }

    // Injection favicon
    if (brandTokens.faviconUrl) {
      const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (favicon) favicon.href = brandTokens.faviconUrl;
    }

  }, [rawBrandTokens]);

  return null;
}
