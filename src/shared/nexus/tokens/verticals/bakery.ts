import type { BrandConfig } from '../brand';

export const bakeryDefaultTokens: Partial<BrandConfig> = {
  primaryColor:     '#C68642',
  primaryHover:     '#A86E30',
  accentColor:      '#8B4513',
  borderRadiusCard: 'lg',
  borderRadiusBtn:  'md',
  glassBlur:        'sm',
  glassOpacity:     'medium',
  fontBrand:        'Lora',
  fontBrandUrl:     'https://fonts.googleapis.com/css2?family=Lora:ital@0;1&display=swap',
  fontUI:           'Inter',
};

export const bakeryVerticalTokens: Record<string, string> = {
  '--batch-planned':         '#6366f1',
  '--batch-in-progress':     '#f59e0b',
  '--batch-ready':           '#10b981',
  '--batch-expiring':        '#ef4444',
  '--batch-sold':            '#9ca3af',
  '--ingredient-ok':         '#10b981',
  '--ingredient-low':        '#f59e0b',
  '--ingredient-out':        '#ef4444',
  '--vertical-accent-muted': 'rgba(198, 132, 66, 0.15)',
};
