// src/infrastructure/components/BrandingProvider.tsx
'use client';

import { useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { tenantBrandTokensAtom, tenantIdAtom } from '@/store/pillars/sovereign';
import { generateCSSVariables, semanticTokens } from '@/shared/nexus/tokens/semantic';
import { BrandTokensSchema, defaultBrandTokens } from '@/shared/nexus/tokens/brand';
import { useFirestoreBrand } from '@/shared/hooks/useFirestoreBrand';

function getContrastTextColor(hexColor: string): string {
  const clean = hexColor.replace('#', '');
  if (clean.length !== 6) return '#FFFFFF';
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

const RADIUS_MAP: Record<string, string> = { sm: '0.5rem', md: '1rem', lg: '1.5rem', full: '9999px' };
const BLUR_MAP: Record<string, string>   = { none: '0px', sm: '8px', md: '16px', lg: '24px' };
const OPACITY_MAP: Record<string, string> = { low: '0.4', medium: '0.7', high: '0.9' };

export function BrandingProvider() {
  const tenantId = useAtomValue(tenantIdAtom);
  const rawBrandTokens = useAtomValue(tenantBrandTokensAtom);

  // Synchronisation temps réel Google Stitch
  useFirestoreBrand(tenantId || "");

  useEffect(() => {
    // Valider les tokens tenant via Zod avant injection
    const result = BrandTokensSchema.safeParse(rawBrandTokens || defaultBrandTokens);
    const brandTokens = result.success ? result.data : defaultBrandTokens;

    // Construire le override de tokens sémantiques
    const overrides: Record<string, unknown> = {};
    
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

    // Injection automatique du contraste texte WCAG
    if (brandTokens.primaryColor) {
      root.style.setProperty('--text-on-primary', getContrastTextColor(brandTokens.primaryColor));
    }

    // Injection des Radii (Formes)
    if (brandTokens.borderRadiusCard && RADIUS_MAP[brandTokens.borderRadiusCard]) {
      root.style.setProperty('--radius-card', RADIUS_MAP[brandTokens.borderRadiusCard]);
    }
    if (brandTokens.borderRadiusBtn && RADIUS_MAP[brandTokens.borderRadiusBtn]) {
      root.style.setProperty('--radius-btn', RADIUS_MAP[brandTokens.borderRadiusBtn]);
    }

    // Injection des effets Glassmorphism
    if (brandTokens.glassBlur && BLUR_MAP[brandTokens.glassBlur]) {
      root.style.setProperty('--glass-blur', BLUR_MAP[brandTokens.glassBlur]);
    }
    if (brandTokens.glassOpacity && OPACITY_MAP[brandTokens.glassOpacity]) {
      root.style.setProperty('--glass-opacity', OPACITY_MAP[brandTokens.glassOpacity]);
    }

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

    // Injection favicon & Titre du document
    if (brandTokens.faviconUrl) {
      const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (favicon) favicon.href = brandTokens.faviconUrl;
    }

    if (brandTokens.brandName && typeof document !== 'undefined') {
      document.title = brandTokens.tagline 
        ? `${brandTokens.brandName} • ${brandTokens.tagline}`
        : `${brandTokens.brandName} — Restaurant OS`;
    }

  }, [rawBrandTokens]);

  return null;
}
