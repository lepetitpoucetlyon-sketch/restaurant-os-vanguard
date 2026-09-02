import { Nexus } from '@/lib/nexus/NexusAdapter';

export type ChangeCategory =
  | 'GENESIS'
  | 'DEV_HOTFIX'
  | 'CORE_UPDATE'
  | 'EVOLUTION'
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
export type AuthorType = 'developer' | 'ai_agent' | 'client' | 'system';

export interface ChangelogEntry {
  id:             string;
  tenantId:       string;        // '__FLEET__' for global actions
  category:       ChangeCategory;
  action:         string;
  title?:         string;
  description:    string;
  key?:           string;
  before?:        unknown;
  after?:         unknown;
  appliedBy:      string;        // uid / email of author
  authorName?:    string;        // human readable display name
  authorType?:    AuthorType;    // developer, ai_agent, client, system
  tags?:          string[];
  commitHash?:    string;        // git-style short hash for UI identification
  appliedAt:      string;        // ISO 8601
  scope:          ChangeScope;
  affectedCount?: number;
}

export interface ChangelogInput {
  tenantId:       string;
  action:         string;
  title?:         string;
  description:    string;
  key?:           string;
  before?:        unknown;
  after?:         unknown;
  appliedBy:      string;
  authorName?:    string;
  authorType?:    AuthorType;
  tags?:          string[];
  scope:          ChangeScope;
  affectedCount?: number;
  category?:      ChangeCategory; // override auto-detection
}

const KEY_CATEGORY_MAP: Array<[RegExp, ChangeCategory]> = [
  [/^overrides\.ui\.|^theme\.|^branding\./,     'UI_OVERRIDE'],
  [/^overrides\.debug\./,                        'DEBUG'],
  [/^featureFlags\.|^features\.|^capabilities\./,'FEATURE_FLAG'],
  [/^billing\.|^marketplace\./,                  'BILLING'],
  [/^status\.maintenanceMode|^otaBroadcast/,     'MAINTENANCE'],
];

const ACTION_CATEGORY_MAP: Array<[RegExp, ChangeCategory]> = [
  [/GENESIS|SEED|CREATE_TENANT/,                 'GENESIS'],
  [/HOTFIX|DEV_PATCH|BUG_FIX|CODE_FIX/,          'DEV_HOTFIX'],
  [/CORE_UPDATE|PLATFORM_UPDATE/,                'CORE_UPDATE'],
  [/EVOLUTION|NEW_FEATURE|ADD_MODULE/,           'EVOLUTION'],
  [/UPGRADE|VERSION|OTA_VERSION/,                'UPGRADE'],
  [/MAINTENANCE|OTA_MAINTENANCE/,                'MAINTENANCE'],
  [/ROLLOUT/,                                    'ROLLOUT'],
  [/MODULE_ENABLED|MODULE_DISABLED|FEATURE/,     'FEATURE_FLAG'],
  [/UI_|THEME_|BRANDING_/,                       'UI_OVERRIDE'],
  [/DEBUG/,                                      'DEBUG'],
  [/BILLING|INVOICE/,                            'BILLING'],
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

export function autoAuthorType(appliedBy: string): AuthorType {
  if (!appliedBy) return 'system';
  if (appliedBy.startsWith('ai-agent:') || appliedBy.includes('ai') || appliedBy.includes('agent')) return 'ai_agent';
  if (appliedBy.includes('system') || appliedBy === 'seeder') return 'system';
  if (appliedBy.includes('dev') || appliedBy.includes('mcc') || appliedBy.includes('admin@restaurant-os')) return 'developer';
  return 'client';
}

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function generateShortHash(): string {
  return Math.random().toString(36).substring(2, 9);
}

class ChangelogServiceClass {
  async record(input: ChangelogInput): Promise<ChangelogEntry> {
    const id         = newId();
    const category   = input.category ?? autoCategory(input.key, input.action);
    const authorType = input.authorType ?? autoAuthorType(input.appliedBy);
    const commitHash = generateShortHash();
    
    const entry: ChangelogEntry = {
      id,
      tenantId:       input.tenantId,
      category,
      action:         input.action,
      title:          input.title || input.description.slice(0, 80),
      description:    input.description,
      key:            input.key,
      before:         input.before,
      after:          input.after,
      appliedBy:      input.appliedBy,
      authorName:     input.authorName || input.appliedBy.split('@')[0],
      authorType,
      tags:           input.tags || [category.toLowerCase()],
      commitHash,
      appliedAt:      new Date().toISOString(),
      scope:          input.scope,
      affectedCount:  input.affectedCount,
    };

    await Nexus.adapter.set(`mcc/changelog/${id}`, entry);

    // ── Émission sur le NexusEventBus (Canal #3 ADR-015) ───────────────
    try {
      const { NexusEventBus } = await import('@/shared/eventBus/NexusEventBus');
      await NexusEventBus.emit('mcc.changelog_recorded', {
        v: 1,
        id,
        tenantId: entry.tenantId,
        category: entry.category,
        action: entry.action,
        title: entry.title,
        description: entry.description,
        appliedBy: entry.appliedBy,
        authorType: entry.authorType || 'system',
        scope: entry.scope,
        appliedAt: entry.appliedAt,
      });
    } catch {
      // Best effort non-bloquant
    }

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

  /**
   * 🤖 Ingestion contextuelle pour l'Agent IA Support :
   * Récupère les dernières modifications pour le tenant ET les dernières MAJ de flotte
   * et formate un bloc de contexte dense et chronologique pour le prompt de l'agent.
   */
  async getRecentContextForAI(tenantId: string, limit = 10): Promise<string> {
    try {
      const [tenantLogs, fleetLogs] = await Promise.all([
        this.getForTenant(tenantId, limit),
        this.getForTenant('__FLEET__', 5),
      ]);

      const all = [...tenantLogs, ...fleetLogs]
        .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())
        .slice(0, limit);

      if (all.length === 0) {
        return "Aucun historique de modification enregistré pour ce tenant.";
      }

      return all.map(entry => {
        const dateStr = entry.appliedAt.slice(0, 16).replace('T', ' ');
        const author = entry.authorName || entry.appliedBy;
        const authorType = entry.authorType || 'system';
        const title = entry.title || entry.action;
        return `• [${dateStr}] [${entry.category}] (${authorType}: ${author}) : ${title} — ${entry.description}`;
      }).join('\n');
    } catch {
      return "Historique des modifications indisponible.";
    }
  }
}

export const ChangelogService = new ChangelogServiceClass();
