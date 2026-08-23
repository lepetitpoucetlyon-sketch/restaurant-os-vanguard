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
  | 'systemtenants'
  | 'forgestudio'
  | 'sectorstudy'
  | 'blindspot'
  | 'qualification'
  | 'derivers'
  | 'scrapecharter';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- ComponentType<any> volontaire : chaque tab a sa propre signature de props
export const MCC_TABS_REGISTRY: Record<MccTabId, ComponentType<any>> = {
  fleet:         dynamic(() => import('./FleetTab').then(m => m.FleetTab), { loading: () => <MCCWidgetSkeleton /> }),
  fleetSidebar:  dynamic(() => import('./FleetSidebar').then(m => m.FleetSidebar)),
  compliance:    dynamic(() => import('./ComplianceTab').then(m => m.ComplianceTab), { loading: () => <MCCWidgetSkeleton /> }),
  intelligence:  dynamic(() => import('./IntelligenceTab').then(m => m.IntelligenceTab), { loading: () => <MCCWidgetSkeleton /> }),
  treasury:      dynamic(() => import('./TreasuryTab').then(m => m.TreasuryTab), { loading: () => <MCCWidgetSkeleton /> }),
  patchcenter:   dynamic(() => import('./PatchCenterTab').then(m => m.PatchCenterTab), { loading: () => <MCCWidgetSkeleton /> }),
  plugins:       dynamic(() => import('./PluginsTab').then(m => m.PluginsTab), { loading: () => <MCCWidgetSkeleton /> }),
  eventbus:      dynamic(() => import('./EventBusTab').then(m => m.EventBusTab), { loading: () => <MCCWidgetSkeleton /> }),
  lifecycle:     dynamic(() => import('./LifecycleTab').then(m => m.LifecycleTab), { loading: () => <MCCWidgetSkeleton /> }),
  tutorial:      dynamic(() => import('./TutorialTab').then(m => m.TutorialTab), { loading: () => <MCCWidgetSkeleton /> }),
  systemtenants: dynamic(() => import('./SystemTenantsTab').then(m => m.SystemTenantsTab), { loading: () => <MCCWidgetSkeleton /> }),
  forgestudio:   dynamic(() => import('./ForgeStudioTab').then(m => m.ForgeStudioTab), { loading: () => <MCCWidgetSkeleton /> }),
  sectorstudy:   dynamic(() => import('./SectorStudyTab').then(m => m.SectorStudyTab), { loading: () => <MCCWidgetSkeleton /> }),
  blindspot:     dynamic(() => import('./BlindSpotTab').then(m => m.BlindSpotTab), { loading: () => <MCCWidgetSkeleton /> }),
  qualification: dynamic(() => import('./QualificationTab').then(m => m.QualificationTab), { loading: () => <MCCWidgetSkeleton /> }),
  derivers:      dynamic(() => import('./DeriversTab').then(m => m.DeriversTab), { loading: () => <MCCWidgetSkeleton /> }),
  scrapecharter: dynamic(() => import('./ScrapeCharterTab').then(m => m.ScrapeCharterTab), { loading: () => <MCCWidgetSkeleton /> }),
};

