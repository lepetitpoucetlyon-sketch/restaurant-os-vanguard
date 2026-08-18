import type { BrandConfig } from '../brand';

export const veterinaryDefaultTokens: Partial<BrandConfig> = {
  primaryColor:     '#0284C7',
  primaryHover:     '#0369A1',
  accentColor:      '#38BDF8',
  borderRadiusCard: 'lg',
  borderRadiusBtn:  'md',
  glassBlur:        'md',
  glassOpacity:     'medium',
  fontBrand:        'Inter',
  fontUI:           'Inter',
  fontMono:         'JetBrains Mono',
  fontMonoUrl:      'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap',
};

export const veterinaryDefaultAppearance = 'light' as const;

export const veterinaryVerticalTokens: Record<string, string> = {
  '--vertical-accent-muted': 'rgba(2, 132, 199, 0.12)',
};
