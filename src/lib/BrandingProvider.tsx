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

type BrandTokens = ReturnType<typeof BrandTokensSchema.parse>;

function buildSemanticOverrides(brandTokens: BrandTokens): Record<string, unknown> {
    const overrides: Record<string, unknown> = {};
    if (brandTokens.primaryColor) {
        overrides.action = { ...semanticTokens.action, primary: brandTokens.primaryColor, primaryHover: brandTokens.primaryHover ?? brandTokens.primaryColor };
        overrides.text   = { ...semanticTokens.text, brand: brandTokens.primaryColor };
        overrides.border = { ...semanticTokens.border, focus: brandTokens.primaryColor };
    }
    if (brandTokens.surfaceModal) {
        overrides.surface = { ...semanticTokens.surface, modal: brandTokens.surfaceModal };
    }
    return overrides;
}

function applyTokenToCSS(root: HTMLElement, token: string | undefined, varName: string, map: Record<string, string>) {
    if (token && map[token]) root.style.setProperty(varName, map[token]);
}

function applyFonts(root: HTMLElement, brandTokens: BrandTokens) {
    if (brandTokens.fontBrand) {
        root.style.setProperty('--font-brand', `'${brandTokens.fontBrand}', Georgia, serif`);
        if (brandTokens.fontBrandUrl && !document.querySelector('link[data-brand-font]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = brandTokens.fontBrandUrl;
            link.setAttribute('data-brand-font', 'true');
            document.head.appendChild(link);
        }
    }
    if (brandTokens.fontUI) {
        root.style.setProperty('--font-ui', `'${brandTokens.fontUI}', Inter, sans-serif`);
    }
}

function applyDocumentMeta(brandTokens: BrandTokens) {
    if (brandTokens.faviconUrl) {
        const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
        if (favicon) favicon.href = brandTokens.faviconUrl;
    }
    if (brandTokens.brandName) {
        document.title = brandTokens.tagline
            ? `${brandTokens.brandName} • ${brandTokens.tagline}`
            : `${brandTokens.brandName} — Restaurant OS`;
    }
}

export function BrandingProvider() {
  const tenantId = useAtomValue(tenantIdAtom);
  const rawBrandTokens = useAtomValue(tenantBrandTokensAtom);

  useFirestoreBrand(tenantId || "");

  useEffect(() => {
    const result = BrandTokensSchema.safeParse(rawBrandTokens || defaultBrandTokens);
    const brandTokens = result.success ? result.data : defaultBrandTokens;

    const overrides = buildSemanticOverrides(brandTokens);
    const cssVars = generateCSSVariables({ ...semanticTokens, ...overrides });
    const root = document.documentElement;
    Object.entries(cssVars).forEach(([key, value]) => { if (value) root.style.setProperty(key, value as string); });

    if (brandTokens.primaryColor) root.style.setProperty('--text-on-primary', getContrastTextColor(brandTokens.primaryColor));

    applyTokenToCSS(root, brandTokens.borderRadiusCard, '--radius-card', RADIUS_MAP);
    applyTokenToCSS(root, brandTokens.borderRadiusBtn,  '--radius-btn',  RADIUS_MAP);
    applyTokenToCSS(root, brandTokens.glassBlur,    '--glass-blur',    BLUR_MAP);
    applyTokenToCSS(root, brandTokens.glassOpacity, '--glass-opacity', OPACITY_MAP);

    applyFonts(root, brandTokens);
    applyDocumentMeta(brandTokens);
  }, [rawBrandTokens]);

  return null;
}
