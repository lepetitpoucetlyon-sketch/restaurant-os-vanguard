// src/infrastructure/components/BrandingProvider.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { tenantBrandTokensAtom, tenantIdAtom } from '@/store/pillars/sovereign';
import { tenantVariantAtom } from '@/store/pillars/sovereign';
import { generateCSSVariables, semanticTokens } from '@/shared/nexus/tokens/semantic';
import { BrandTokensSchema, defaultBrandTokens } from '@/shared/nexus/tokens/brand';
import { VERTICAL_DEFAULT_TOKENS, VERTICAL_EXTRA_TOKENS, VERTICAL_APPEARANCE } from '@/shared/nexus/tokens/verticals';
import { useFirestoreBrand } from '@/shared/hooks/useFirestoreBrand';
import { themeModeAtom } from '@/shared/nexus/tokens/themeAtoms';
import type { PlatformVariant } from '@nexus/contracts';

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

function buildSemanticOverrides(brandTokens: BrandTokens): Record<string, Record<string, string>> {
    const overrides: Record<string, Record<string, string>> = {};
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

function injectGoogleFont(url: string, slot: 'brand' | 'ui' | 'mono') {
    const attr = `data-font-${slot}`;
    const existing = document.querySelector<HTMLLinkElement>(`link[${attr}]`);
    if (existing) {
        if (existing.href !== url) existing.href = url;
    } else {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;
        link.setAttribute(attr, 'true');
        document.head.appendChild(link);
    }
}

function applyFonts(root: HTMLElement, brandTokens: BrandTokens) {
    const { fontBrand, fontBrandUrl, fontUI, fontUIUrl, fontMono, fontMonoUrl } = brandTokens;

    // ── font-brand ──────────────────────────────────────────────────────────
    if (fontBrand) {
        root.style.setProperty('--font-brand', `'${fontBrand}', Georgia, serif`);
        if (fontBrandUrl) injectGoogleFont(fontBrandUrl, 'brand');
    }

    // ── font-ui (dedup : si identique à fontBrand, pas de second <link>) ───
    if (fontUI) {
        root.style.setProperty('--font-ui', `'${fontUI}', Inter, system-ui, sans-serif`);
        if (fontUIUrl && fontUIUrl !== fontBrandUrl) {
            injectGoogleFont(fontUIUrl, 'ui');
        } else if (!fontUIUrl) {
            // Font système ou Inter (déjà présente) — retirer le lien précédent si inutile
            document.querySelector('link[data-font-ui]')?.remove();
        }
    }

    // ── font-mono ───────────────────────────────────────────────────────────
    if (fontMono) {
        root.style.setProperty('--font-mono', `'${fontMono}', 'Courier New', monospace`);
        if (fontMonoUrl) injectGoogleFont(fontMonoUrl, 'mono');
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
  const tenantId       = useAtomValue(tenantIdAtom);
  const rawBrandTokens = useAtomValue(tenantBrandTokensAtom);
  const variant        = useAtomValue(tenantVariantAtom);
  const setThemeMode   = useSetAtom(themeModeAtom);
  const prevVariantRef = useRef<PlatformVariant | null>(null);

  useFirestoreBrand(tenantId || "");

  useEffect(() => {
    const root = document.documentElement;

    // ── Gap B : cleanup des extra tokens de l'ancien vertical ────────────────
    const prevVariant = prevVariantRef.current;
    if (prevVariant && prevVariant !== variant) {
      const prevExtra = VERTICAL_EXTRA_TOKENS[prevVariant] ?? {};
      Object.keys(prevExtra).forEach(key => root.style.removeProperty(key));

      // ── Gap C : cleanup des brand CSS vars de l'ancien tenant ──────────────
      // Sans ce cleanup, un switch de tenant dans le MCC laisse les anciennes
      // couleurs/polices/radii sur :root pendant le re-render → flash visuel.
      const BRAND_CSS_VARS_TO_CLEAN = [
        '--tenant-primary', '--tenant-primary-rgb',
        '--tenant-accent', '--tenant-accent-rgb',
        '--text-on-primary',
        '--radius-card', '--radius-btn',
        '--glass-blur', '--glass-opacity',
        '--font-brand', '--font-ui', '--font-mono',
        '--brand-primary-color', '--brand-accent-color',
        '--brand-surface-bg', '--brand-surface-card', '--brand-surface-modal',
      ] as const;
      BRAND_CSS_VARS_TO_CLEAN.forEach(v => root.style.removeProperty(v));

      // Retirer les Google Fonts injectées dynamiquement par l'ancien tenant
      document.querySelectorAll('link[data-font-brand], link[data-font-ui], link[data-font-mono]')
        .forEach(el => el.remove());
    }
    prevVariantRef.current = variant;

    // ── Gap A : init ThemeMode si tenant vierge ───────────────────────────────
    // tenantScopedJSONStorage utilise la clé `nexus_theme_mode` suffixée par tenantId.
    // Si aucune préférence n'est stockée pour ce tenant, on applique l'appearance du vertical.
    if (tenantId && typeof window !== 'undefined') {
      const scopedKey = `nexus_theme_mode:${tenantId}`;
      const hasUserPref = localStorage.getItem(scopedKey) !== null;
      const verticalAppearance = (VERTICAL_APPEARANCE as Record<string, string | undefined>)[variant] ?? 'dark';
      if (!hasUserPref && verticalAppearance !== 'auto') {
        setThemeMode(verticalAppearance as 'light' | 'dark');
      }
    }

    // 1. Tokens du variant (base de chaque vertical)
    const verticalDefaults = (VERTICAL_DEFAULT_TOKENS as Record<string, typeof VERTICAL_DEFAULT_TOKENS.restaurant>)[variant] ?? VERTICAL_DEFAULT_TOKENS.restaurant;
    const extraTokens      = (VERTICAL_EXTRA_TOKENS as Record<string, Record<string, string>>)[variant]   ?? {};

    // 2. Parse les tokens Firestore du tenant
    const result      = BrandTokensSchema.safeParse(rawBrandTokens || defaultBrandTokens);
    const firestoreTokens = result.success ? result.data : defaultBrandTokens;

    // 3. Priorité : semantics < vertical defaults < custom Firestore (si brandingMode=custom)
    const isCustomMode = firestoreTokens.brandingMode === 'custom';
    const merged: BrandTokens = BrandTokensSchema.parse({
      ...defaultBrandTokens,
      ...verticalDefaults,
      ...(isCustomMode ? firestoreTokens : {}),
      tenantId:     firestoreTokens.tenantId,
      brandName:    firestoreTokens.brandName,
      brandingMode: firestoreTokens.brandingMode,
      splashEnabled: firestoreTokens.splashEnabled,
      // Logo et favicon toujours pris du custom si fournis
      ...(firestoreTokens.logoUrl    ? { logoUrl:    firestoreTokens.logoUrl }    : {}),
      ...(firestoreTokens.faviconUrl ? { faviconUrl: firestoreTokens.faviconUrl } : {}),
    });

    // 4. Générer et injecter les CSS vars sémantiques
    const overrides = buildSemanticOverrides(merged);
    const cssVars   = generateCSSVariables({ ...semanticTokens, ...overrides });
    Object.entries(cssVars).forEach(([key, value]) => { if (value) root.style.setProperty(key, value as string); });

    if (merged.primaryColor) root.style.setProperty('--text-on-primary', getContrastTextColor(merged.primaryColor));

    // 5. Radius, glass, fonts
    applyTokenToCSS(root, merged.borderRadiusCard, '--radius-card', RADIUS_MAP);
    applyTokenToCSS(root, merged.borderRadiusBtn,  '--radius-btn',  RADIUS_MAP);
    applyTokenToCSS(root, merged.glassBlur,        '--glass-blur',  BLUR_MAP);
    applyTokenToCSS(root, merged.glassOpacity,     '--glass-opacity', OPACITY_MAP);
    applyFonts(root, merged);
    applyDocumentMeta(merged);

    // 6. Tokens métier spécifiques au vertical
    Object.entries(extraTokens).forEach(([key, value]) => root.style.setProperty(key, value));

    // 7. Exposer le variant courant en data-attribute pour les CSS selectors si besoin
    root.setAttribute('data-vertical', variant);
  }, [rawBrandTokens, variant]);

  return null;
}
