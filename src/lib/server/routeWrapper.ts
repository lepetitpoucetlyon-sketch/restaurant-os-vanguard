import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { runWithServerTenant, type ServerTenantContext } from './ServerTenantStorage';
import {
  requireTenantAdmin,
  requireTenantRole,
  requireTenantUser,
  requireMccLevel,
  requireFleetAdmin,
  isDenied,
  type AdminCaller,
  type MccRole,
} from './adminAuthGuard';
import type { PermissionRole } from '@/kernel/contracts';
import { runWithCorrelation } from '@/shared/eventBus/CorrelationContext';
import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';

export interface TenantRouteContext {
  tenantId: string;
  caller: AdminCaller & { tenantId: string };
  correlationId: string;
}

export interface MccRouteContext {
  caller: AdminCaller;
  correlationId: string;
}

export interface PublicRouteContext {
  correlationId: string;
  resolvedTenantId?: string;
}

export interface WebhookRouteContext {
  correlationId: string;
}

export interface TenantRouteOptions {
  minRole?: PermissionRole;
  requireAdmin?: boolean;
}

export interface MccRouteOptions {
  minLevel?: MccRole;
  requireFleetAdmin?: boolean;
}

export interface WebhookRouteOptions {
  verifySignature: (req: Request | NextRequest) => Promise<boolean> | boolean;
}

/**
 * Extrait ou génère l'identifiant de corrélation de la requête HTTP.
 */
