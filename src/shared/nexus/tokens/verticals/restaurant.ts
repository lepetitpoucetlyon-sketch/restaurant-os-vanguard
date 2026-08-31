import type { BrandConfig } from '../brand';

// taste-skill compliant :
// - Inter bannie → Outfit (chargée via next/font/google dans app/layout.tsx)
// - Playfair Display remplacée par Instrument Serif (éditorial modern, pas générique)
// - Palette dorée conservée (#C5A059) — identité forte, non "AI purple"
// - Anciennes teintes indigo #6366f1 dans les tokens table/order → passées à
//   des couleurs franches (bleu-nuit pour occupé, doré pour en-cuisine).
export const restaurantDefaultTokens: Partial<BrandConfig> = {
  primaryColor:     '#C5A059',
  primaryHover:     '#B08D48',
  accentColor:      '#C5A059',
  borderRadiusCard: 'lg',
  borderRadiusBtn:  'md',
  glassBlur:        'md',
  glassOpacity:     'high',
  fontBrand:        'Instrument Serif',
  fontBrandUrl:     'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap',
  fontUI:           'Outfit',
  fontUIUrl:        'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap',
  fontMono:         'JetBrains Mono',
  fontMonoUrl:      'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap',
};

export const restaurantDefaultAppearance = 'dark' as const;

export const restaurantVerticalTokens: Record<string, string> = {
  '--table-available':       '#e5e7eb',
  '--table-occupied':        '#1e293b',
  '--table-reserved':        '#fbbf24',
  '--table-cleaning':        '#d1d5db',
  '--order-pending':         '#f59e0b',
  '--order-in-kitchen':      '#C5A059',
  '--order-ready':           '#10b981',
  '--order-served':          '#9ca3af',
  '--order-cancelled':       '#ef4444',
  '--vertical-accent-muted': 'rgba(197, 160, 89, 0.15)',
};
