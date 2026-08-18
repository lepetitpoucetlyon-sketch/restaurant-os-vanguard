import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setupOwnerAccount } from '@/lib/mcc/provisioning/steps/provisioningSteps';
import { PERMISSION_ROLE_LEVELS, PermissionRole } from '@nexus/contracts/permissions.types';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { MockAdapter } from '@/lib/adapters/MockAdapter';
import { UniversalSystemPromptBuilder } from '@/modules/intelligence/services/UniversalSystemPromptBuilder';

describe('V1-RBAC & MCC Provisioning Compliance', () => {

  it('provisions tenant admin with a valid PermissionRole (level 100)', () => {
    expect(PERMISSION_ROLE_LEVELS['admin']).toBe(100);
    expect(PERMISSION_ROLE_LEVELS['directeur']).toBe(90);
  });

  it('UniversalSystemPromptBuilder.resolveRoleLevel resolves admin to 100', () => {
    expect(UniversalSystemPromptBuilder.resolveRoleLevel('admin')).toBe(100);
    expect(UniversalSystemPromptBuilder.resolveRoleLevel('ADMIN')).toBe(100);
    expect(UniversalSystemPromptBuilder.resolveRoleLevel('directeur')).toBe(90);
    expect(UniversalSystemPromptBuilder.resolveRoleLevel('manager')).toBe(70);
    expect(UniversalSystemPromptBuilder.resolveRoleLevel('comptable')).toBe(60);
    expect(UniversalSystemPromptBuilder.resolveRoleLevel('serveur')).toBe(40);
  });

  it('UniversalSystemPromptBuilder.resolveRoleLevel fail-secures unknown roles to 10', () => {
    expect(UniversalSystemPromptBuilder.resolveRoleLevel('hacker')).toBe(10);
    expect(UniversalSystemPromptBuilder.resolveRoleLevel('unknown_role')).toBe(10);
    expect(UniversalSystemPromptBuilder.resolveRoleLevel(undefined)).toBe(10);
  });
});
