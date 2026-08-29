import { useCallback, useMemo } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { OperationalIdentity, SovereignNode, SovereignField } from "@/shared/nexus/contracts";
import { toTable, toFloor, toZone, toReservation } from '@/shared/nexus/contracts/nexus-internal-mapper';
import type { Table } from '../../domain/schemas/ops';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { DomainRegistry } from '@shared/nexus/engines/DomainRegistry';
import { logger } from '@/lib/logger';
import { guardedAction, sanitizeToSovereign } from '../_internal/opsCore';

import { tablesNodeAtom, floorsAtom, zonesAtom, zonesLockedAtom, currentFloorIdAtom } from '@/store/pillars/ops';
import { reservationsNodeAtom } from '@/store/pillars/commerce';
import { tenantIdAtom } from '@/store/pillars/sovereign';

/**
 * 🗺️ Hooks du plan de salle (tables / zones / étages) — extraits de NexusOpsProvider.
 */
export const useOperationalNodes = () => {
  const node = useAtomValue(tablesNodeAtom);
  const floorsData = useAtomValue(floorsAtom);
  const zonesData = useAtomValue(zonesAtom);
  const nodes = useMemo(() => (node.data || []).map(toTable), [node.data]);
  const layouts = useMemo(() => (floorsData || []).map(toFloor), [floorsData]);
  const zones = useMemo(() => (zonesData || []).map(toZone), [zonesData]);
  const isZonesLocked = useAtomValue(zonesLockedAtom);
  const setZonesLocked = useSetAtom(zonesLockedAtom);
  const currentLayoutId = useAtomValue(currentFloorIdAtom) as string;
  const setCurrentFloorId = useSetAtom(currentFloorIdAtom);
  const tenantId = useAtomValue(tenantIdAtom) as string;

  const toggleZonesLock = useCallback(() => setZonesLocked(prev => !prev), [setZonesLocked]);
  const setCurrentFloor = useCallback((id: string) => setCurrentFloorId(id), [setCurrentFloorId]);
  const getZonesForFloor = useCallback((floorId: string) => zones.filter(z => z.floorId === floorId || !z.floorId), [zones]);
  const updateTablePosition = useCallback(async (id: string, x: number, y: number) => {
    await guardedAction('FLOOR_PLAN', 'SYNC_STATE', async () => {
      await Nexus.adapter.update(`tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.NODES)}/${id}`, {
        x, y, updatedAt: new Date().toISOString()
      });
    });
  }, [tenantId]);

  const updateNode = useCallback(async (id: string, data: Partial<SovereignNode>) => {
    await guardedAction('FLOOR_PLAN', 'SYNC_STATE', async () => {
      await Nexus.adapter.update(`tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.NODES)}/${id}`, {
        ...data,
        updatedAt: new Date().toISOString()
      });
    });
  }, [tenantId]);

  const addNode = useCallback(async (data: Partial<SovereignNode>) => {
    const sanitized = sanitizeToSovereign(data);
    await Nexus.adapter.create(`tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.NODES)}`, sanitized);
  }, [tenantId]);

  const deleteNode = useCallback(async (id: string) => {
    await guardedAction('FLOOR_PLAN', 'SYNC_STATE', async () => {
      await Nexus.adapter.delete(`tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.NODES)}/${id}`);
    });
  }, [tenantId]);

  const updateZone = useCallback(async (id: string, data: Partial<SovereignNode>) => {
    await guardedAction('FLOOR_PLAN', 'SYNC_STATE', async () => {
      await Nexus.adapter.update(`tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.ZONES)}/${id}`, {
        ...data,
        updatedAt: new Date().toISOString()
      });
    });
  }, [tenantId]);

  const addFloor = useCallback(async (data: Partial<SovereignNode>) => {
    const sanitized = sanitizeToSovereign(data);
    await Nexus.adapter.create(`tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.ZONES)}`, {
      ...sanitized,
      attributes: { ...(sanitized.attributes as Record<string, SovereignField>), type: 'floor' },
      updatedAt: new Date().toISOString()
    });
  }, [tenantId]);

  const updateFloor = useCallback(async (id: string, data: Partial<SovereignNode>) => {
    await guardedAction('FLOOR_PLAN', 'SYNC_STATE', async () => {
      await Nexus.adapter.update(`tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.ZONES)}/${id}`, {
        ...data,
        updatedAt: new Date().toISOString()
      });
    });
  }, [tenantId]);

  const deleteFloor = useCallback(async (id: string) => {
    await guardedAction('FLOOR_PLAN', 'SYNC_STATE', async () => {
      await Nexus.adapter.delete(`tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.ZONES)}/${id}`);
    });
  }, [tenantId]);

  const addZone = useCallback(async (data: Partial<SovereignNode>) => {
    const sanitized = sanitizeToSovereign(data);
    await Nexus.adapter.create(`tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.ZONES)}`, {
      ...sanitized,
      attributes: { ...(sanitized.attributes as Record<string, SovereignField>), type: 'zone' },
      updatedAt: new Date().toISOString()
    });
  }, [tenantId]);

  const deleteZone = useCallback(async (id: string) => {
    await guardedAction('FLOOR_PLAN', 'SYNC_STATE', async () => {
      await Nexus.adapter.delete(`tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.ZONES)}/${id}`);
    });
  }, [tenantId]);

  const resetToTemplate = useCallback(async (templateId: string) => {
    await guardedAction('FLOOR_PLAN', 'POWER_USER', async () => {
      // 🛡️ PURGE CURRENT FLOOR NODES
      const currentFloorNodes = nodes.filter((n) => (n.attributes as Record<string, SovereignField>)?.floorId === currentLayoutId);
      for (const node of currentFloorNodes) {
        await Nexus.adapter.delete(`tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.NODES)}/${node.id}`);
      }

      // 🛡️ INJECT TEMPLATE (BISTRO STANDARD)
      if (templateId === 'standard') {
        const templateTables = [
          { number: '1', x: 100, y: 100, seats: 2, shape: 'rect', width: 60, height: 60 },
          { number: '2', x: 250, y: 100, seats: 4, shape: 'rect', width: 80, height: 80 },
          { number: '3', x: 400, y: 100, seats: 2, shape: 'rect', width: 60, height: 60 },
          { number: '4', x: 100, y: 250, seats: 4, shape: 'circle', radius: 40 },
          { number: '5', x: 250, y: 250, seats: 6, shape: 'rect', width: 120, height: 80 },
        ];

        for (const table of templateTables) {
          await addNode({
            ...table,
            status: 'free',
            zoneId: zones[0]?.id || 'main',
            floorId: currentLayoutId
          });
        }
      }
      logger.info(`[Floor-Reset] Template ${templateId} applied to floor ${currentLayoutId}`);
    });
  }, [tenantId, currentLayoutId, nodes, zones, addNode]);

  return {
    nodes,
    tables: nodes,
    layouts,
    floors: layouts,
    zones,
    isZonesLocked,
    toggleZonesLock,
    currentLayoutId,
    currentFloorId: currentLayoutId,
    setCurrentFloor,
    getNodesForLayout: (layoutId: string) => nodes.filter((n) => (n.attributes as Record<string, SovereignField>)?.floorId === layoutId),
    getTablesForFloor: (floorId: string) => nodes.filter((n) => (n.attributes as Record<string, SovereignField>)?.floorId === floorId),
    getZonesForFloor,
    updateTablePosition,
    addNode,
    addTable: addNode,
    updateTable: updateNode,
    updateNodeStatus: updateNode,
    updateZone,
    deleteTable: deleteNode,
    deleteZone,
    addZone,
    addFloor,
    updateFloor,
    deleteFloor,
    resetToTemplate,
    isLoading: node.loading,
  };
};

