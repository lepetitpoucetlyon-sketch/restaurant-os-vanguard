/**
 * §7.2 Nexus Exchange — ExchangeResolver
 *
 * Provides cross-tenant READ access to `tenants/{publisherId}/published/{scope}`
 * exclusively when a valid, active, non-expired, non-revoked ExchangeGrant exists.
 *
 * Security invariants:
 *  - No read without grant (S1–S6)
 *  - Wildcard granteeId='*' opens to all tenants (S8)
 *  - Publishers can only write their OWN published/ path (S10–S11)
 *  - SovereignGuard is not bypassed — paths remain tenant-isolated; this layer
 *    provides an explicit, audited exception for `published/` collections only.
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';
import type { ExchangeScope } from '../domain/ExchangeGrantSchema';
import type { ExchangeGrant, ExchangePublishedData } from '../domain/ExchangeGrantSchema';

const PUBLISHED_PATH = (publisherId: string, scope: ExchangeScope) =>
  `tenants/${publisherId}/published/${scope}`;

const GRANTS_PATH = (publisherId: string) =>
  `tenants/${publisherId}/exchangeGrants`;

function isGrantValid(grant: ExchangeGrant, granteeId: string, scope: ExchangeScope): boolean {
  if (!grant.active) return false;
  if (grant.revokedAt) return false;
  if (grant.expiresAt && new Date(grant.expiresAt) < new Date()) return false;
  if (grant.granteeId !== '*' && grant.granteeId !== granteeId) return false;
  if (!grant.scopes.includes(scope)) return false;
  return true;
}

function findValidGrant(
  grants: ExchangeGrant[],
  granteeId: string,
  scope: ExchangeScope,
): ExchangeGrant | undefined {
  return grants.find(g => isGrantValid(g, granteeId, scope));
}

export const ExchangeResolver = {
  /**
   * Read published data from a supplier tenant.
   * Enforces grant-based access control before touching any data.
   * Returns `null` if the publisher has no published data for this scope (but the grant is valid).
   * Throws if no valid grant exists.
   */
  async read(
    publisherId: string,
    scope: ExchangeScope,
    callerId: string,
  ): Promise<ExchangePublishedData | null> {
    const grants = await Nexus.adapter.query<ExchangeGrant>(GRANTS_PATH(publisherId));
    const grant = findValidGrant(grants, callerId, scope);

    if (!grant) {
      const reason = diagnoseGrantFailure(grants, callerId, scope);
      throw new Error(`Grant introuvable ou invalide pour ${callerId}→${publisherId}/${scope}. ${reason}`);
    }

    const data = await Nexus.adapter.get<ExchangePublishedData>(PUBLISHED_PATH(publisherId, scope));

    empireAudit.log({
      module: 'compliance',
      action: 'EXCHANGE_READ',
      details: { publisherId, scope, callerId, grantId: grant.id, found: !!data },
      severity: 'low',
      timestamp: new Date(),
    });

    logger.info(`[ExchangeResolver] ${callerId} lit ${publisherId}/${scope} (grant=${grant.id})`);
    return data;
  },

  /**
   * Publish data to the exchange.
   * Only the publisher themselves can write to their own published/ path.
   * Throws on cross-tenant publish attempts.
   */
  async publish(
    publisherId: string,
    scope: ExchangeScope,
    data: Record<string, unknown>,
    callerId: string,
  ): Promise<void> {
    if (callerId !== publisherId) {
      throw new Error(
        `[ExchangeResolver] Écriture cross-tenant non autorisée : ${callerId} ne peut pas publier pour ${publisherId}`,
      );
    }

    const payload: ExchangePublishedData = {
      scope,
      publisherId,
      publishedAt: new Date().toISOString(),
      version: Date.now(),
      data,
    };

    await Nexus.adapter.set(PUBLISHED_PATH(publisherId, scope), payload);

    empireAudit.log({
      module: 'compliance',
      action: 'EXCHANGE_PUBLISH',
      details: { publisherId, scope, callerId },
      severity: 'medium',
      timestamp: new Date(),
    });

    logger.info(`[ExchangeResolver] ${publisherId} publie ${scope}`);
  },

  /**
   * Grant read access to a grantee for specific scopes.
   * Only the publisher can create grants for their own published data.
   */
  async createGrant(
    publisherId: string,
    granteeId: string,
    scopes: ExchangeScope[],
    callerId: string,
    expiresAt?: string,
  ): Promise<string> {
    if (callerId !== publisherId) {
      throw new Error(
        `[ExchangeResolver] Création de grant cross-tenant non autorisée : ${callerId} ≠ ${publisherId}`,
      );
    }

    const grantId = `egrant_${publisherId}_${granteeId}_${Date.now()}`;
    const grant: ExchangeGrant = {
      id: grantId,
      publisherId,
      granteeId,
      scopes,
      active: true,
      createdAt: new Date().toISOString(),
      createdBy: callerId,
      ...(expiresAt ? { expiresAt } : {}),
    };

    await Nexus.adapter.set(`tenants/${publisherId}/exchangeGrants/${grantId}`, grant);

    empireAudit.log({
      module: 'compliance',
      action: 'EXCHANGE_GRANT_CREATED',
      details: { publisherId, granteeId, scopes, grantId },
      severity: 'medium',
      timestamp: new Date(),
    });

    return grantId;
  },

  /**
   * Revoke an existing grant.
   */
  async revokeGrant(
    publisherId: string,
    grantId: string,
    callerId: string,
  ): Promise<void> {
    if (callerId !== publisherId) {
      throw new Error(
        `[ExchangeResolver] Révocation cross-tenant non autorisée : ${callerId} ≠ ${publisherId}`,
      );
    }

    await Nexus.adapter.update(`tenants/${publisherId}/exchangeGrants/${grantId}`, {
      active: false,
      revokedAt: new Date().toISOString(),
      revokedBy: callerId,
    });
  },
};

function diagnoseGrantFailure(
  grants: ExchangeGrant[],
  granteeId: string,
  scope: ExchangeScope,
): string {
  if (grants.length === 0) return '(aucun grant configuré)';
  const forGrantee = grants.filter(g => g.granteeId === granteeId || g.granteeId === '*');
  if (forGrantee.length === 0) return '(aucun grant pour ce grantee)';
  const withScope = forGrantee.filter(g => g.scopes.includes(scope));
  if (withScope.length === 0) return `(aucun grant avec scope "${scope}")`;
  const active = withScope.filter(g => g.active);
  if (active.length === 0) return '(grant inactif)';
  const notRevoked = active.filter(g => !g.revokedAt);
  if (notRevoked.length === 0) return '(grant révoqué)';
  return '(grant expiré)';
}
