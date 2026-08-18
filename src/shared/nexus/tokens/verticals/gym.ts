import type { BrandConfig } from '../brand';

export const gymDefaultTokens: Partial<BrandConfig> = {
  primaryColor:     '#EF4444',
  primaryHover:     '#DC2626',
  accentColor:      '#F97316',
  borderRadiusCard: 'lg',
  borderRadiusBtn:  'md',
  glassBlur:        'md',
  glassOpacity:     'medium',
  fontBrand:        'Rajdhani',
  fontBrandUrl:     'https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&display=swap',
  fontUI:           'Inter',
  fontMono:         'JetBrains Mono',
  fontMonoUrl:      'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap',
};

export const gymDefaultAppearance = 'dark' as const;

export const gymVerticalTokens: Record<string, string> = {
  '--vertical-accent-muted': 'rgba(239, 68, 68, 0.12)',
};
