/**
 * ChangelogService — tests unitaires
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { ChangelogService, autoCategory } from '@/lib/mcc/ChangelogService';
import type { ChangelogEntry, ChangelogInput } from '@/lib/mcc/ChangelogService';

vi.mock('server-only', () => ({}));

const mockSet = vi.fn().mockResolvedValue(undefined);
const mockQuery = vi.fn().mockResolvedValue([]);

const BASE_INPUT: ChangelogInput = {
  tenantId:    'tenant-001',
  action:      'CONFIG_UPDATE',
  description: 'Test entry',
  appliedBy:   'uid-admin',
  scope:       'tenant',
};

beforeEach(() => {
  mockSet.mockClear();
  mockQuery.mockClear();
  vi.spyOn(Nexus.adapter, 'set').mockImplementation(mockSet as typeof Nexus.adapter.set);
  vi.spyOn(Nexus.adapter, 'query').mockImplementation(mockQuery as typeof Nexus.adapter.query);
});

// ── autoCategory ─────────────────────────────────────────────────────────────

describe('autoCategory()', () => {
  it.each([
    ['overrides.ui.primaryColor', 'CONFIG_UPDATE', 'UI_OVERRIDE'],
    ['overrides.debug.verbose',   'CONFIG_UPDATE', 'DEBUG'],
    ['featureFlags.kds',          'CONFIG_UPDATE', 'FEATURE_FLAG'],
    ['capabilities.loyalty',      'CONFIG_UPDATE', 'FEATURE_FLAG'],
    ['billing.tier',              'CONFIG_UPDATE', 'BILLING'],
    [undefined,                   'UPGRADE_VERSION','UPGRADE'],
    [undefined,                   'ROLLOUT_PATCH',  'ROLLOUT'],
    [undefined,                   'MODULE_ENABLED', 'FEATURE_FLAG'],
    [undefined,                   'THEME_COLOR',    'UI_OVERRIDE'],
    [undefined,                   'DEBUG_LOGS',     'DEBUG'],
    [undefined,                   'BILLING_UPDATE', 'BILLING'],
    [undefined,                   'RANDOM_ACTION',  'CONFIG'],
  ])('key=%s action=%s → %s', (key, action, expected) => {
    expect(autoCategory(key as string | undefined, action)).toBe(expected);
  });
});

// ── record() ─────────────────────────────────────────────────────────────────

describe('ChangelogService.record()', () => {
  it('écrit l\'entrée dans mcc/changelog/{id} et la retourne', async () => {
    const entry = await ChangelogService.record(BASE_INPUT);

    expect(mockSet).toHaveBeenCalledOnce();
    const [path, data] = mockSet.mock.calls[0] as [string, ChangelogEntry];

    expect(path).toMatch(/^mcc\/changelog\//);
    expect(data.tenantId).toBe('tenant-001');
    expect(data.appliedBy).toBe('uid-admin');
    expect(data.scope).toBe('tenant');
    expect(data.category).toBe('CONFIG');
    expect(typeof data.appliedAt).toBe('string');
    expect(entry).toMatchObject({ tenantId: 'tenant-001', scope: 'tenant' });
  });

  it('utilise la catégorie fournie en override', async () => {
    const entry = await ChangelogService.record({ ...BASE_INPUT, category: 'MAINTENANCE' });
    expect(entry.category).toBe('MAINTENANCE');
  });

  it('détecte la catégorie automatiquement depuis la key', async () => {
    const entry = await ChangelogService.record({ ...BASE_INPUT, key: 'billing.nextDue' });
    expect(entry.category).toBe('BILLING');
  });

  it('stocke before/after et affectedCount si fournis', async () => {
    const entry = await ChangelogService.record({
      ...BASE_INPUT,
      key:           'featureFlags.kds',
      before:        false,
      after:         true,
      affectedCount: 3,
    });
    expect(entry.before).toBe(false);
    expect(entry.after).toBe(true);
    expect(entry.affectedCount).toBe(3);
    expect(entry.category).toBe('FEATURE_FLAG');
  });
});

// ── getForTenant() ────────────────────────────────────────────────────────────

describe('ChangelogService.getForTenant()', () => {
  it('query mcc/changelog filtré par tenantId', async () => {
    mockQuery.mockResolvedValue([{ id: 'e1' }] as unknown[]);
    const result = await ChangelogService.getForTenant('tenant-abc', 20);
    const [col, opts] = mockQuery.mock.calls[0]!;
    expect(col).toBe('mcc/changelog');
    expect(opts?.where?.[0]).toMatchObject({ field: 'tenantId', operator: '==', value: 'tenant-abc' });
    expect(opts?.limit).toBe(20);
    expect(result).toHaveLength(1);
  });

  it('utilise limit=50 par défaut', async () => {
    await ChangelogService.getForTenant('t');
    const opts = mockQuery.mock.calls[0]![1];
    expect(opts?.limit).toBe(50);
  });
});

// ── getFleet() ────────────────────────────────────────────────────────────────

describe('ChangelogService.getFleet()', () => {
  it('query sans filtre tenantId, triée desc', async () => {
    await ChangelogService.getFleet(30);
    const [col, opts] = mockQuery.mock.calls[0]!;
    expect(col).toBe('mcc/changelog');
    expect(opts?.where).toBeUndefined();
    expect(opts?.orderBy).toMatchObject({ field: 'appliedAt', direction: 'desc' });
    expect(opts?.limit).toBe(30);
  });
});

// ── getByCategory() ───────────────────────────────────────────────────────────

describe('ChangelogService.getByCategory()', () => {
  it('filtre par catégorie uniquement si pas de tenantId', async () => {
    await ChangelogService.getByCategory('BILLING');
    const opts = mockQuery.mock.calls[0]![1];
    expect(opts?.where).toHaveLength(1);
    expect(opts?.where?.[0]).toMatchObject({ field: 'category', value: 'BILLING' });
  });

  it('filtre par catégorie + tenantId si fourni', async () => {
    await ChangelogService.getByCategory('UPGRADE', 'tenant-x');
    const opts = mockQuery.mock.calls[0]![1];
    expect(opts?.where).toHaveLength(2);
    const fields = opts!.where!.map(w => w.field);
    expect(fields).toContain('category');
    expect(fields).toContain('tenantId');
  });
});
