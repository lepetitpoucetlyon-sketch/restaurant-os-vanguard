'use client';

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import { MCCWidgetSkeleton } from '../components/MCCWidgetSkeleton';

/**
 * MCC_TABS_REGISTRY — registre unique des tabs dynamiques du MCC.
 *
 * Consolide les 11 imports dynamiques anciennement dispersés dans page.tsx
 * (décomposition anti god-file : -10 imports du fan-out).
 *
 * Chaque tab est chargé à la demande avec skeleton fallback.
 */
export type MccTabId =
  | 'fleet'
  | 'fleetSidebar'
  | 'compliance'
  | 'intelligence'
  | 'treasury'
  | 'patchcenter'
  | 'plugins'
  | 'eventbus'
  | 'lifecycle'
  | 'tutorial'
  | 'systemtenants';

const skeleton = { loading: () => <MCCWidgetSkeleton /> };

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- ComponentType<any> volontaire : chaque tab a sa propre signature de props
export const MCC_TABS_REGISTRY: Record<MccTabId, ComponentType<any>> = {
  fleet:         dynamic(() => import('./FleetTab').then(m => m.FleetTab), skeleton),
  fleetSidebar:  dynamic(() => import('./FleetSidebar').then(m => m.FleetSidebar)),
  compliance:    dynamic(() => import('./ComplianceTab').then(m => m.ComplianceTab), skeleton),
  intelligence:  dynamic(() => import('./IntelligenceTab').then(m => m.IntelligenceTab), skeleton),
  treasury:      dynamic(() => import('./TreasuryTab').then(m => m.TreasuryTab), skeleton),
  patchcenter:   dynamic(() => import('./PatchCenterTab').then(m => m.PatchCenterTab), skeleton),
  plugins:       dynamic(() => import('./PluginsTab').then(m => m.PluginsTab), skeleton),
  eventbus:      dynamic(() => import('./EventBusTab').then(m => m.EventBusTab), skeleton),
  lifecycle:     dynamic(() => import('./LifecycleTab').then(m => m.LifecycleTab), skeleton),
  tutorial:      dynamic(() => import('./TutorialTab').then(m => m.TutorialTab), skeleton),
  systemtenants: dynamic(() => import('./SystemTenantsTab').then(m => m.SystemTenantsTab), skeleton),
};
