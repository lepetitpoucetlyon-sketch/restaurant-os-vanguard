/**
 * MCC-E1 — Custom claims Firebase refresh sur changement de rôle.
 *
 * Quand un utilisateur est promu (ex: hôtesse → manager), les custom claims
 * Firebase (`role`, `tenantId`) ne sont mis à jour que pour les NOUVELLES
 * sessions. L'utilisateur doit se re-connecter pour que le changement prenne.
 * En production, une promotion critique (accès manager pendant un service) peut
 * ne pas être effective pendant des heures.
 *
 * Ce service déclenche un refresh forcé via la collection `mcc/claims_refresh`
 * surveillée par un Firebase Function ou un SDK side-car.
 *
 * Cf. docs/anglemort-restaurant-mcc.md § MCC-E1 (HAUT).
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { AuditLogger } from '@/lib/audit';

export interface ClaimsRefreshRequest {
  uid: string;
  tenantId: string;
  newRole: string;
  previousRole: string;
  requestedBy: string;
  now?: number;
}

export class FirebaseClaimsRefreshService {
  static async requestRefresh(input: ClaimsRefreshRequest): Promise<void> {
    const now = input.now ?? Date.now();

    await Nexus.adapter.set(`mcc/claims_refresh/${input.uid}`, {
      uid: input.uid,
      tenantId: input.tenantId,
      newRole: input.newRole,
      previousRole: input.previousRole,
      requestedAt: now,
      requestedBy: input.requestedBy,
      status: 'pending',
    });

    await AuditLogger.logAction(
      input.requestedBy,
      'FIREBASE_CLAIMS_REFRESH_REQUESTED',
      input.uid,
      { tenantId: input.tenantId, newRole: input.newRole, previousRole: input.previousRole },
    ).catch(() => null);
  }

  static async markCompleted(uid: string, now?: number): Promise<void> {
    const ts = now ?? Date.now();
    const existing = await Nexus.adapter.get<Record<string, unknown>>(`mcc/claims_refresh/${uid}`);
    if (!existing) return;
    await Nexus.adapter.set(`mcc/claims_refresh/${uid}`, { ...existing, status: 'completed', completedAt: ts });
  }
}
