/**
 * 🍱 OPERATIONS DOMAIN - Shared Kernel
 * Version Grade X - Sovereign Alignment
 * Derived from Zod Schemas - Single Source of Truth.
 */

import { z } from 'zod';
export {
  TableSchema,
  ReservationSchema,
  FloorSchema,
  ZoneSchema,
  TableShapeSchema,
  type Table,
  type Reservation,
  type Floor,
  type Zone,
  type TableStatus,
  type TableShape,
  type FloorTable,
} from '@/modules/ops/domain/schemas/ops';

export {
  OrderSchema,
  OrderLineSchema,
  OrderItemModificationSchema,
  type Order,
  type OrderItem,
} from '@/modules/ops/domain/schemas/orders';

import { OrderItemModificationSchema } from '@/modules/ops/domain/schemas/orders';

export type OrderItemModification = z.infer<typeof OrderItemModificationSchema>;

export type OrderStatus = import('@/modules/ops/domain/schemas/orders').Order['status'];
export type GroupEventStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

// 🏛️ Universal Aliases (Spaces, Resources & Workload Units)
export type Space = import('@/modules/ops/domain/schemas/ops').Table;
export type SpaceStatus = import('@/modules/ops/domain/schemas/ops').TableStatus;
export type SpaceShape = import('@/modules/ops/domain/schemas/ops').TableShape;
export type WorkloadUnit = 'cover' | 'vehicle' | 'patient' | 'client' | 'asset_lot' | 'unit';

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
