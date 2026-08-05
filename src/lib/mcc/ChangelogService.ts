import 'server-only';
import { Nexus } from '@/lib/nexus/NexusAdapter';

export type ChangeCategory =
  | 'UI_OVERRIDE'
  | 'FEATURE_FLAG'
  | 'BILLING'
  | 'UPGRADE'
  | 'DEBUG'
  | 'CONFIG'
  | 'MAINTENANCE'
  | 'ROLLOUT'
  | 'CUSTOM';

export type ChangeScope = 'tenant' | 'fleet' | 'pilot';

export interface ChangelogEntry {
  id:             string;
  tenantId:       string;        // '__FLEET__' for global actions
  category:       ChangeCategory;
  action:         string;
  key?:           string;
  before?:        unknown;
  after?:         unknown;
  description:    string;
  appliedBy:      string;        // uid of the MCC operator
  appliedAt:      string;        // ISO 8601
  scope:          ChangeScope;
  affectedCount?: number;
}

export interface ChangelogInput {
  tenantId:       string;
  action:         string;
  key?:           string;
  before?:        unknown;
  after?:         unknown;
  description:    string;
  appliedBy:      string;
  scope:          ChangeScope;
  affectedCount?: number;
  category?:      ChangeCategory; // override auto-detection
}

const KEY_CATEGORY_MAP: Array<[RegExp, ChangeCategory]> = [
  [/^overrides\.ui\.|^theme\.|^branding\./,    'UI_OVERRIDE'],
  [/^overrides\.debug\./,                       'DEBUG'],
  [/^featureFlags\.|^features\.|^capabilities\./,'FEATURE_FLAG'],
  [/^billing\.|^marketplace\./,                 'BILLING'],
  [/^status\.maintenanceMode|^otaBroadcast/,    'MAINTENANCE'],
];

const ACTION_CATEGORY_MAP: Array<[RegExp, ChangeCategory]> = [
  [/UPGRADE|VERSION|OTA_VERSION/,  'UPGRADE'],
  [/MAINTENANCE|OTA_MAINTENANCE/,  'MAINTENANCE'],
  [/ROLLOUT/,                      'ROLLOUT'],
  [/MODULE_ENABLED|MODULE_DISABLED|FEATURE/,'FEATURE_FLAG'],
  [/UI_|THEME_|BRANDING_/,         'UI_OVERRIDE'],
  [/DEBUG/,                        'DEBUG'],
  [/BILLING|INVOICE/,              'BILLING'],
];

export function autoCategory(key: string | undefined, action: string): ChangeCategory {
  if (key) {
    for (const [pattern, cat] of KEY_CATEGORY_MAP) {
      if (pattern.test(key)) return cat;
    }
  }
  for (const [pattern, cat] of ACTION_CATEGORY_MAP) {
    if (pattern.test(action)) return cat;
  }
  return 'CONFIG';
}

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

class ChangelogServiceClass {
  async record(input: ChangelogInput): Promise<ChangelogEntry> {
    const id       = newId();
    const category = input.category ?? autoCategory(input.key, input.action);
    const entry: ChangelogEntry = {
      id,
      tenantId:     input.tenantId,
      category,
      action:       input.action,
      key:          input.key,
      before:       input.before,
      after:        input.after,
      description:  input.description,
      appliedBy:    input.appliedBy,
      appliedAt:    new Date().toISOString(),
      scope:        input.scope,
      affectedCount: input.affectedCount,
    };

    await Nexus.adapter.set(`mcc/changelog/${id}`, entry);
    return entry;
  }

  async getForTenant(tenantId: string, limit = 50, startAfter?: string): Promise<ChangelogEntry[]> {
    return Nexus.adapter.query<ChangelogEntry>('mcc/changelog', {
      where:    [{ field: 'tenantId', operator: '==', value: tenantId }],
      orderBy:  { field: 'appliedAt', direction: 'desc' },
      limit,
      startAfter: startAfter ?? undefined,
    });
  }

  async getFleet(limit = 100, startAfter?: string): Promise<ChangelogEntry[]> {
    return Nexus.adapter.query<ChangelogEntry>('mcc/changelog', {
      orderBy:  { field: 'appliedAt', direction: 'desc' },
      limit,
      startAfter: startAfter ?? undefined,
    });
  }

  async getByCategory(category: ChangeCategory, tenantId?: string, limit = 50, startAfter?: string): Promise<ChangelogEntry[]> {
    const where = tenantId
      ? [{ field: 'category', operator: '==' as const, value: category }, { field: 'tenantId', operator: '==' as const, value: tenantId }]
      : [{ field: 'category', operator: '==' as const, value: category }];
    return Nexus.adapter.query<ChangelogEntry>('mcc/changelog', {
      where,
      orderBy:    { field: 'appliedAt', direction: 'desc' },
      limit,
      startAfter: startAfter ?? undefined,
    });
  }
}

export const ChangelogService = new ChangelogServiceClass();
