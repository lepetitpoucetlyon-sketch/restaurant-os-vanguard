// src/shared/nexus/tokens/semantic.ts
// TOKENS SÉMANTIQUES — rôles fonctionnels
// Ces tokens mappent vers la palette mais peuvent être overridés par tenant

import { palette } from './colors';

export const semanticTokens = {

  // ── Actions ─────────────────────────────────────────────────────────────
  action: {
    primary:          palette.gold.DEFAULT,      // Par défaut Vanguard Gold
    primaryHover:     palette.neutral[1000],     // Noir au hover
    primaryForeground: palette.neutral[0],
    secondary:        palette.neutral[100],
    secondaryHover:   palette.neutral[200],
    secondaryForeground: palette.neutral[800],
    danger:           palette.red[500],
    dangerHover:      palette.red[600],
    dangerForeground: palette.neutral[0],
    accent:           palette.gold.DEFAULT,
  },

  // ── Surfaces ─────────────────────────────────────────────────────────────
  surface: {
    background:       palette.neutral[50],       // #F8F7F2 fallback
    card:             palette.neutral[0],
    modal:            palette.neutral[0],
    modalDark:        palette.void,              // #0B0B0C
    sidebar:          palette.neutral[900],
    overlay:          'rgba(0, 0, 0, 0.5)',
    tertiary:         palette.neutral[100],
    glass:            'rgba(255, 255, 255, 0.7)',
    glassDark:        'rgba(11, 11, 12, 0.8)',
  },

  // ── Effets Premium ───────────────────────────────────────────────────────
  effects: {
    gradientPrimary:  `linear-gradient(135deg, ${palette.gold.DEFAULT} 0%, ${palette.neutral[1000]} 100%)`,
    gradientSurface:  `linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, transparent 100%)`,
    shadowCard:       '0 20px 50px -12px rgba(0, 0, 0, 0.15)',
    shadowGlow:       `0 0 20px 4px ${palette.gold.soft}`,
  },

  // ── Statuts opérationnels ─────────────────────────────────────────────────
  status: {
    // Tables (Floor Plan)
    tableAvailable:   palette.neutral[200],      // Remplace #E9ECEF
    tableOccupied:    palette.indigo[500],       // Remplace #3B82F6
    tableReserved:    palette.amber[400],
    tableCleaning:    palette.neutral[300],

    // Commandes / KDS
    orderPending:     palette.amber[500],
    orderInKitchen:   palette.indigo[500],
    orderReady:       palette.emerald[500],
    orderServed:      palette.neutral[400],
    orderCancelled:   palette.red[500],

    // Stocks
    stockNormal:      palette.emerald[500],
    stockLow:         palette.amber[500],
    stockCritical:    palette.red[500],

    // RH / Finance
    success:          palette.emerald[600],
    warning:          palette.amber[500],
    danger:           palette.red[600],
    info:             palette.indigo[500],
    neutral:          palette.neutral[400],
  },

  // ── Typographie ───────────────────────────────────────────────────────────
  text: {
    primary:          palette.neutral[900],
    secondary:        palette.neutral[600],
    tertiary:         palette.neutral[500],
    muted:            palette.neutral[500],
    inverse:          palette.neutral[0],
    brand:            palette.gold.DEFAULT,
    danger:           palette.red[600],
    success:          palette.emerald[600],
    warning:          palette.amber[600],
  },

  // ── Bordures ──────────────────────────────────────────────────────────────
  border: {
    default:          palette.neutral[200],
    focus:            palette.gold.DEFAULT,
    danger:           palette.red[500],
    subtle:           'rgba(0, 0, 0, 0.04)',
  },

} as const;

export type SemanticTokens = typeof semanticTokens;

