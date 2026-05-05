import { z, ZodSchema } from 'zod';
import { UserSchema } from '../../domain/schemas/users';
import { OrderSchema } from '../../domain/schemas/orders';
import { StockItemSchema } from '../../domain/schemas/inventory';
import { TableSchema, ReservationSchema, FloorSchema, ZoneSchema } from '../../domain/schemas/ops';
import { ModuleSchema } from '../../domain/schemas/modules';
import { logger } from '../axiom';

/**
 * 🏛️ NEXUS SMART SEAL - Grade X Hydrator
 * Assure la migration et la validation atomique des schémas Firestore.
 */

type AnyRecord = Record<string, unknown>;

function hydrateDocument<T>(
  data: AnyRecord,
  schema: ZodSchema<T>,
  collection: string
): T | null {
  if (!data) return null;

  const result = schema.safeParse(data);

  if (result.success) return result.data;

  // Échec de validation → audit + retour null (jamais de crash)
  logger.error(`[FirestoreHydrator] Data corruption in ${collection}`, {
    errors: result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
    data: JSON.stringify(data).slice(0, 500)
  });

  return null;
}

export const FirestoreHydrator = {
  hydrateUser: (data: AnyRecord) => hydrateDocument(data, UserSchema, 'users'),
  hydrateOrder: (data: AnyRecord) => hydrateDocument(data, OrderSchema, 'orders'),
  hydrateStockItem: (data: AnyRecord) => hydrateDocument(data, StockItemSchema, 'inventory'),
  hydrateTable: (data: AnyRecord) => hydrateDocument(data, TableSchema, 'tables'),
  hydrateReservation: (data: AnyRecord) => hydrateDocument(data, ReservationSchema, 'reservations'),
  hydrateFloor: (data: AnyRecord) => hydrateDocument(data, FloorSchema, 'floors'),
  hydrateZone: (data: AnyRecord) => hydrateDocument(data, ZoneSchema, 'zones'),
  hydrateModule: (data: AnyRecord) => hydrateDocument(data, ModuleSchema, 'modules'),

  // Collection hydrator helper
  hydrateCollection: <T>(
    docs: AnyRecord[],
    schema: ZodSchema<T>,
    collection: string
  ): T[] => {
    const results = docs.map(doc => hydrateDocument<T>(doc, schema, collection));
    return results.filter((r): r is T => r !== null);
  }
};
