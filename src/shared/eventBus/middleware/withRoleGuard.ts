import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

interface UserRecord {
  role?: string;
  [key: string]: unknown;
}

const ROLE_HIERARCHY: Record<string, number> = {
  admin: 100,
  directeur: 80,
  comptable: 70,
  manager: 60,
  chef_rang: 40,
  serveur: 30,
  chef_cuisinier: 40,
  cuisinier: 30,
  barman: 30,
  hotesse: 20,
  plongeur: 10,
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
