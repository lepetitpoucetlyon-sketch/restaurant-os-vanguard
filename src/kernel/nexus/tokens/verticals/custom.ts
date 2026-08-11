import type { BrandConfig } from '../brand';

export const customDefaultTokens: Partial<BrandConfig> = {
  primaryColor:     '#6366f1',
  primaryHover:     '#4F46E5',
  accentColor:      '#8B5CF6',
  borderRadiusCard: 'lg',
  borderRadiusBtn:  'md',
  glassBlur:        'md',
  glassOpacity:     'medium',
  // brand = Inter (neutre, remplacé par le configurateur) | ui = Inter (système) | mono = JetBrains Mono
  fontBrand:        'Inter',
  fontUI:           'Inter',
  // pas d'URL : Inter système, dedup automatique si le tenant garde les deux à Inter
  fontMono:         'JetBrains Mono',
  fontMonoUrl:      'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap',
};

export const customDefaultAppearance = 'auto' as const;

export const customVerticalTokens: Record<string, string> = {
  '--vertical-accent-muted': 'rgba(99, 102, 241, 0.12)',
};
