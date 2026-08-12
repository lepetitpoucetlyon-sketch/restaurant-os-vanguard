import { useMemo } from 'react';
import type { Atom } from 'jotai';
import { useAtomValue } from 'jotai';
import { OperationalIdentity, SovereignNode } from '@nexus/contracts/nexus-contract';
import { NexusNode } from '@/store/base';
import { SovereignMath } from '@lib/services/SovereignMath';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { genomeValidator } from '@/lib/GenomeValidator';
import { ImmunityAuditLogger } from '@/modules/compliance';
import { ModuleId, PowerAction } from '@nexus/contracts/genome.types';
import { DomainRegistry } from '@nexus/engines/DomainRegistry';
import { tenantIdAtom } from '@/store/pillars/sovereign';
import { SyncManager } from '@/lib/offline/sync-manager';
import { checkOnlineStatus } from '@/lib/offline/connectivity-hooks';

/**
 * 🧩 opsCore — primitives partagées des hooks Ops.
 *
 * Extrait de NexusOpsProvider (god file, fan-out 27) pour être réutilisé par les
 * familles de hooks (floor / kitchen / commerce / catalog) sans dupliquer la logique
 * de garde génome, de sanitisation monétaire ni le générateur de hook CRUD.
 */

/**
 * 🛡️ Grade IX: Guarded Action Wrapper
 * N'exécute l'action que si le génome autorise (moduleId, power) ; sinon log + undefined.
 */
export async function guardedAction<T>(
  moduleId: ModuleId,
  power: PowerAction,
  action: () => T | Promise<T>
): Promise<T | undefined> {
  const result = genomeValidator.validatePower(moduleId, power);
  if (!result.allowed) {
    ImmunityAuditLogger.log({
      moduleId: result.moduleId,
      attemptedPower: result.action,
      reason: result.reason === 'AUTHORIZED' ? 'UNKNOWN' : result.reason,
      blockedDependency: result.blockedDependency,
    });
    return undefined;
  }
  return await action();
}

/**
 * 🏛️ sanitizeToSovereign - Molecular Scanner Grade X
 * Convertit récursivement les nombres en microunits (hors clés protégées).
 */
export function sanitizeToSovereign<T extends object>(data: T): T {
  if (data === null || typeof data !== 'object') {
    if (typeof data === 'bigint') return Number(data) as unknown as T;
    return data;
  }
  if (Array.isArray(data)) return data.map(val => sanitizeToSovereign(val)) as unknown as T;

  const PROTECTED_KEYS = ['id', 'tenantId', 'createdAt', 'updatedAt', 'identifier', 'date'];
  const sanitized = { ...data } as Record<string, unknown>;

  for (const key in sanitized) {
    if (PROTECTED_KEYS.includes(key)) continue;
    const val = sanitized[key];
    if (typeof val === 'number') {
      sanitized[key] = Number(SovereignMath.toMicrounits(val));
    } else if (typeof val === 'bigint') {
      sanitized[key] = Number(val);
    } else if (typeof val === 'object' && val !== null) {
      sanitized[key] = sanitizeToSovereign(val as object);
    }
  }
  return sanitized as T;
}

/**
 * 🏭 Générateur de hook CRUD souverain générique.
 * Lie un atome Nexus à un OperationalIdentity et expose data/add/update/remove.
 */
export const createSovereignHook = <T,>(
  atom: Atom<NexusNode<unknown>>,
  identity: OperationalIdentity,
  mapper: (n: SovereignNode) => T = (n) => n as unknown as T
) => {
  return () => {
    const node = useAtomValue(atom);
    const tenantId = useAtomValue(tenantIdAtom) as string;
    const nodeData = node.data as SovereignNode[] | undefined;
    // useMemo stabilise la référence du tableau mappé : ne re-calcule que si nodeData change.
    const data = useMemo(() => (nodeData || []).map(mapper), [nodeData, mapper]);
    return {
      data,
      isLoading: node.loading,
      error: node.error,
      add: async (dataToAdd: Partial<SovereignNode>) => {
        const sanitized = sanitizeToSovereign(dataToAdd as object);
        const path = `tenants/${tenantId}/${DomainRegistry.resolve(identity)}`;
        const payload = { ...sanitized, updatedAt: new Date().toISOString() };
        if (!checkOnlineStatus()) {
          await SyncManager.enqueue({
            type: 'MUTATION',
            action: 'CREATE',
            collection: path,
            targetId: (payload as Record<string, unknown>).id as string || crypto.randomUUID(),
            payload: payload as import('@nexus/contracts/nexus-contract').SovereignField,
            priority: 0
          });
        } else {
          await Nexus.adapter.create(path, payload);
        }
      },
      update: async (id: string, dataToUpdate: Partial<SovereignNode>) => {
        const path = `tenants/${tenantId}/${DomainRegistry.resolve(identity)}`;
        const payload = { ...dataToUpdate, updatedAt: new Date().toISOString() };
        if (!checkOnlineStatus()) {
          await SyncManager.enqueue({
            type: 'MUTATION',
            action: 'UPDATE',
            collection: path,
            targetId: id,
            payload: payload as import('@nexus/contracts/nexus-contract').SovereignField,
            priority: 0
          });
        } else {
          await Nexus.adapter.update(`${path}/${id}`, payload);
        }
      },
      remove: async (id: string) => {
        const path = `tenants/${tenantId}/${DomainRegistry.resolve(identity)}`;
        if (!checkOnlineStatus()) {
          await SyncManager.enqueue({
            type: 'MUTATION',
            action: 'DELETE',
            collection: path,
            targetId: id,
            payload: {},
            priority: 0
          });
        } else {
          await Nexus.adapter.delete(`${path}/${id}`);
        }
      }
    };
  };
};
