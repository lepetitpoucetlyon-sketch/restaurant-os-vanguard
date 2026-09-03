import { BusinessClock } from '@/kernel/time/BusinessClock';
import { empireAudit } from '@/lib/audit';

export type UserRole =
  | 'ADMIN'
  | 'DIRECTION'
  | 'DIRECTEUR'
  | 'MANAGER'
  | 'COMPTABLE'
  | 'SERVEUR'
  | 'CUISINIER'
  | 'CHEF_RANG'
  | 'BARMAN'
  | 'HOTESSE'
  | 'PLONGEUR'
  | string;

export interface RetroactiveContext {
  tenantId: string;
  operatorId: string;
  operatorRole: UserRole;
  occurredAt: string;
  recordedAt?: string;
  reason?: string;
  actionType: string;
}

export interface RetroactiveAuditMarker {
  isRetroactive: boolean;
  lagHours: number;
  occurredAt: string;
  recordedAt: string;
  authorizedBy: string;
  authorizedRole: string;
  reason?: string;
}

export class UnauthorizedRetroactiveActionError extends Error {
  constructor(message: string, public readonly details: Record<string, unknown>) {
    super(message);
    this.name = 'UnauthorizedRetroactiveActionError';
  }
}

export class RetroactiveActionGuard {
  /**
   * Valide les autorisations RBAC selon le décalage temporel (Lot 6 - M6/M7).
   * - lag <= 2h : Ouvert à tout personnel opérationnel
   * - 2h < lag <= 48h : Rôle MANAGER ou ADMIN requis + motif obligatoire
   * - lag > 48h : Rôle DIRECTION ou ADMIN requis + motif obligatoire
   */
  public static evaluate(ctx: RetroactiveContext): RetroactiveAuditMarker {
    const recordedAt = ctx.recordedAt ?? new Date().toISOString();
    const lagHours = BusinessClock.lagHours({
      occurredAt: ctx.occurredAt,
      recordedAt,
    });

    const isRetroactive = lagHours > 2;
    const normalizedRole = (ctx.operatorRole || '').toUpperCase();

    // Règle 1 : Moins de 2h de décalage -> autorisé pour tous
    if (lagHours <= 2) {
      return {
        isRetroactive: false,
        lagHours,
        occurredAt: ctx.occurredAt,
        recordedAt,
        authorizedBy: ctx.operatorId,
        authorizedRole: ctx.operatorRole,
        reason: ctx.reason,
      };
    }

    // Règle 2 : Motif obligatoire pour toute action rétroactive (> 2h)
    if (!ctx.reason || ctx.reason.trim().length < 5) {
      throw new UnauthorizedRetroactiveActionError(
        `[RetroactiveActionGuard] Un motif explicite (au moins 5 caractères) est requis pour toute action différée de plus de 2 heures (décalage actuel : ${Math.round(lagHours)}h).`,
        { lagHours, operatorId: ctx.operatorId, role: ctx.operatorRole }
      );
    }

    // Règle 3 : Entre 2h et 48h -> Rôle MANAGER, DIRECTEUR ou ADMIN requis
    if (lagHours <= 48) {
      const allowedRoles = ['MANAGER', 'DIRECTEUR', 'DIRECTION', 'ADMIN', 'COMPTABLE'];
      if (!allowedRoles.includes(normalizedRole)) {
        throw new UnauthorizedRetroactiveActionError(
          `[RetroactiveActionGuard] Rôle insuffisant pour action rétroactive de ${Math.round(lagHours)}h (rôles autorisés: ${allowedRoles.join(', ')}, rôle fourni: ${ctx.operatorRole})`,
          { lagHours, requiredRoles: allowedRoles, providedRole: ctx.operatorRole }
        );
      }
    } else {
      // Règle 4 : Plus de 48h -> Rôle DIRECTION ou ADMIN strict
      const allowedRoles = ['DIRECTION', 'DIRECTEUR', 'ADMIN'];
      if (!allowedRoles.includes(normalizedRole)) {
        throw new UnauthorizedRetroactiveActionError(
          `[RetroactiveActionGuard] Rôle de Direction ou Administrateur requis pour toute régularisation au-delà de 48h (décalage: ${Math.round(lagHours)}h)`,
          { lagHours, requiredRoles: allowedRoles, providedRole: ctx.operatorRole }
        );
      }
    }

    // Audit trail de haute traçabilité
    empireAudit.log({
      module: 'security',
      action: 'RETROACTIVE_ACTION_AUTHORIZED',
      details: {
        actionType: ctx.actionType,
        operatorId: ctx.operatorId,
        role: ctx.operatorRole,
        lagHours: Math.round(lagHours),
        reason: ctx.reason,
        occurredAt: ctx.occurredAt,
      },
      severity: lagHours > 48 ? 'high' : 'medium',
      timestamp: new Date(),
    });

    return {
      isRetroactive: true,
      lagHours,
      occurredAt: ctx.occurredAt,
      recordedAt,
      authorizedBy: ctx.operatorId,
      authorizedRole: ctx.operatorRole,
      reason: ctx.reason,
    };
  }
}
