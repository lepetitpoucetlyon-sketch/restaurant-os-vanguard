// src/shared/nexus/tokens/colors.ts
// PALETTE BRUTE — noms de couleurs sans sémantique
// Ces valeurs ne doivent JAMAIS être utilisées directement dans les composants
// Passer toujours par semantic.ts

export const palette = {
  // Violets / Indigo (thème par défaut Restaurant OS)
  indigo: {
    50:  '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
    950: '#1e1b4b',
  },
  // Émeraude / Succès
  emerald: {
    50:  '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },
  // Ambre / Avertissement
  amber: {
    50:  '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  // Rouge / Danger
  red: {
    50:  '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  // Neutres (Greyscale)
  neutral: {
    0:    '#ffffff',
    50:   '#f9fafb',
    100:  '#f3f4f6',
    200:  '#e5e7eb',
    300:  '#d1d5db',
    400:  '#9ca3af',
    500:  '#6b7280',
    600:  '#4b5563',
    700:  '#374151',
    800:  '#1f2937',
    900:  '#111827',
    950:  '#030712',
    1000: '#000000',
  },
  // Spécifiques UI Vanguard
  void:   '#0B0B0C',   // Background modal premium
  carbon: '#1a1a1a',   // Texture fond
  gold: {
    DEFAULT: '#C5A059',
    soft: 'rgba(197, 160, 89, 0.3)',
  }
} as const;

export type PaletteColor = typeof palette;
