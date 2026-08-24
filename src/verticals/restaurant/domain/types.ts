import { Microunits } from '@/shared/schemas/primitives';

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

// ─── TIP POOLING & PERISHABLES ───────────────────────────────────────────────
export type { TipPoolingMethod, ITipPool, ITipParticipant } from '@/modules/human';
export type { PerishableStatus, IPerishableItem, IPerishableAlert } from '@/modules/compliance';

