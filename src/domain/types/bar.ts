export type BarTab = 'cocktails' | 'wines' | 'sommelier' | 'stocks' | 'kds';

export interface WineRegion {
  id: string;
  name: string;
  country: string;
  color: string;
}

export interface Wine {
  id: string;
  name: string;
  region: string;
  type: 'Rouge' | 'Blanc' | 'Rosé' | 'Champagne' | 'Liquoreux';
  grape: string;
  vintage: number;
  /** @deprecated Use priceInMicrounits */
  priceInCents?: number;
  /** @deprecated Use costPriceInMicrounits */
  costPriceInCents?: number;
  priceInMicrounits: number;
  costPriceInMicrounits: number;
  stock: number;
  minStock: number;
  rating: number;
  servingTemp: string;
  pairings: string[];
  notes: string;
  location: string;
}

export interface Cocktail {
  id: string;
  name: string;
  category: string;
  /** @deprecated Use priceInMicrounits */
  priceInCents?: number;
  /** @deprecated Use costPriceInMicrounits */
  costPriceInCents?: number;
  priceInMicrounits: number;
  costPriceInMicrounits: number;
  ingredients: string[];
  garnish: string;
  glassware: string;
  technique: string;
  popularity: number;
  isSignature: boolean;
  image?: string;
}

export interface BarOrderItem {
  name: string;
  qty: number;
  status: 'pending' | 'preparing' | 'done';
  image?: string;
  station: string;
  modifiers?: string[];
  notes?: string;
  details?: {
    glass: string;
    method: string;
  };
}

export interface BarOrder {
  id: string;
  table: string;
  time: string;
  elapsed: number;
  items: BarOrderItem[];
  priority: 'normal' | 'rush' | 'vip';
  serverName: string;
  status: 'new' | 'preparing' | 'ready' | 'delivered';
}
