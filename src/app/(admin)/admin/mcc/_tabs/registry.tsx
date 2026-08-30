'use client';

import type { ComponentType } from 'react';
import { MCC_CORE_TABS } from './mccCoreTabsRegistry';
import { MCC_FORGE_TABS } from './mccForgeTabsRegistry';

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
  ...MCC_CORE_TABS,
  ...MCC_FORGE_TABS,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- coercion vers signature homogène de tabs hétérogènes
} as Record<MccTabId, ComponentType<any>>;
