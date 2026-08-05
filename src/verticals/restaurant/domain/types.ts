import { Microunits } from '@/domain/schemas/primitives';

// ─── NF525 ────────────────────────────────────────────────────────────────────

export interface IFiscalTicket {
  id: string;
  ticketNumber: string;           // N° séquentiel NF525
  date: string;                   // ISO 8601
  totalInMicrounits: Microunits;
  vatBreakdown: IVatBand[];
  sha256Chain: string;            // hash chaîné SHA-256
  previousHash: string;
  journalEntryId: string;         // lien JournalEntry immuable
}

export interface IVatBand {
  rate: number;                   // ex: 5.5, 10, 20
  baseInMicrounits: Microunits;
  vatInMicrounits: Microunits;
}

// ─── TABLE SERVICE ────────────────────────────────────────────────────────────

export type TableStatus = 'libre' | 'occupee' | 'reservee' | 'nettoyage';

export interface IRestaurantTable {
  id: string;
  numero: string;
  capacite: number;
  zone: string;                   // terrasse, salle, bar
  status: TableStatus;
  couverts: number;               // nombre de couverts effectifs
  openedAt?: string;              // ISO 8601
  turnTimeMinutes?: number;       // durée moyenne du tour
}

export interface ITableTurn {
  tableId: string;
  openedAt: string;
  closedAt: string;
  couverts: number;
  totalInMicrounits: Microunits;
  durationMinutes: number;
}

// ─── MENU ENGINEERING ─────────────────────────────────────────────────────────

export type MenuItemCategory = 'star' | 'plow-horse' | 'puzzle' | 'dog';
// star      = popularité haute, marge haute
// plow-horse = popularité haute, marge basse
// puzzle    = popularité basse, marge haute
// dog       = popularité basse, marge basse

export interface IMenuEngineeringItem {
  productId: string;
  name: string;
  quantitySold: number;
  priceInMicrounits: Microunits;
  foodCostInMicrounits: Microunits;
  contributionMarginInMicrounits: Microunits;  // price - foodCost
  foodCostPercent: number;
  popularityIndex: number;   // % de ce plat dans le total vendu
  category: MenuItemCategory;
}

export interface IMenuEngineeringReport {
  periodStart: string;
  periodEnd: string;
  items: IMenuEngineeringItem[];
  avgContributionMarginInMicrounits: Microunits;
  avgPopularityIndex: number;
}

// ─── TIP POOLING ──────────────────────────────────────────────────────────────

export type TipPoolingMethod = 'equal' | 'weighted-hours' | 'weighted-covers' | 'custom';

export interface ITipPool {
  id: string;
  date: string;
  totalTipsInMicrounits: Microunits;
  method: TipPoolingMethod;
  participants: ITipParticipant[];
}

export interface ITipParticipant {
  employeeId: string;
  name: string;
  hoursWorked?: number;
  coversServed?: number;
  sharePercent: number;   // calculé par la règle active
  amountInMicrounits: Microunits;
}

// ─── PERISHABLES ──────────────────────────────────────────────────────────────

export type PerishableStatus = 'ok' | 'expiring-soon' | 'expired' | 'recalled';

export interface IPerishableItem {
  id: string;
  productId: string;
  name: string;
  lotNumber: string;
  receivedAt: string;
  expiresAt: string;
  quantityUnits: number;
  unitLabel: string;              // kg, L, pièce
  status: PerishableStatus;
  alertSentAt?: string;
}

export interface IPerishableAlert {
  itemId: string;
  productName: string;
  expiresAt: string;
  daysRemaining: number;
  quantityUnits: number;
  unitLabel: string;
}
