import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import { MCCWidgetSkeleton } from '../components/MCCWidgetSkeleton';

export const MCC_FORGE_TABS: Record<string, ComponentType<any>> = {
  systemtenants: dynamic(() => import('./SystemTenantsTab').then(m => m.SystemTenantsTab), { loading: () => <MCCWidgetSkeleton /> }),
  forgestudio:   dynamic(() => import('./ForgeStudioTab').then(m => m.ForgeStudioTab), { loading: () => <MCCWidgetSkeleton /> }),
  sectorstudy:   dynamic(() => import('./SectorStudyTab').then(m => m.SectorStudyTab), { loading: () => <MCCWidgetSkeleton /> }),
  blindspot:     dynamic(() => import('./BlindSpotTab').then(m => m.BlindSpotTab), { loading: () => <MCCWidgetSkeleton /> }),
  qualification: dynamic(() => import('./QualificationTab').then(m => m.QualificationTab), { loading: () => <MCCWidgetSkeleton /> }),
  derivers:      dynamic(() => import('./DeriversTab').then(m => m.DeriversTab), { loading: () => <MCCWidgetSkeleton /> }),
  scrapecharter: dynamic(() => import('./ScrapeCharterTab').then(m => m.ScrapeCharterTab), { loading: () => <MCCWidgetSkeleton /> }),
};
