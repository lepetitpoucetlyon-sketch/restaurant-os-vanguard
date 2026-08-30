import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import { MCCWidgetSkeleton } from '../components/MCCWidgetSkeleton';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- ComponentType<any> volontaire : chaque tab a sa propre signature de props
export const MCC_CORE_TABS: Record<string, ComponentType<any>> = {
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
};
