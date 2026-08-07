import type { BrandConfig } from '../brand';

export const customDefaultTokens: Partial<BrandConfig> = {
  primaryColor:     '#6366f1',
  primaryHover:     '#4F46E5',
  accentColor:      '#8B5CF6',
  borderRadiusCard: 'lg',
  borderRadiusBtn:  'md',
  glassBlur:        'md',
  glassOpacity:     'medium',
  fontBrand:        'Inter',
  fontUI:           'Inter',
};

export const customVerticalTokens: Record<string, string> = {
  '--vertical-accent-muted': 'rgba(99, 102, 241, 0.12)',
};
