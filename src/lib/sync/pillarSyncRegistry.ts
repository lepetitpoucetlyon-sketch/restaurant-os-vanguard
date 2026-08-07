/* eslint-disable no-restricted-imports -- aggregator: must use deep paths for cycle prevention */
import { getDefaultStore } from 'jotai';
import { shouldEagerLoad, type ICMImportanceMap } from '@/lib/icm/TaskContext';
import { TimeSync } from '@/lib/TimeSync';

// Sous-services de synchronisation : un par pilier métier + l'horloge (TimeSync).
import { OpsSyncService as SyncOrders } from '@/modules/ops/workflow/engine/ops.sync';
import { InventorySyncService as SyncStocks } from '@/modules/logistics/stock/inventory/inventory.sync';
import { FinanceSyncService as SyncFinance } from '@/modules/finance/finance.sync';
import { HACCPSyncService as SyncHACCP } from '@/modules/compliance/qualite/haccp/haccp.sync';
import { MarketingSyncService as SyncMarketing } from '@/modules/commerce/acquisition/marketing/marketing.sync';
import { HRSyncService as SyncStaff } from '@/modules/human/effectifs/hr/hr.sync';

type Store = ReturnType<typeof getDefaultStore>;

/**
 * 🧩 Registre des sous-systèmes de synchronisation temps réel.
 *
 * Extrait de NexusSyncService pour réduire son fan-out (god file) : les 6 sous-services
 * de pilier + TimeSync (horloge) vivent ici ; NexusSyncService n'importe qu'un seul
 * point d'entrée init/stop au lieu de 7 modules.
 *
 * ICM-lite : seuls les piliers marqués HIGH/MEDIUM (`shouldEagerLoad`) sont initialisés.
 * TimeSync est toujours initialisé (l'horloge ne dépend pas de la route).
 * L'initialisation reste parallèle (Promise.all) pour tenir la cible < 180 ms.
 */
export async function initPillarSyncs(
  imp: ICMImportanceMap,
  tenantId: string,
  store: Store
): Promise<void> {
  await Promise.all([
    TimeSync.init(),
    shouldEagerLoad(imp.orders)     ? SyncOrders.init(tenantId, store)    : Promise.resolve(),
    // SyncStocks gère aussi les catégories et produits (catalog) :
    // on l'active dès que stocks OU categories OU products est HIGH/MEDIUM.
    (shouldEagerLoad(imp.stocks) || shouldEagerLoad(imp.categories) || shouldEagerLoad(imp.products))
                                    ? SyncStocks.init(tenantId, store)    : Promise.resolve(),
    shouldEagerLoad(imp.finance)    ? SyncFinance.init(tenantId, store)   : Promise.resolve(),
    shouldEagerLoad(imp.compliance) ? SyncHACCP.init(tenantId, store)     : Promise.resolve(),
    shouldEagerLoad(imp.marketing)  ? SyncMarketing.init(tenantId, store) : Promise.resolve(),
    shouldEagerLoad(imp.staff)      ? SyncStaff.init(tenantId, store)     : Promise.resolve(),
  ]);
}

/**
 * Arrête tous les sous-systèmes de synchronisation (Zero Leak Policy).
 * TimeSync est stoppé en premier, comme dans l'orchestrateur d'origine.
 */
export function stopPillarSyncs(): void {
  TimeSync.stop();
  SyncOrders.stop();
  SyncStocks.stop();
  SyncFinance.stop();
  SyncHACCP.stop();
  SyncMarketing.stop();
  SyncStaff.stop();
}
