'use client';

import React from 'react';
import { useVerticalUI } from '@/shared/providers/VerticalUIProvider';
import type { OverrideableComponent } from '@/shared/plugins/IVerticalUIPlugin';

/**
 * useVerticalComponent
 *
 * Résout le composant à utiliser pour un slot donné.
 * - Si le vertical courant a un override → retourne l'override.
 * - Sinon → retourne le composant partagé par défaut.
 *
 * @example
 *   const StatCard = useVerticalComponent('StatCard', DefaultStatCard);
 *   return <StatCard label="CA" value="12 450 €" />;
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useVerticalComponent<P extends Record<string, any>>(
  name: OverrideableComponent,
  defaultComponent: React.ComponentType<P>
): React.ComponentType<P> {
  const plugin = useVerticalUI();
  return (plugin?.components?.[name] as React.ComponentType<P>) ?? defaultComponent;
}

/**
 * withVerticalOverride
 *
 * HOC transparent — wraps un composant partagé pour qu'il soit automatiquement
 * remplacé par la version verticale si elle existe dans le VerticalUIRegistry.
 *
 * Usage dans les composants partagés (modification minimale, zéro régression) :
 *
 * @example
 *   // En bas de StatCard.tsx :
 *   export const StatCard = withVerticalOverride('StatCard', StatCardBase);
 *
 * Comportement :
 *   - Vertical avec override → StatCard = composant vertical
 *   - Vertical sans override → StatCard = StatCardBase (comportement actuel)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withVerticalOverride<P extends Record<string, any>>(
  name: OverrideableComponent,
  DefaultComponent: React.ComponentType<P>
): React.ComponentType<P> {
  function VerticalAwareComponent(props: P) {
    const plugin = useVerticalUI();
    const Override = plugin?.components?.[name] as React.ComponentType<P> | undefined;
    if (Override) return React.createElement(Override, props);
    return React.createElement(DefaultComponent, props);
  }
  VerticalAwareComponent.displayName = `WithVerticalOverride(${name})`;
  return VerticalAwareComponent;
}
