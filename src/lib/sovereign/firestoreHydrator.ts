import { z } from 'zod';
import { UserSchema_v1, UserSchema_v2, ValidatedUser } from '../../domain/schemas/users';
import { OrderSchema_v1, OrderSchema_v2, ValidatedOrder } from '../../domain/schemas/orders';
import { ModuleSchema_v1, ModuleSchema_v2, ValidatedModule } from '../../domain/schemas/modules';

/**
 * 🏛️ NEXUS SMART SEAL - Grade X Hydrator
 * Assure la migration à la volée des schémas Firestore _v1 vers _v2.
 */

type AnyRecord = Record<string, import("@/shared/nexus-contract").SovereignValue>;

export const FirestoreHydrator = {
  hydrateUser(data: AnyRecord): ValidatedUser {
    if (data.schemaVersion === 2) {
      return UserSchema_v2.parse(data);
    }
    
    // Migration from v1 to v2
    const v1Data = UserSchema_v1.parse(data);
    return UserSchema_v2.parse({
      ...v1Data,
      schemaVersion: 2,
      updatedAt: new Date().toISOString(),
    });
  },

  hydrateOrder(data: AnyRecord): ValidatedOrder {
    if (data.schemaVersion === 2) {
      return OrderSchema_v2.parse(data);
    }

    // Migration from v1 to v2
    const v1Data = OrderSchema_v1.parse(data);
    return OrderSchema_v2.parse({
      ...v1Data,
      items: v1Data.items.map(item => ({
        ...item,
        schemaVersion: 2
      })),
      schemaVersion: 2,
      updatedAt: new Date().toISOString(),
    });
  },

  hydrateModule(data: AnyRecord): ValidatedModule {
    if (data.schemaVersion === 2) {
      return ModuleSchema_v2.parse(data);
    }

    // Migration from v1 to v2
    const v1Data = ModuleSchema_v1.parse(data);
    return ModuleSchema_v2.parse({
      ...v1Data,
      schemaVersion: 2,
      updatedAt: new Date().toISOString(),
    });
  }
};
