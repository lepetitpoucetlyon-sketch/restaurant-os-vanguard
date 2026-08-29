// src/shared/nexus/tokens/density.ts
// DENSITY SCALE — calibre l'espacement, les tailles et les touch targets selon le contexte opérationnel.
// Piloté par le cadran VISUAL_DENSITY de Taste-Skill (§1) et le UXProfile du tenant.

export type DensityMode = 'dense' | 'comfortable' | 'spacious';

export interface DensityScale {
  /** CSS var prefix: --density-gap-* */
  gap: { xs: string; sm: string; md: string; lg: string; xl: string };
  /** CSS var prefix: --density-pad-* */
  padding: { button: string; card: string; section: string; input: string };
  /** Minimum touch target in px — WCAG 2.5.8 / Apple HIG */
  minTarget: number;
  /** Font scale adjustments */
  fontSize: { micro: string; body: string; title: string; display: string };
}

export const DENSITY_SCALES: Record<DensityMode, DensityScale> = {
  dense: {
    gap:      { xs: '0.125rem', sm: '0.25rem', md: '0.5rem', lg: '0.75rem', xl: '1rem' },
    padding:  { button: '0.375rem 0.75rem', card: '0.75rem', section: '1rem', input: '0.375rem 0.5rem' },
    minTarget: 44,
    fontSize: { micro: '0.625rem', body: '0.8125rem', title: '1.125rem', display: '1.75rem' },
  },
  comfortable: {
    gap:      { xs: '0.25rem', sm: '0.5rem', md: '0.75rem', lg: '1rem', xl: '1.5rem' },
    padding:  { button: '0.5rem 1rem', card: '1.25rem', section: '1.5rem', input: '0.5rem 0.75rem' },
    minTarget: 48,
    fontSize: { micro: '0.6875rem', body: '0.875rem', title: '1.25rem', display: '2rem' },
  },
  spacious: {
    gap:      { xs: '0.5rem', sm: '0.75rem', md: '1rem', lg: '1.5rem', xl: '2rem' },
    padding:  { button: '0.625rem 1.25rem', card: '1.75rem', section: '2.5rem', input: '0.625rem 1rem' },
    minTarget: 48,
    fontSize: { micro: '0.75rem', body: '0.9375rem', title: '1.5rem', display: '2.5rem' },
  },
} as const;

/**
 * Generates CSS custom properties for the given density mode.
 * Injected by DensityProvider into :root.
 */
export function generateDensityCSSVariables(mode: DensityMode): Record<string, string> {
  const scale = DENSITY_SCALES[mode];
  return {
    '--density-gap-xs':       scale.gap.xs,
    '--density-gap-sm':       scale.gap.sm,
    '--density-gap-md':       scale.gap.md,
    '--density-gap-lg':       scale.gap.lg,
    '--density-gap-xl':       scale.gap.xl,
    '--density-pad-button':   scale.padding.button,
    '--density-pad-card':     scale.padding.card,
    '--density-pad-section':  scale.padding.section,
    '--density-pad-input':    scale.padding.input,
    '--density-min-target':   `${scale.minTarget}px`,
    '--density-font-micro':   scale.fontSize.micro,
    '--density-font-body':    scale.fontSize.body,
    '--density-font-title':   scale.fontSize.title,
    '--density-font-display': scale.fontSize.display,
  };
}

/**
 * Maps UXProfileType + page category to a density mode.
 * POS/KDS/Bar = dense, Dashboard/Analytics = comfortable, Menu/Showcase = spacious.
 */
export function resolveDensityFromContext(
  profileType: string,
  pageCategory?: 'operations' | 'commerce' | 'management' | 'admin' | 'marketing' | 'public',
): DensityMode {
  // Page category takes precedence when explicitly operational
  if (pageCategory === 'operations' || pageCategory === 'admin') return 'dense';
  if (pageCategory === 'marketing' || pageCategory === 'public') return 'spacious';

  // Then profile type
  switch (profileType) {
    case 'fast_food':
    case 'dark_kitchen':
      return 'dense';
    case 'gastronomic':
      return 'spacious';
    case 'bar_nightclub':
    case 'cocktail_bar':
      return 'comfortable';
    default:
      return 'comfortable';
  }
}
