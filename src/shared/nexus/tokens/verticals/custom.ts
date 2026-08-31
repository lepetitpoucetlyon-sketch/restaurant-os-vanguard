import type { BrandConfig } from '../brand';

// taste-skill compliant : palette neutre zinc/graphite pour le canevas vierge —
// le "AI Purple" indigo/violet est le pattern le plus banni. Le tenant configure
// sa charte via BrandingService (Branding Plus) dès l'onboarding ; ce défaut
// reste sobre et premium pour tout démarrage sans config.
// Fonts alignées sur restaurant (Outfit + Instrument Serif) pour cohérence
// inter-verticales.
export const customDefaultTokens: Partial<BrandConfig> = {
  primaryColor:     '#18181B',
  primaryHover:     '#27272A',
  accentColor:      '#3F3F46',
  borderRadiusCard: 'lg',
  borderRadiusBtn:  'md',
  glassBlur:        'md',
  glassOpacity:     'medium',
  fontBrand:        'Instrument Serif',
  fontBrandUrl:     'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap',
  fontUI:           'Outfit',
  fontUIUrl:        'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap',
  fontMono:         'JetBrains Mono',
  fontMonoUrl:      'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap',
};

export const customDefaultAppearance = 'auto' as const;

export const customVerticalTokens: Record<string, string> = {
  '--vertical-accent-muted': 'rgba(24, 24, 27, 0.08)',
};
