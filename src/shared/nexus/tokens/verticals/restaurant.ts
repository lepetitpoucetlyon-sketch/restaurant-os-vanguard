import type { BrandConfig } from '../brand';

export const restaurantDefaultTokens: Partial<BrandConfig> = {
  primaryColor:     '#C5A059',
  primaryHover:     '#B08D48',
  accentColor:      '#C5A059',
  borderRadiusCard: 'lg',
  borderRadiusBtn:  'md',
  glassBlur:        'md',
  glassOpacity:     'high',
  fontBrand:        'Playfair Display',
  fontBrandUrl:     'https://fonts.googleapis.com/css2?family=Playfair+Display:ital@0;1&display=swap',
  fontUI:           'Inter',
};

export const restaurantVerticalTokens: Record<string, string> = {
  '--table-available':       '#e5e7eb',
  '--table-occupied':        '#6366f1',
  '--table-reserved':        '#fbbf24',
  '--table-cleaning':        '#d1d5db',
  '--order-pending':         '#f59e0b',
  '--order-in-kitchen':      '#6366f1',
  '--order-ready':           '#10b981',
  '--order-served':          '#9ca3af',
  '--order-cancelled':       '#ef4444',
  '--vertical-accent-muted': 'rgba(197, 160, 89, 0.15)',
};
