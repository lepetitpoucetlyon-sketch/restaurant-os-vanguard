import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';
import { PERMISSION_ROLE_LEVELS } from '@/kernel/nexus/contracts/permissions.types';

interface UserRecord {
  role?: string;
  [key: string]: unknown;
}

/**
 * ROLE_HIERARCHY — calqué exactement sur PERMISSION_ROLE_LEVELS.
 *
 * ⚠️  Aucun rôle 'super_admin' ni 'admin' ici :
 *   - 'super_admin' n'existe plus (renommé → 'proprietaire' dans le RBAC tenant).
 *   - Le super admin MCC opère via isMCCMode() / FLEET_OPERATOR, PAS via ce guard.
 *
 * Échelle : 10 plongeur · 20 commis · 30 · 40 · 50 · 60 · 70 · 80 · 100 proprietaire
 */
const ROLE_HIERARCHY: Record<string, number> = {
  ...PERMISSION_ROLE_LEVELS,
};

export function hasMinimumRole(role: string | undefined, requiredRole: string): boolean {
  if (!role) return false;
  const roleLevel = ROLE_HIERARCHY[role] ?? 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? 0;
  return roleLevel >= requiredLevel;
}

/**
 * withRoleGuard — Middleware RBAC de défense en profondeur pour les handlers EventBus.
 *
 * Vérifie le rôle de l'émetteur (ou de l'opérateur via Nexus) avant d'exécuter la logique métier.
 */
export function withRoleGuard<P extends { tenantId: string; operatorId?: string; emitterRole?: string }>(
  requiredRoleOrRoles: string | string[],
  handler: (payload: P) => Promise<void> | void
): (payload: P) => Promise<void> {
  const allowedRoles = Array.isArray(requiredRoleOrRoles)
    ? requiredRoleOrRoles
    : [requiredRoleOrRoles];
  const requiredRole = Array.isArray(requiredRoleOrRoles) ? requiredRoleOrRoles[0] : requiredRoleOrRoles;

  return async (payload: P) => {
    let effectiveRole = payload.emitterRole;

    if (!effectiveRole && payload.operatorId) {
      try {
        const user = await Nexus.adapter.get<UserRecord>(
          `tenants/${payload.tenantId}/users/${payload.operatorId}`
        );
        effectiveRole = user?.role;
      } catch (err) {
        logger.warn(`[RoleGuard] Impossible de lire le rôle de ${payload.operatorId}`, err);
      }
    }

    if (effectiveRole) {
      const isAllowed = allowedRoles.includes(effectiveRole) || hasMinimumRole(effectiveRole, requiredRole);
      if (!isAllowed) {
        logger.warn(`[RoleGuard] Accès refusé — event bloqué. Rôle actuel: ${effectiveRole}, requis: ${requiredRole}`);
        empireAudit.log({
          module: 'security',
          action: 'ROLE_GUARD_BLOCKED',
          details: {
            operatorId: payload.operatorId,
            actualRole: effectiveRole,
            requiredRole,
            tenantId: payload.tenantId,
          },
          severity: 'high',
          timestamp: new Date(),
        });
        return;
      }
    }

    await handler(payload);
  };
}
