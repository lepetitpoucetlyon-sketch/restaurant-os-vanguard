import { Microunits } from '@/shared/schemas/primitives';

// ─── COMPOSITIONS ─────────────────────────────────────────────────────────────

export type ArrangementStatus = 'in_progress' | 'ready' | 'delivered' | 'cancelled';

export interface IFlowerArrangement {
  id: string;
  recipeId: string;
  recipeName: string;
  floristId: string;
  floristName: string;
  status: ArrangementStatus;
  createdAt: string;      // ISO 8601
  priceInMicrounits: Microunits;
  stemsUsed: number;
}

// ─── STOCK PÉRISSABLE ─────────────────────────────────────────────────────────

export type FlowerLotStatus = 'fresh' | 'expiring-soon' | 'wilted' | 'discarded';

export interface IFlowerLot {
  id: string;
  species: string;
  receivedAt: string;     // ISO 8601
  expiresAt: string;      // ISO 8601 — durée de vie courte (2-7 jours typiquement)
  quantityStems: number;
  status: FlowerLotStatus;
}

export interface IFreshnessReport {
  periodStart: string;
  periodEnd: string;
  totalLots: number;
  freshCount: number;
  expiringSoonCount: number;
  wiltedCount: number;
  wastageRatePct: number;
}

// ─── LIVRAISONS ───────────────────────────────────────────────────────────────

export type DeliveryStatus = 'pending' | 'dispatched' | 'delivered' | 'failed';

export interface IFlowerDelivery {
  id: string;
  arrangementId: string;
  recipientName: string;
  recipientAddress: string;
  status: DeliveryStatus;
  scheduledFor: string;   // ISO 8601
  dispatchedAt?: string;
  deliveredAt?: string;
}
