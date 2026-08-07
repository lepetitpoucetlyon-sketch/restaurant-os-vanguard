import type { BrandConfig } from '../brand';

export const retailDefaultTokens: Partial<BrandConfig> = {
  primaryColor:     '#27AE60',
  primaryHover:     '#1E8449',
  accentColor:      '#2ECC71',
  borderRadiusCard: 'md',
  borderRadiusBtn:  'sm',
  glassBlur:        'none',
  glassOpacity:     'low',
  fontBrand:        'Poppins',
  fontBrandUrl:     'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap',
  fontUI:           'Inter',
};

export const retailVerticalTokens: Record<string, string> = {
  '--stock-normal':            '#10b981',
  '--stock-low':               '#f59e0b',
  '--stock-critical':          '#ef4444',
  '--stock-out':               '#9ca3af',
  '--promo-active':            '#27AE60',
  '--promo-expiring':          '#f59e0b',
  '--sale-in-progress':        '#6366f1',
  '--sale-completed':          '#10b981',
  '--vertical-accent-muted':   'rgba(39, 174, 96, 0.12)',
};
