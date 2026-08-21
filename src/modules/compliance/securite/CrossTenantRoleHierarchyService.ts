import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export type HierarchyRole = 'super_admin_mcc' | 'franchisor_executive' | 'regional_manager' | 'local_store_manager' | 'cashier_staff';

const ROLE_RANK: Record<HierarchyRole, number> = {
  super_admin_mcc: 100,
  franchisor_executive: 80,
  regional_manager: 60,
  local_store_manager: 40,
  cashier_staff: 20,
};

export interface RoleDelegationRequest {
  masterAdminId: string;
  masterRole: HierarchyRole;
  targetTenantId: string;
  assigneeUserId: string;
  roleToAssign: HierarchyRole;
}

export interface DelegationResult {
  isPermitted: boolean;
  rejectReason?: string;
  assignedRole?: HierarchyRole;
  delegatedAt?: number;
}

/**
 * CrossTenantRoleHierarchyService — Angle mort MCC-D1.
 * Délégation et hiérarchie granulaire des rôles RBAC cross-tenant (SuperAdmin > Franchisé > Directeur Régional > Manager > Équipier).
 */
export class CrossTenantRoleHierarchyService {
  static delegateRole(req: RoleDelegationRequest): DelegationResult {
    const masterRank = ROLE_RANK[req.masterRole] ?? 0;
    const targetRank = ROLE_RANK[req.roleToAssign] ?? 0;

    if (masterRank <= targetRank) {
      return {
        isPermitted: false,
        rejectReason: `Privilèges insuffisants : un ${req.masterRole} ne peut pas assigner le rôle ${req.roleToAssign}`,
      };
    }

    NexusEventBus.emit('security.cross_tenant_role_delegated', {
      v: 1,
      masterAdminId: req.masterAdminId,
      targetTenantId: req.targetTenantId,
      assignedRole: req.roleToAssign,
      delegatedAt: Date.now(),
    });

    return {
      isPermitted: true,
      assignedRole: req.roleToAssign,
      delegatedAt: Date.now(),
    };
  }
}
