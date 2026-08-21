/**
 * L5 — Idempotence POS "double-tap 30 s".
 *
 * Un serveur qui mitraille "Envoyer cuisine" en 30 s génère 3 commandes identiques
 * en cuisine. Ce guard maintient une fenêtre de déduplication de 30 s par (tableId,
 * opérateur, empreinte des items).
 *
 * Implémentation : clé Nexus temporaire `tenants/{id}/pos_idemp/{key}` avec TTL
 * auto (on stocke l'horodatage et on retire à la vérification).
 *
 * Cf. docs/anglemort-restaurant-mcc.md § L5 (CRITIQUE).
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

const DEDUP_WINDOW_MS = 30_000;

export interface IdempotencyPayload {
  tenantId: string;
  tableId: string;
  operatorId: string;
  /** Empreinte déterministe des items du panier (ex: sorted productIds.join(',')) */
  cartFingerprint: string;
  now?: number;
}

export interface IdempotencyResult {
  isDuplicate: boolean;
  existingWindowMs?: number;
}

function buildKey(p: IdempotencyPayload): string {
  return `IDEMP-POS-${p.tableId}-${p.operatorId}-${p.cartFingerprint}`;
}

export class PosIdempotencyGuard {
  private static path(tenantId: string, key: string): string {
    return `tenants/${tenantId}/pos_idemp/${key}`;
  }

  static async check(payload: IdempotencyPayload): Promise<IdempotencyResult> {
    const now = payload.now ?? Date.now();
    const key = buildKey(payload);
    const path = this.path(payload.tenantId, key);

    const existing = await Nexus.adapter.get<{ ts: number }>(path);
    if (existing && now - existing.ts < DEDUP_WINDOW_MS) {
      await NexusEventBus.emit('pos.order_duplicate_blocked', {
        v: 1,
        tenantId: payload.tenantId,
        tableId: payload.tableId,
        operatorId: payload.operatorId,
        windowMs: DEDUP_WINDOW_MS,
        blockedAt: now,
      });
      return { isDuplicate: true, existingWindowMs: now - existing.ts };
    }

    await Nexus.adapter.set(path, { ts: now });
    return { isDuplicate: false };
  }

  static async clear(payload: IdempotencyPayload): Promise<void> {
    const key = buildKey(payload);
    await Nexus.adapter.set(this.path(payload.tenantId, key), null);
  }

  /** Empreinte déterministe d'un panier (tri + join) */
  static fingerprint(productIds: string[]): string {
    return [...productIds].sort().join(',');
  }
}
