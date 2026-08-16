/**
 * 🍱 OPERATIONS DOMAIN - Shared Kernel
 * Version Grade X - Sovereign Alignment
 * Derived from Zod Schemas - Single Source of Truth.
 */

import { z } from 'zod';
import { 
  TableSchema, 
  ReservationSchema, 
  FloorSchema, 
  ZoneSchema
} from '@/modules/ops/domain/schemas/ops';
import { 
  OrderSchema, 
  OrderLineSchema,
  OrderItemModificationSchema
} from '@/modules/ops/domain/schemas/orders';

export type Table = z.infer<typeof TableSchema>;
export type Reservation = z.infer<typeof ReservationSchema>;
export type Floor = z.infer<typeof FloorSchema>;
export type Zone = z.infer<typeof ZoneSchema>;

export type Order = z.infer<typeof OrderSchema>;
export type OrderItem = z.infer<typeof OrderLineSchema>;
export type OrderItemModification = z.infer<typeof OrderItemModificationSchema>;

export type TableStatus = Table['status'];
export type TableShape = 'rect' | 'circle' | string;
export type OrderStatus = Order['status'];
export type GroupEventStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

// 🏛️ Universal Aliases (Spaces, Resources & Workload Units)
export type Space = Table;
export type SpaceStatus = TableStatus;
export type SpaceShape = TableShape;
export type WorkloadUnit = 'cover' | 'vehicle' | 'patient' | 'client' | 'asset_lot' | 'unit';

// Keep essential legacy structures if not yet migrated to Zod
// OrderItemModification is now inferred from Zod

export interface GroupEvent {
    id: string;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    status: GroupEventStatus;
    customerId?: string;
    customerName: string;
    partySize: number;
    depositInCents?: number;
    depositInMicrounits?: number; // µ = cents × 10 000
    isDepositPaid: boolean;
    notes?: string;
}

