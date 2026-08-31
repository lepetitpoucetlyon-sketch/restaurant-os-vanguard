import type { BrandConfig } from '../brand';

export const floristDefaultTokens: Partial<BrandConfig> = {
  primaryColor:     '#10B981',
  primaryHover:     '#059669',
  accentColor:      '#F43F5E',
  borderRadiusCard: 'lg',
  borderRadiusBtn:  'md',
  glassBlur:        'md',
  glassOpacity:     'medium',
  fontBrand:        'Playfair Display',
  fontBrandUrl:     'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap',
  fontUI:           'Outfit',
  fontMono:         'JetBrains Mono',
  fontMonoUrl:      'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap',
};

export const floristDefaultAppearance = 'light' as const;

export const floristVerticalTokens: Record<string, string> = {
  '--vertical-accent-muted': 'rgba(16, 185, 129, 0.12)',
};
