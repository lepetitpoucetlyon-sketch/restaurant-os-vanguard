import { useAtomValue } from 'jotai';
import { OperationalIdentity } from '@/shared/nexus-contract';
import { toProduct, toCategory, toJournalEntry } from '@nexus/contracts/nexus-internal-mapper';
import { createSovereignHook } from '../opsCore';
        // FIXME (Modular Monolith): Remove cross-module import. Use domain/ or NexusEventBus.
        // eslint-disable-next-line vanguard/no-inter-module-imports
import { useInventory } from '@/modules/logistics/stock/inventory/hooks';

import { productsNodeAtom, categoriesNodeAtom } from '@/store/pillars/logistics';
import { fiscalLedgerNodeAtom } from '@/store/pillars/compliance';
import { leaveRequestsNodeAtom } from '@/store/pillars/human';
import { menuAnalysisSelector, staffPerformanceSelector, laborCostRatioSelector } from '@/store/pillars/commerce';

/**
 * 📦 Hooks catalogue & transverses (produits / catégories / fiscal / RH / intelligence)
 * — extraits de NexusOpsProvider.
 */
export const useProducts = createSovereignHook(productsNodeAtom, OperationalIdentity.RESOURCES, toProduct);
export const useCategories = createSovereignHook(categoriesNodeAtom, OperationalIdentity.RESOURCES, toCategory);
export const useFiscal = createSovereignHook(fiscalLedgerNodeAtom, OperationalIdentity.COMPLIANCE, toJournalEntry);
export const useHR = createSovereignHook(leaveRequestsNodeAtom, OperationalIdentity.RESOURCES);

export const useIntelligence = () => {
  const menuAnalysis = useAtomValue(menuAnalysisSelector);
  const performance = useAtomValue(staffPerformanceSelector);
  const laborCost = useAtomValue(laborCostRatioSelector);
  return {
    menuAnalysis,
    performance,
    laborCost,
    totalRevenue: 0,
    data: {
      globalInflationRate: 4.2 // Standard Grade X Rate
    }
  };
};

// 🥫 useInventory provient de @modules/logistics — réexporté pour compat.
export { useInventory };
