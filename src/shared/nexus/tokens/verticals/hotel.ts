import type { BrandConfig } from '../brand';

export const hotelDefaultTokens: Partial<BrandConfig> = {
  primaryColor:     '#1E3A5F',
  primaryHover:     '#162C4A',
  accentColor:      '#2D5F8A',
  borderRadiusCard: 'sm',
  borderRadiusBtn:  'sm',
  glassBlur:        'sm',
  glassOpacity:     'high',
  // brand = Cormorant Garamond (luxe, titres) | ui = Inter (système) | mono = JetBrains Mono (factures)
  fontBrand:        'Instrument Serif',
  fontBrandUrl:     'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap',
  fontUI:           'Outfit',
  fontMono:         'JetBrains Mono',
  fontMonoUrl:      'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap',
};

export const hotelDefaultAppearance = 'dark' as const;

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