function resolveCorrelationId(req: Request): string {
  return (
    req.headers.get('x-correlation-id') ??
    req.headers.get('x-request-id') ??
    `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  );
}

/**
 * 🏢 withTenantRoute — Wrapper d'audience TENANT
 *
 * Propriétés garanties :
 *  1. Authentification stricte via JWT/PIN claims.
 *  2. Résolution du tenantId à partir des claims vérifiés ou du sous-domaine validé (jamais depuis le body).
 *  3. Ancrage AsyncLocalStorage du tenant via `runWithServerTenant` pour TOUTE la durée de vie de la requête.
 *  4. Propagation transparente du correlation-id.
 *  5. Rejet immédiat (401/403/404) si absence de contexte ou rôle insuffisant.
 */
export function withTenantRoute<T = unknown>(
  handler: (req: NextRequest, ctx: TenantRouteContext, routeParams?: T) => Promise<Response | NextResponse>,
  options: TenantRouteOptions = {},
) {
  return async (req: Request | NextRequest, routeParams?: T): Promise<Response | NextResponse> => {
    const correlationId = resolveCorrelationId(req);

    return runWithCorrelation({ correlationId }, async () => {
      let authResult: (AdminCaller & { tenantId: string }) | NextResponse;

      if (options.requireAdmin) {
        authResult = await requireTenantAdmin(req);
      } else if (options.minRole) {
        authResult = await requireTenantRole(req, options.minRole);
      } else {
        authResult = await requireTenantUser(req);
      }

      if (isDenied(authResult)) {
        return authResult;
      }

      const caller = authResult as AdminCaller & { tenantId: string };
      const tenantContext: ServerTenantContext = {
        tenantId: caller.tenantId,
        role: caller.role,
        userId: caller.uid,
        isMcc: ['mcc_super_admin', 'mcc_admin', 'mcc_support', 'mcc_readonly', 'fleet_admin'].includes(caller.role),
      };

      return runWithServerTenant(tenantContext, async () => {
        try {
          return await handler(
            req as NextRequest,
            {
              tenantId: caller.tenantId,
              caller,
              correlationId,
            },
            routeParams,
          );
        } catch (error) {
          const err = toError(error);
          logger.error(`[withTenantRoute] Erreur non gérée pour ${caller.tenantId}: ${err.message}`, {
            stack: err.stack,
            correlationId,
          });
          return NextResponse.json(
            { error: 'Internal Server Error', correlationId },
            { status: 500, headers: { 'x-correlation-id': correlationId } },
          );
        }
      });
    });
  };
}

/**
 * 🏛️ withMccRoute — Wrapper d'audience MCC / CONSOLE FLOTTE
 *
 * Propriétés garanties :
 *  1. Vérification du rôle MCC / Fleet et contrôle MFA.
 *  2. Throttling / Rate-limiting opérateur appliqué.
 *  3. Ancrage serveur avec `isMcc: true`.
 *  4. Propagation du correlation-id.
 */
export function withMccRoute<T = unknown>(
  handler: (req: NextRequest, ctx: MccRouteContext, routeParams?: T) => Promise<Response | NextResponse>,
  options: MccRouteOptions = {},
) {
  return async (req: Request | NextRequest, routeParams?: T): Promise<Response | NextResponse> => {
    const correlationId = resolveCorrelationId(req);

    return runWithCorrelation({ correlationId }, async () => {
      let authResult: AdminCaller | NextResponse;

      if (options.requireFleetAdmin) {
        authResult = await requireFleetAdmin(req);
      } else {
        authResult = await requireMccLevel(req, options.minLevel ?? 'mcc_junior_dev');
      }

      if (isDenied(authResult)) {
        return authResult;
      }

      const caller = authResult as AdminCaller;
      const mccContext: ServerTenantContext = {
        tenantId: caller.tenantId || 'mcc',
        role: caller.role,
        userId: caller.uid,
        isMcc: true,
      };

      return runWithServerTenant(mccContext, async () => {
        try {
          return await handler(
            req as NextRequest,
            {
              caller,
              correlationId,
            },
            routeParams,
          );
        } catch (error) {
          const err = toError(error);
          logger.error(`[withMccRoute] Erreur opérateur ${caller.uid}: ${err.message}`, {
            stack: err.stack,
            correlationId,
          });
          return NextResponse.json(
            { error: 'Internal Server Error', correlationId },
            { status: 500, headers: { 'x-correlation-id': correlationId } },
          );
        }
      });
    });
  };
}

/**
 * 🌐 withPublicRoute — Wrapper d'audience PUBLIQUE (convive / prise de commande)
 *
 * Propriétés garanties :
 *  1. Zéro fuite de contexte serveur global.
 *  2. Résolution optionnelle du tenant via sous-domaine vérifié `x-resolved-tenant-id`.
 *  3. Correlation-id injecté.
 */
export function withPublicRoute<T = unknown>(
  handler: (req: NextRequest, ctx: PublicRouteContext, routeParams?: T) => Promise<Response | NextResponse>,
) {
  return async (req: Request | NextRequest, routeParams?: T): Promise<Response | NextResponse> => {
    const correlationId = resolveCorrelationId(req);
    const resolvedTenantId = req.headers.get('x-resolved-tenant-id') ?? undefined;

    return runWithCorrelation({ correlationId }, async () => {
      const publicContext: ServerTenantContext = {
        tenantId: resolvedTenantId || 'public',
        role: 'public',
        isMcc: false,
      };

      return runWithServerTenant(publicContext, async () => {
        try {
          return await handler(req as NextRequest, { correlationId, resolvedTenantId }, routeParams);
        } catch (error) {
          const err = toError(error);
          logger.error(`[withPublicRoute] Erreur route publique: ${err.message}`, { correlationId });
          return NextResponse.json(
            { error: 'Internal Server Error', correlationId },
            { status: 500, headers: { 'x-correlation-id': correlationId } },
          );
        }
      });
    });
  };
}

/**
 * 🪝 withWebhookRoute — Wrapper de WEBHOOK SIGNÉ (Stripe, Brevo, banques)
 *
 * Propriétés garanties :
 *  1. Exécution de la vérification de signature avant appel au handler.
 *  2. Refus 401 si signature invalide.
 *  3. Contexte serveur isolé avec correlation-id.
 */
export function withWebhookRoute<T = unknown>(
  handler: (req: NextRequest, ctx: WebhookRouteContext, routeParams?: T) => Promise<Response | NextResponse>,
  options: WebhookRouteOptions,
) {
  return async (req: Request | NextRequest, routeParams?: T): Promise<Response | NextResponse> => {
    const correlationId = resolveCorrelationId(req);

    return runWithCorrelation({ correlationId }, async () => {
      try {
        const isSignatureValid = await options.verifySignature(req.clone());
        if (!isSignatureValid) {
          logger.warn('[withWebhookRoute] Signature webhook invalide rejetée', { correlationId });
          return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
        }
      } catch (err) {
        logger.warn('[withWebhookRoute] Échec validation signature webhook', toError(err).message);
        return NextResponse.json({ error: 'Signature verification error' }, { status: 401 });
      }

      const webhookContext: ServerTenantContext = {
        tenantId: 'webhook',
        role: 'webhook',
        isMcc: false,
      };

      return runWithServerTenant(webhookContext, async () => {
        try {
          return await handler(req as NextRequest, { correlationId }, routeParams);
        } catch (error) {
          const err = toError(error);
          logger.error(`[withWebhookRoute] Erreur traitement webhook: ${err.message}`, { correlationId });
          return NextResponse.json(
            { error: 'Webhook processing error', correlationId },
            { status: 500, headers: { 'x-correlation-id': correlationId } },
          );
        }
      });
    });
  };
}
