import type { BrandConfig } from '../brand';

export const hotelDefaultTokens: Partial<BrandConfig> = {
  primaryColor:     '#1E3A5F',
  primaryHover:     '#162C4A',
  accentColor:      '#2D5F8A',
  borderRadiusCard: 'sm',
  borderRadiusBtn:  'sm',
  glassBlur:        'sm',
  glassOpacity:     'high',
  fontBrand:        'Cormorant Garamond',
  fontBrandUrl:     'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital@0;1&display=swap',
  fontUI:           'Inter',
};

export const hotelVerticalTokens: Record<string, string> = {
  '--room-available':        '#10b981',
  '--room-occupied':         '#1E3A5F',
  '--room-cleaning':         '#f59e0b',
  '--room-maintenance':      '#ef4444',
  '--room-reserved':         '#6366f1',
  '--checkin-pending':       '#f59e0b',
  '--checkin-active':        '#10b981',
  '--vertical-accent-muted': 'rgba(30, 58, 95, 0.15)',
};
