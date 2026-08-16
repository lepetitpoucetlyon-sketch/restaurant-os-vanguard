import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeatureFlagService, FeatureFlagRule } from './FeatureFlagService';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';

describe('🚩 FeatureFlagService — Rollout Progressif & Pilotage MCC', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const sampleRule: FeatureFlagRule = {
    flagKey: 'flag_dynamic_yield_v2',
    enabled: true,
    rolloutPercentage: 50,
    allowedTenantIds: ['tenant_vip_pilot'],
    blockedTenantIds: ['tenant_banned_01'],
  };

  it('devrait retourner false si le flag global est désactivé', () => {
    const disabledRule: FeatureFlagRule = { ...sampleRule, enabled: false };
    expect(FeatureFlagService.isFeatureEnabled(disabledRule, 'tenant_vip_pilot')).toBe(false);
  });

  it('devrait retourner false si le tenant est dans la liste blockedTenantIds', () => {
    expect(FeatureFlagService.isFeatureEnabled(sampleRule, 'tenant_banned_01')).toBe(false);
  });

  it('devrait retourner true si le tenant est dans la liste allowedTenantIds (override)', () => {
    expect(FeatureFlagService.isFeatureEnabled(sampleRule, 'tenant_vip_pilot')).toBe(true);
  });

  it('devrait évaluer le rollout en pourcentage de manière déterministe', () => {
    const rule100: FeatureFlagRule = { flagKey: 'test_100', enabled: true, rolloutPercentage: 100 };
    const rule0: FeatureFlagRule = { flagKey: 'test_0', enabled: true, rolloutPercentage: 0 };

    expect(FeatureFlagService.isFeatureEnabled(rule100, 'tenant_random_abc')).toBe(true);
    expect(FeatureFlagService.isFeatureEnabled(rule0, 'tenant_random_abc')).toBe(false);
  });

  it('devrait persister la mise à jour d\'un flag et émettre un log d\'audit', async () => {
    const spySet = vi.spyOn(Nexus.adapter, 'set').mockResolvedValueOnce(undefined);
    const spyAudit = vi.spyOn(empireAudit, 'log');

    await FeatureFlagService.toggleFeatureFlag(sampleRule, 'admin_super_mcc');

    expect(spySet).toHaveBeenCalledWith(
      'mcc/featureFlags/flag_dynamic_yield_v2',
      expect.objectContaining({
        flagKey: 'flag_dynamic_yield_v2',
        updatedBy: 'admin_super_mcc',
      })
    );

    expect(spyAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        module: 'system',
        action: 'MCC_FEATURE_FLAG_TOGGLED',
      })
    );
  });
});
