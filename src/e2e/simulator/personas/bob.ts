import { Nexus } from '@/lib/nexus/NexusAdapter';
import { FinancialNexusBridge } from '@/modules/finance/comptabilite/FinancialNexusBridge';
import { toMicrounits } from '@/domain/schemas/primitives';
import type { CartItem } from '@/modules/ops';
import { runAct, type PersonaFn, type PersonaResult } from '../engine/PersonaTypes';

// Entrecôte 26€ + Bordeaux 18€ = 44€ TTC
const BOB_CART: CartItem[] = [
  {
    cartId: 'cart-bob-sim',
    productId: 'prod-entrecote',
    categoryId: 'cat-viande',
    name: 'Entrecôte',
    quantity: 1,
    unitPriceInMicrounits: toMicrounits(26_000_000),
    discountInMicrounits: toMicrounits(0),
    taxRate: '0.10',
    modifiers: [],
  },
  {
    cartId: 'cart-bob-sim',
    productId: 'prod-bordeaux',
    categoryId: 'cat-boisson',
    name: 'Bordeaux 50cl',
    quantity: 1,
    unitPriceInMicrounits: toMicrounits(18_000_000),
    discountInMicrounits: toMicrounits(0),
    taxRate: '0.20',
    modifiers: [],
  },
];

export const BOB_CART_TOTAL_MICROUNITS = 44_000_000;
export const BOB_CART_TOTAL_CENTS = 4400;

export const bobPersona: PersonaFn = async ({ tenantId, operatorId }): Promise<PersonaResult> => {
  const start = Date.now();
  const acts = [];
  let journalEntry: unknown;
  let seal: unknown;

  const orderId = `order-bob-sim-${Date.now()}`;

  acts.push(await runAct('POS: addItems() × 2 → checkout()', 'POS', async () => {
    await Nexus.adapter.set(`tenants/${tenantId}/orders/${orderId}`, {
      id: orderId,
      items: BOB_CART,
      totalInMicrounits: BOB_CART_TOTAL_MICROUNITS,
      status: 'pending',
      tableId: 'table-5',
      tenantId,
      operatorId,
      createdAt: new Date().toISOString(),
    });
    return { orderId };
  }));

  acts.push(await runAct('FinancialNexusBridge.processOrder() → JE + FiscalSeal', 'FISCAL', async () => {
    const result = await FinancialNexusBridge.processOrder({
      cartItems: BOB_CART,
      operatorId,
      tableId: 'table-5',
      tenantId,
    });
    journalEntry = result.journalEntry;
    seal = result.seal;
    return { sealId: result.seal.id, jeId: result.journalEntry.id };
  }));

  const success = acts.every(a => a.success);

  return {
    personaId: 'bob',
    tenantId,
    acts,
    durationMs: Date.now() - start,
    success,
    payload: { orderId, journalEntry, seal },
  };
};
