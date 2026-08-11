import type { BrandConfig } from '../brand';

export const clinicDefaultTokens: Partial<BrandConfig> = {
  primaryColor:     '#3498DB',
  primaryHover:     '#2980B9',
  accentColor:      '#1ABC9C',
  borderRadiusCard: 'sm',
  borderRadiusBtn:  'sm',
  glassBlur:        'none',
  glassOpacity:     'low',
  // brand = Inter (clarté médicale, pas de serif) | ui = DM Sans (clean médical) | mono = IBM Plex Mono (codes patients)
  // fontBrand intentionnellement sans serif : lisibilité critique en contexte médical
  fontBrand:        'Inter',
  // pas de fontBrandUrl : Inter système
  fontUI:           'DM Sans',
  fontUIUrl:        'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap',
  fontMono:         'IBM Plex Mono',
  fontMonoUrl:      'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap',
};

export const clinicDefaultAppearance = 'light' as const;

export const clinicVerticalTokens: Record<string, string> = {
  '--appointment-urgent':       '#ef4444',
  '--appointment-routine':      '#3498DB',
  '--appointment-followup':     '#6366f1',
  '--appointment-completed':    '#10b981',
  '--appointment-cancelled':    '#9ca3af',
  '--patient-waiting':          '#f59e0b',
  '--patient-in-consultation':  '#3498DB',
  '--patient-done':             '#10b981',
  '--vertical-accent-muted':    'rgba(52, 152, 219, 0.12)',
};
