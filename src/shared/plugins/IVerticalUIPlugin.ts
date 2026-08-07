import type React from 'react';
import type { PlatformVariant } from '@/domain/schemas/tenant';

// ── Slots surchargeables ──────────────────────────────────────────────────────

export type OverrideableComponent =
  | 'StatCard'
  | 'PageHeader'
  | 'EmptyState'
  | 'FilterBar'
  | 'ActionToolbar'
  | 'ContentSection'
  | 'SectionHeader'
  | 'LoadingState'
  | 'StatusBadge'
  | 'SupportHelpWidget';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ComponentOverrides = Partial<Record<OverrideableComponent, React.ComponentType<any>>>;

// ── Contrat IVerticalUIPlugin ─────────────────────────────────────────────────

export interface IVerticalUIPlugin {
  readonly variant: PlatformVariant;

  /**
   * Layout préféré du vertical.
   * Utilisé comme fallback dans LayoutResolver si le tenant n'a pas de layoutType explicite.
   */
  readonly preferredLayout?: 'sidebar' | 'topbar' | 'kiosk' | 'fullscreen' | 'default';

  /**
   * Surcharges de composants partagés.
   * Partiel : seuls les composants listés sont remplacés, les autres restent les defaults partagés.
   * Ex : { StatCard: GarageStatCard, PageHeader: GaragePageHeader }
   */
  readonly components?: ComponentOverrides;

  /**
   * CSS vars scoped par route — injectés sur le wrapper DOM (pas sur :root).
   * La route la plus longue correspondant au pathname gagne (most specific wins).
   * Ex : { '/pos': { '--radius-card': '0.25rem' }, '/repairs': { '--radius-card': '0.25rem' } }
   */
  readonly scopedTokens?: Record<string, Record<string, string>>;

  /**
   * Templates de pages entières par route.
   * Enregistré pour usage futur — non résolu par VerticalUIProvider en Phase G.
   */
  readonly pageTemplates?: Record<string, React.ComponentType<unknown>>;
}
