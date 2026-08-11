/* eslint-disable no-restricted-imports -- tolerated structural inversion */
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

// Keep essential legacy structures if not yet migrated to Zod
// OrderItemModification is now inferred from Zod

import type { CartLine } from '@/modules/ops/domain/schemas/pos';
import type { Microunits } from '@/shared/schemas/primitives';

export interface CartItem extends Omit<CartLine, 'id'> {
    cartId: string;
    discountPercent?: number;
    originalPriceInMicrounits?: Microunits;
    isOffer?: boolean;
    course?: 'entree' | 'plat' | 'dessert';
    sentToKitchenAt?: string;
    sentAt?: number;
    doggyBag?: boolean;
    takeawayBox?: boolean;
    courseStatus?: 'pending' | 'firing' | 'fired' | 'served';
}

export type EventType = 'marriage' | 'anniversaire' | 'entreprise' | 'cocktail' | 'autre';
export type SpaceConfiguration = 'banquet' | 'buffet' | 'cocktail' | 'u_shape' | 'theater' | 'custom';

export interface GroupEvent {
    id: string;
    title?: string;
    date?: string;
    eventNumber?: string;
    establishmentId?: string;
    type?: EventType;
    name?: string;
    description?: string;
    organizer?: {
        type: 'individual' | 'company';
        name: string;
        companyName?: string;
        email: string;
        phone: string;
        address?: {
            street: string;
            city: string;
            postalCode: string;
            country: string;
        };
    };
    spaceId?: string;
    spaceName?: string;
    configuration?: SpaceConfiguration;
    eventDate?: string;
    startTime?: string;
    endTime?: string;
    covers?: {
        initial: number;
        confirmed: number;
        final: number;
        minimum: number;
    };
    status: GroupEventStatus;
    customerId?: string;
    customerName?: string;
    partySize: number;
    depositInCents?: number;
    depositInMicrounits?: number; // µ = cents × 10 000
    isDepositPaid?: boolean;
    notes?: string;
}
