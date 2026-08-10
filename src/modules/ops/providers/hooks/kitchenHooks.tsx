import { useMemo, useCallback } from 'react';
import { useAtomValue } from 'jotai';
import { OperationalIdentity, SovereignNode, SovereignField } from '@/shared/nexus-contract';
import { Order, Recipe, toOrder, toRecipe } from '@nexus/contracts/nexus-internal-mapper';
import { DomainRegistry } from '@shared/nexus/engines/DomainRegistry';
import { guardedAction, sanitizeToSovereign, createSovereignHook } from '../opsCore';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

import { ordersNodeAtom } from '@/store/pillars/ops';
import { recipesNodeAtom, prepTasksNodeAtom, miseEnPlaceTargetSelector } from '@/store/pillars/logistics';
import { tenantIdAtom } from '@/store/pillars/sovereign';
import { 
  respondToModificationAction, 
  updateRecipeAction, 
  togglePrepTaskAction, 
  submitOrderAction, 
  updateOrderStatusAction 
} from '../../service/pos/actions/kitchen.action';

/**
 * 🍳 Hooks cuisine (commandes / recettes / mise en place) — extraits de NexusOpsProvider.
 */
export const useOrders = () => {
  const base = createSovereignHook(ordersNodeAtom, OperationalIdentity.FLOWS, toOrder)();
  const tenantId = useAtomValue(tenantIdAtom) as string;

  const getPendingModifications = useCallback(() => {
    const mods: Array<NonNullable<Order['items'][number]['modification']> & { orderId: string, orderItemId: string }> = [];
    (base.data || []).forEach((order: Order) => {
      (order.items || []).forEach((item: import('@nexus/contracts').OrderItem) => {
        if (item.modification && !item.modification.respondedAt) {
          mods.push({
            ...item.modification,
            orderId: String(order.id),
            orderItemId: String(item.id),
          });
        }
      });
    });
    return mods;
  }, [base.data]);

  return {
    ...base,
    respondToModification: async (orderId: string, itemId: string, approved: boolean, responder: string, note?: string) => {
      await guardedAction('KDS', 'FIRE_KDS', async () => {
        await respondToModificationAction(tenantId, orderId, itemId, approved, responder, note);
      });
    },
    getPendingModifications,
  };
};

export const useRecipes = () => {
  const base = createSovereignHook(recipesNodeAtom, OperationalIdentity.RESOURCES, toRecipe)();
  const tenantId = useAtomValue(tenantIdAtom) as string;
  return {
    ...base,
    addRecipe: async (data: Partial<Recipe>) => base.add(data as Partial<SovereignNode>),
    updateRecipe: async (id: string, data: Partial<Recipe>) => {
      await guardedAction('KITCHEN', 'MANAGE_RECIPES', async () => {
        await updateRecipeAction(tenantId, id, data);
      });
    },
    deleteRecipe: async (id: string) => base.remove(id),
    calculateRecipeCost: (recipe: Recipe) => {
      return (recipe.ingredients || []).reduce((acc: number, ing) => acc + (Number(ing.cost || 0) * Number(ing.quantity || 0)), 0);
    }
  };
};

export const useKitchen = () => {
  const ordersNode = useAtomValue(ordersNodeAtom);
  const tasksNode = useAtomValue(prepTasksNodeAtom);
  const tenantId = useAtomValue(tenantIdAtom) as string;
  const miseEnPlaceTarget = useAtomValue(miseEnPlaceTargetSelector);

  // 🏛️ SUTURE: Conversion vers types business Grade X
  const orders = useMemo(() =>
    ((ordersNode?.data || []) as SovereignNode[]).map(toOrder),
  [ordersNode?.data]);

  const tasks = useMemo(() =>
    (tasksNode?.data || []) as unknown as SovereignNode[],
  [tasksNode?.data]);

  return {
    nodes: orders,
    orders,
    prepTasks: tasks,
    miseEnPlaceTarget,
    isLoading: ordersNode.loading || tasksNode.loading,
    error: ordersNode.error || tasksNode.error,

    togglePrepTask: async (id: string) => {
      const task = tasks.find(t => t.id === id);
      if (!task) return;
      const currentStatus = (task.attributes as Record<string, SovereignField>)?.status === 'completed';
      await togglePrepTaskAction(tenantId, id, currentStatus ? 'pending' : 'completed');
    },

    submitOrder: async (order: Partial<Order>) => {
      await guardedAction('KITCHEN', 'FIRE_KDS', async () => {
        const sanitized = sanitizeToSovereign(order);
        await submitOrderAction(tenantId, {
          ...sanitized,
          updatedAt: new Date().toISOString()
        });
        if (typeof window !== 'undefined') {
          import('@/modules/ops/service/printers/hardware/PrintingService').then(({ printerService }) => {
            printerService.printKitchen({
              orderId: String(order.id ?? 'new'),
              tableLabel: order.tableNumber ?? 'Table ?',
              items: (order.items ?? []).map(item => ({
                name: item.name,
                qty: item.quantity,
                modifiers: (item.modifiers ?? []).map((m) => typeof m === 'string' ? m : m.name),
                course: (item as unknown as { course?: string }).course,
              })),
              serverName: order.serverName,
              timestamp: new Date(),
            }).catch(() => { /* ignore print errors */ });
          }).catch(() => { /* ignore import errors */ });
        }
      });
    },

    updateOrderStatus: async (id: string, status: string) => {
      await guardedAction('KITCHEN', 'FIRE_KDS', async () => {
        await updateOrderStatusAction(tenantId, id, status);
        
        if (status === 'cancelled') {
          await NexusEventBus.emitDurable('order.cancelled', {
            v: 1,
            orderId: id,
            tenantId,
            operatorId: 'KDS',
            reason: 'Annulation depuis écran KDS/Manager',
          });
        }
      });
    },

    getPendingModifications: useCallback(() => {
      const mods: Array<NonNullable<Order['items'][number]['modification']> & { orderId: string; orderItemId: string }> = [];
      orders.forEach((order: Order) => {
        (order.items || []).forEach((item) => {
          if (item.modification && !item.modification.respondedAt) {
            mods.push({ ...item.modification, orderId: String(order.id), orderItemId: String(item.id) });
          }
        });
      });
      return mods;
    }, [orders]),
  };
};