// CSS Custom Properties d'Identité de Marque
// Injectées par BrandingProvider dans :root (style inline)
export function generateBrandCSSVariables(
  tokens: Partial<SemanticTokens> = semanticTokens
): Record<string, string> {
  return {
    '--action-primary':           tokens.action?.primary ?? semanticTokens.action.primary,
    '--action-primary-hover':     tokens.action?.primaryHover ?? semanticTokens.action.primaryHover,
    '--action-primary-fg':        tokens.action?.primaryForeground ?? semanticTokens.action.primaryForeground,
    '--action-danger':            tokens.action?.danger ?? semanticTokens.action.danger,
    '--action-accent':            tokens.action?.accent ?? semanticTokens.action.accent,

    '--text-brand':               tokens.text?.brand ?? semanticTokens.text.brand,
    '--border-focus':             tokens.border?.focus ?? semanticTokens.border.focus,

    '--gradient-primary':         tokens.effects?.gradientPrimary ?? semanticTokens.effects.gradientPrimary,
    '--shadow-card':              tokens.effects?.shadowCard ?? semanticTokens.effects.shadowCard,

    '--font-brand':               'inherit',  // Overridé par BrandingProvider par tenant
    '--font-ui':                  'inherit',

    '--radius-card':              '1.5rem',   // Overridé par BrandingProvider (sm, md, lg, full)
    '--radius-btn':               '1rem',
    '--glass-blur':               '16px',
    '--glass-opacity':            '0.7',
    '--text-on-primary':          '#FFFFFF',  // Calculé dynamiquement via WCAG luminance
  };
}

// CSS Custom Properties Neutres (Thème clair/sombre)
// Gérées EXCLUSIVEMENT par globals.css (:root, [data-theme="dark"], prefers-color-scheme)
// Conservées ici pour les tests, l'introspection et les outils design-system (NON injectées inline).
export function generateNeutralCSSVariables(
  tokens: Partial<SemanticTokens> = semanticTokens
): Record<string, string> {
  return {
    '--surface-bg':               tokens.surface?.background ?? semanticTokens.surface.background,
    '--surface-card':             tokens.surface?.card ?? semanticTokens.surface.card,
    '--surface-modal':            tokens.surface?.modal ?? semanticTokens.surface.modal,
    '--surface-modal-dark':       tokens.surface?.modalDark ?? semanticTokens.surface.modalDark,
    '--surface-sidebar':          tokens.surface?.sidebar ?? semanticTokens.surface.sidebar,
    '--surface-glass':            tokens.surface?.glass ?? semanticTokens.surface.glass,

    '--status-table-available':   tokens.status?.tableAvailable ?? semanticTokens.status.tableAvailable,
    '--status-table-occupied':    tokens.status?.tableOccupied ?? semanticTokens.status.tableOccupied,
    '--status-order-pending':     tokens.status?.orderPending ?? semanticTokens.status.orderPending,
    '--status-order-ready':       tokens.status?.orderReady ?? semanticTokens.status.orderReady,
    '--status-stock-critical':    tokens.status?.stockCritical ?? semanticTokens.status.stockCritical,

    '--status-success':           tokens.status?.success ?? semanticTokens.status.success,
    '--status-warning':           tokens.status?.warning ?? semanticTokens.status.warning,
    '--status-danger':            tokens.status?.danger ?? semanticTokens.status.danger,

    '--text-primary':             tokens.text?.primary ?? semanticTokens.text.primary,
    '--text-secondary':           tokens.text?.secondary ?? semanticTokens.text.secondary,
    '--text-muted':               tokens.text?.muted ?? semanticTokens.text.muted,

    '--border-default':           tokens.border?.default ?? semanticTokens.border.default,
    '--border-subtle':            tokens.border?.subtle ?? semanticTokens.border.subtle,
  };
}

// CSS Custom Properties complètes (rétro-compatibilité globale)
export function generateCSSVariables(
  tokens: Partial<SemanticTokens> = semanticTokens
): Record<string, string> {
  return {
    ...generateBrandCSSVariables(tokens),
    ...generateNeutralCSSVariables(tokens),
  };
}
