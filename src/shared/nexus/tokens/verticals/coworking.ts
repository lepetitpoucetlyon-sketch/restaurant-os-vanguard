import type { BrandConfig } from '../brand';

export const coworkingDefaultTokens: Partial<BrandConfig> = {
  primaryColor:     '#6366F1',
  primaryHover:     '#4F46E5',
  accentColor:      '#A855F7',
  borderRadiusCard: 'lg',
  borderRadiusBtn:  'md',
  glassBlur:        'md',
  glassOpacity:     'medium',
  fontBrand:        'Outfit',
  fontUI:           'Outfit',
  fontMono:         'JetBrains Mono',
  fontMonoUrl:      'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap',
};

export const coworkingDefaultAppearance = 'dark' as const;

export const coworkingVerticalTokens: Record<string, string> = {
  '--vertical-accent-muted': 'rgba(99, 102, 241, 0.12)',
};
