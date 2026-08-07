import { useAtomValue } from 'jotai';
import { OperationalIdentity, SovereignNode } from '@/shared/nexus-contract';
import { Quote, Campaign, toReservation, toCampaign, toCustomer, toGroup, toQuote } from '@nexus/contracts/nexus-internal-mapper';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { DomainRegistry } from '@shared/nexus/engines/DomainRegistry';
import { guardedAction, createSovereignHook } from '../opsCore';

import { reservationsNodeAtom, groupsNodeAtom, quotesNodeAtom } from '@/store/pillars/commerce';
import { marketingCampaignsNodeAtom, crmsNodeAtom, selectedCRMAtom } from '@/store/pillars/commerce';
import { tenantIdAtom } from '@/store/pillars/sovereign';

/**
 * 🛍️ Hooks commerce (réservations / marketing / CRM / devis / groupes) — extraits de NexusOpsProvider.
 */
export const useAllocations = () => {
  const base = createSovereignHook(reservationsNodeAtom, OperationalIdentity.NODES, toReservation)();
  const tenantId = useAtomValue(tenantIdAtom) as string;
  return {
    ...base,
    getReservationsForTable: (tableId: string) => {
      return (base.data || []).filter((r) => r.tableId === tableId || r.assignedTableId === tableId);
    },
    markArrived: async (reservationId: string) => {
      const path = `tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.NODES)}/${reservationId}`;
      await Nexus.adapter.update(path, {
        status: 'arrived',
        arrivedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    },
  };
};
export const useReservations = useAllocations;

export const useGroups = createSovereignHook(groupsNodeAtom, OperationalIdentity.RELATIONS, toGroup);

export const useMarketing = () => {
  const base = createSovereignHook(marketingCampaignsNodeAtom, OperationalIdentity.RELATIONS, toCampaign)();
  const tenantId = useAtomValue(tenantIdAtom) as string;
  return {
    ...base,
    upsertCampaign: async (data: Partial<Campaign>) => {
      await guardedAction('MARKETING', 'MANAGE_CAMPAIGNS', async () => {
        if (data.id) {
          await Nexus.adapter.update(`tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.RELATIONS)}/${data.id}`, data);
        } else {
          await base.add(data as Partial<SovereignNode>);
        }
      });
    },
    upsertPost: async (data: Partial<SovereignNode> & { id?: string }) => {
      await guardedAction('MARKETING', 'MANAGE_CAMPAIGNS', async () => {
        const path = `tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.RELATIONS)}`;
        if (data.id) {
          await Nexus.adapter.update(`${path}/${data.id}`, data);
        } else {
          await Nexus.adapter.create(path, { ...data, type: 'post' });
        }
      });
    }
  };
};

export const useCRM = () => {
  const base = createSovereignHook(crmsNodeAtom, OperationalIdentity.RELATIONS, toCustomer)();
  const selectedCRM = useAtomValue(selectedCRMAtom);
  const tenantId = useAtomValue(tenantIdAtom) as string;
  return {
    ...base,
    selectedCRM,
    upsertCustomer: async (data: Partial<SovereignNode> & { id?: string }) => {
      await guardedAction('CRM', 'MANAGE_CRM', async () => {
        const path = `tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.RELATIONS)}`;
        if (data.id) {
          await Nexus.adapter.update(`${path}/${data.id}`, data);
        } else {
          await Nexus.adapter.create(path, { ...data, type: 'customer' });
        }
      });
    }
  };
};

export const useManagement = () => ({
  quotes: createSovereignHook(quotesNodeAtom, OperationalIdentity.RELATIONS)(),
  reports: [] as import('@/shared/nexus-contract').SovereignValue[]
});

export const useQuotes = () => {
  const base = createSovereignHook(quotesNodeAtom, OperationalIdentity.RELATIONS, toQuote)();
  return {
    ...base,
    createQuote: async (data: Partial<Quote>) => {
      await guardedAction('QUOTES', 'CREATE_TRANSACTION', async () => {
        await base.add(data as Partial<SovereignNode>);
      });
    }
  };
};
