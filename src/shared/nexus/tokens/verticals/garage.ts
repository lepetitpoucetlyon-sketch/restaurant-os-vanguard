import type { BrandConfig } from '../brand';

export const garageDefaultTokens: Partial<BrandConfig> = {
  primaryColor:     '#2C3E50',
  primaryHover:     '#1A252F',
  accentColor:      '#E74C3C',
  borderRadiusCard: 'sm',
  borderRadiusBtn:  'sm',
  glassBlur:        'none',
  glassOpacity:     'low',
  fontBrand:        'Rajdhani',
  fontBrandUrl:     'https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&display=swap',
  fontUI:           'Inter',
};

export const garageVerticalTokens: Record<string, string> = {
  '--repair-pending':          '#f59e0b',
  '--repair-diagnosis':        '#6366f1',
  '--repair-in-progress':      '#3498DB',
  '--repair-waiting-parts':    '#E74C3C',
  '--repair-ready':            '#10b981',
  '--repair-delivered':        '#9ca3af',
  '--vehicle-in':              '#f59e0b',
  '--vehicle-active':          '#3498DB',
  '--vehicle-out':             '#10b981',
  '--vertical-accent-muted':   'rgba(44, 62, 80, 0.15)',
};