// 🏛️ LEGACY COMPATIBILITY BRIDGE (Grade VI)
export const useTables = useOperationalNodes;

/**
 * Construit l'objet `floorOps` exposé par NexusOpsProvider (séparé pour alléger le provider).
 */
export function useFloorOpsValue(tenantId: string) {
  const operationalNodes = useAtomValue(tablesNodeAtom);
  const allocations = useAtomValue(reservationsNodeAtom);
  const areasRaw = useAtomValue(zonesAtom);

  // Dépendre de .data (stable si contenu inchangé après le guard updateNexusNode)
  // plutôt que du NexusNode complet — évite de re-rendre tout NexusOpsProvider à chaque sync.
  return useMemo(() => ({
    operationalNodes: (operationalNodes.data || []).map(toTable),
    allocations: (allocations.data || []).map(toReservation),
    areas: (areasRaw || []) as SovereignNode[],
    isLoading: operationalNodes.loading || allocations.loading,
    updateNodeStatus: (id: string, status: Partial<SovereignNode>) => guardedAction('FLOOR_PLAN', 'SYNC_STATE', async () => {
      await Nexus.adapter.update(`tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.NODES)}/${id}`, {
        ...status,
        updatedAt: new Date().toISOString(),
      });
    }),
    updateAreaStatus: (id: string, status: Partial<SovereignNode>) => guardedAction('FLOOR_PLAN', 'SYNC_STATE', async () => {
      await Nexus.adapter.update(`tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.ZONES)}/${id}`, {
        ...status,
        updatedAt: new Date().toISOString(),
      });
    }),
  }), [tenantId, operationalNodes.data, operationalNodes.loading, allocations.data, allocations.loading, areasRaw]);
}

// Types utilitaires réexportés pour les consommateurs.
export type { Table };
