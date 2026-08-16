import { getDefaultStore } from 'jotai';
import { logger } from '@/lib/logger';
import { ordersNodeAtom } from '@/store/pillars/ops';
import { stockItemsNodeAtom } from '@/store/pillars/logistics';
import { fiscalLedgerNodeAtom } from '@/store/pillars/compliance';
import { updateNexusNode } from '@/store/pillars/core';
import { genomeValidator } from '@/lib/GenomeValidator';
import { ImmunityAuditLogger } from '@/modules/compliance';
import { DEFAULT_TENANT_ID } from '@/config/instance';

type Store = ReturnType<typeof getDefaultStore>;

const PRIVILEGED_TENANTS = new Set(['restaurant-os', DEFAULT_TENANT_ID, 'vanguard']);

/**
 * Réinitialise les nœuds d'état critiques (orders / stocks / fiscalLedger) à vide.
 * Utilisé quand un gate bloque la synchronisation.
 */
function clearCoreNodes(store: Store, patch: { error?: string } = {}): void {
  store.set(ordersNodeAtom,       (prev) => updateNexusNode(prev, { data: [], loading: false, ...patch }));
  store.set(stockItemsNodeAtom,   (prev) => updateNexusNode(prev, { data: [], loading: false, ...patch }));
  store.set(fiscalLedgerNodeAtom, (prev) => updateNexusNode(prev, { data: [], loading: false, ...patch }));
}

/**
 * 🛡️ Privacy Shield (Grade X).
 * Bloque la synchronisation si le tenant n'a pas l'accès support accordé.
 * @returns true si l'init peut continuer, false si l'accès est restreint (init abandonné).
 */
export async function evaluatePrivacyGate(tenantId: string, store: Store): Promise<boolean> {
  const { fleetSnapshotAtom } = await import('@/store/pillars/sovereign');
  const instances = (store.get(fleetSnapshotAtom) || []) as import('@/shared/types/empire').EmpireInstance[];
  const instance = instances.find(i => i.key === tenantId);

  const isRestricted = !PRIVILEGED_TENANTS.has(tenantId) &&
                       !!instance &&
                       !instance.security?.supportAccessGranted;

  if (isRestricted) {
    logger.warn(`[NexusSyncService] ACCESS RESTRICTED for tenant ${tenantId}.`);
    clearCoreNodes(store);
    return false;
  }
  return true;
}

/**
 * 🧬 Genome Health Gate (Grade IX).
 * Bloque la synchronisation si l'ADN du module n'autorise pas SYNC_STATE.
 * @returns true si l'init peut continuer, false si l'intégrité génome échoue.
 */
export async function evaluateGenomeGate(tenantId: string, store: Store): Promise<boolean> {
  const genomeCheck = genomeValidator.validatePower('DASHBOARD', 'SYNC_STATE');
  if (genomeCheck.allowed) return true;

  logger.error(`[NexusSyncService] GENOME HEALTH GATE FAILED: ${genomeCheck.reason}`);
  await ImmunityAuditLogger.log({
    moduleId: genomeCheck.moduleId,
    attemptedPower: genomeCheck.action,
    reason: genomeCheck.reason === 'AUTHORIZED' ? 'UNKNOWN' : genomeCheck.reason,
    blockedDependency: genomeCheck.blockedDependency,
    tenantId
  });
  clearCoreNodes(store, { error: 'GENOME_INTEGRITY_FAILURE' });
  return false;
}
