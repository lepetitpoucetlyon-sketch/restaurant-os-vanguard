import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { SimulacraEngine } from '../engine/SimulacraEngine';
import { DEMO_MENU } from '../fixtures/menu';

function uid(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export interface StressServiceResult {
  ordersCount: number;
  revenueInMicrounits: number;
  eventsEmitted: number;
  durationMs: number;
  errorsCount: number;
}

// ── Service ultra-dense : N couverts en parallèle total ───────────────────────
// Émet TOUTES les étapes : order.placed → KDS courses → paid → sealed → CRM → tips → stock

export async function runStressService(
  engine: SimulacraEngine,
  covers: number,
  dateStr: string,
  serviceSlot: 'midi' | 'soir' | 'peak'
): Promise<StressServiceResult> {
  const tenantId = engine.config.tenantId;
  const ordersCount = Math.ceil(covers / 2.2); // ratio couverts → commandes plus dense
  const t0 = Date.now();
  let eventsEmitted = 0;
  let errorsCount = 0;
  let revenueInMicrounits = 0;

  const emit = async <E extends keyof import('@/shared/eventBus/NexusEventBus').NexusEventBus extends never ? never : string>(
    ...args: Parameters<typeof NexusEventBus.emit>
  ) => {
    try {
      await (NexusEventBus.emit as any)(...args);
      eventsEmitted++;
    } catch {
      errorsCount++;
    }
  };

  // POS login simultanément pour chaque terminal
  await Promise.all([
    NexusEventBus.emit('pos.terminal_login', { v: 1, isSimulation: true, tenantId, terminalId: 'pos_01', operatorId: 'emp_srv_1', loggedAt: Date.now() }),
    NexusEventBus.emit('pos.terminal_login', { v: 1, isSimulation: true, tenantId, terminalId: 'pos_02', operatorId: 'emp_hot_1', loggedAt: Date.now() }),
  ]);
  eventsEmitted += 2;

  // Toutes les commandes en batch parallèle (Promise.all)
  const orderBatches: Promise<void>[] = [];

  for (let i = 1; i <= ordersCount; i++) {
    const orderId = uid(`ord_${serviceSlot}`);
    const tableId = `tbl_${100 + (i % engine.config.tablesCount) + 1}`;
    const main = DEMO_MENU[i % DEMO_MENU.length];
    const starter = DEMO_MENU[(i + 2) % 5];
    const dessert = DEMO_MENU[12 + (i % 4)];
    const drink = DEMO_MENU[16 + (i % 4)];
    const customerId = i % 3 === 0 ? uid('cust') : undefined;

    const fullMeal = serviceSlot !== 'midi'
      ? [starter, main, dessert, drink]
      : [main, drink];

    const items = fullMeal.map((prod, idx) => ({
      id: uid(`li_${idx}`),
      productId: prod.id,
      name: prod.name,
      quantity: 1,
      unitPriceInMicrounits: prod.priceInMicrounits,
      vatRate: prod.vatRate,
      totalInMicrounits: prod.priceInMicrounits,
    }));
    const total = items.reduce((s, it) => s + it.totalInMicrounits, 0);
    revenueInMicrounits += total;

    const paymentMode = (['card', 'cash', 'card', 'card', 'split'] as const)[i % 5];

    orderBatches.push((async () => {
      // 1. Placement commande
      await NexusEventBus.emit('order.placed', {
        v: 1, isSimulation: true, tenantId, orderId, tableId,
        operatorId: 'emp_srv_1', items: items as any,
      });
      eventsEmitted++;

      // 2. KDS — réception et courses
      await NexusEventBus.emit('kds.ticket_received', {
        v: 1, isSimulation: true, tenantId, orderId, stationId: 'kds_chaud',
        items: items.map((it, idx) => ({ id: it.id, productId: it.productId, name: it.name, quantity: 1, course: idx + 1 })),
      });
      eventsEmitted++;

      // Fire courses en parallèle
      await Promise.all(items.map((_, course) =>
        NexusEventBus.emit('kds.course_fired', { v: 1, isSimulation: true, tenantId, orderId, course: course + 1 })
          .then(() => { eventsEmitted++; })
      ));

      // Items done
      await Promise.all(items.map(it =>
        NexusEventBus.emit('kds.item_done', { v: 1, isSimulation: true, tenantId, orderId, itemId: it.id, operatorId: 'emp_chef_1' })
          .then(() => { eventsEmitted++; })
      ));

      await NexusEventBus.emit('kds.ticket_done', { v: 1, isSimulation: true, tenantId, orderId });
      eventsEmitted++;

      // 3. Paiement — gestion split si applicable
      if (paymentMode === 'split') {
        await NexusEventBus.emit('order.split', {
          v: 1, isSimulation: true, tenantId, orderId, tableId,
          operatorId: 'emp_srv_1',
          totalInMicrounits: total,
          payments: [
            { amount: Math.round(total * 0.6), guest: 1, method: 'card' },
            { amount: Math.round(total * 0.4), guest: 2, method: 'cash' },
          ],
        });
        eventsEmitted++;
      } else {
        await NexusEventBus.emit('order.paid', {
          v: 1, isSimulation: true, tenantId, orderId, tableId,
          operatorId: 'emp_srv_1', customerId,
          items: items as any, totalInMicrounits: total, paymentMode,
        });
        eventsEmitted++;
      }

      // 4. Scellement NF525
      await NexusEventBus.emit('finance.order_sealed', {
        tenantId, orderId, totalInMicrounits: total, operatorId: 'emp_srv_1',
      });
      eventsEmitted++;

      // 5. CRM
      if (customerId) {
        await NexusEventBus.emit('crm.points_earned', {
          v: 1, isSimulation: true, tenantId, customerId,
          points: Math.round(total / 1_000_000), sourceOrderId: orderId,
        });
        eventsEmitted++;
        await NexusEventBus.emit('crm.rfm_trigger', { tenantId, customerId });
        eventsEmitted++;
      }

      // 6. Tips CB distribués
      if (paymentMode === 'card') {
        await NexusEventBus.emit('hr.tip_distributed', {
          tenantId, orderId,
          tipInMicrounits: Math.round(total * 0.12),
          staffIds: ['emp_srv_1', 'emp_chef_1'],
        });
        eventsEmitted++;
      }

      // 7. Déduction stock
      await NexusEventBus.emit('inventory.deducted', {
        tenantId, orderId,
        lines: items.map(it => ({ stockItemId: it.productId, quantity: 1 })),
      });
      eventsEmitted++;

      // 8. Libération table
      await NexusEventBus.emit('table.released', {
        v: 1, isSimulation: true, tenantId, tableId, orderId,
      });
      eventsEmitted++;

    })());
  }

  await Promise.all(orderBatches);

  // Clôture Z
  await NexusEventBus.emit('finance.ticket_z_closed', {
    v: 1, isSimulation: true, tenantId,
    date: dateStr, totalInMicrounits: revenueInMicrounits, ordersCount,
  });
  eventsEmitted++;

  await NexusEventBus.emit('analytics.sales_data_ready', {
    tenantId,
    periodStart: `${dateStr}T12:00:00Z`,
    periodEnd: `${dateStr}T15:00:00Z`,
    totalInMicrounits: revenueInMicrounits,
    covers,
  });
  eventsEmitted++;

  return {
    ordersCount,
    revenueInMicrounits,
    eventsEmitted,
    durationMs: Date.now() - t0,
    errorsCount,
  };
}
