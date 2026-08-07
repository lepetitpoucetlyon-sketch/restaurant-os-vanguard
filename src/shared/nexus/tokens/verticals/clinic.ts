import type { BrandConfig } from '../brand';

export const clinicDefaultTokens: Partial<BrandConfig> = {
  primaryColor:     '#3498DB',
  primaryHover:     '#2980B9',
  accentColor:      '#1ABC9C',
  borderRadiusCard: 'sm',
  borderRadiusBtn:  'sm',
  glassBlur:        'none',
  glassOpacity:     'low',
  fontBrand:        'Inter',
  fontUI:           'Inter',
};

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
