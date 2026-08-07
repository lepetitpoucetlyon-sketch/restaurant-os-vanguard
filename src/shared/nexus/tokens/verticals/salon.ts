import type { BrandConfig } from '../brand';

export const salonDefaultTokens: Partial<BrandConfig> = {
  primaryColor:     '#D4A5C7',
  primaryHover:     '#C490B8',
  accentColor:      '#9B59B6',
  borderRadiusCard: 'lg',
  borderRadiusBtn:  'lg',
  glassBlur:        'lg',
  glassOpacity:     'medium',
  fontBrand:        'Cormorant Garamond',
  fontBrandUrl:     'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital@0;1&display=swap',
  fontUI:           'Inter',
};

export const salonVerticalTokens: Record<string, string> = {
  '--appointment-booked':       '#D4A5C7',
  '--appointment-in-progress':  '#9B59B6',
  '--appointment-completed':    '#10b981',
  '--appointment-cancelled':    '#ef4444',
  '--appointment-no-show':      '#f59e0b',
  '--chair-available':          '#10b981',
  '--chair-occupied':           '#D4A5C7',
  '--chair-break':              '#9ca3af',
  '--vertical-accent-muted':    'rgba(212, 165, 199, 0.15)',
};
