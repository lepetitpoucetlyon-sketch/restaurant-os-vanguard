/**
 * 📱 Mobile POS & Self-Ordering Client SDK (H2.2 / H2.3)
 * Client TypeScript universel pour application mobile serveur, borne et commande à table.
 */
import { authedFetch } from './authedFetch';

export interface MobilePosProduct {
  id: string;
  name: string;
  category: string;
  priceInMicrounits: number;
  allergens?: string[];
  available: boolean;
  description?: string;
  imageUrl?: string;
}

export interface MobilePosMenuResponse {
  tenantId: string;
  categories: string[];
  products: MobilePosProduct[];
}

export interface MobilePosTable {
  id: string;
  number: string;
  zone: string;
  seats: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  currentOrderId: string | null;
}

export interface MobilePosTablesResponse {
  tenantId: string;
  count: number;
  tables: MobilePosTable[];
}

export interface CreateOrderPayloadItem {
  productId: string;
  quantity: number;
  name?: string;
  unitPriceInMicrounits?: number;
  course?: 'entree' | 'plat' | 'dessert' | 'boisson';
  notes?: string;
}

export interface CreateOrderPayload {
  tableId?: string;
  channel?: 'POS' | 'MOBILE_SERVER' | 'QR_TABLE' | 'CLICK_AND_COLLECT' | 'DELIVERY';
  items: CreateOrderPayloadItem[];
}

export interface CreateOrderResponse {
  orderId: string;
  status: string;
  totalInMicrounits: number;
  itemsCount: number;
  createdAt: number;
}

export interface OrderStatusResponse {
  orderId: string;
  tenantId: string;
  tableId: string | null;
  status: string;
  channel: string;
  items: unknown[];
  totalInMicrounits: number;
  createdAt: number;
}

export class MobilePosClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/v1') {
    this.baseUrl = baseUrl;
  }

  /**
   * Récupère le menu et les produits d'un tenant.
   */
  async getMenu(tenantId: string): Promise<MobilePosMenuResponse> {
    const res = await authedFetch(`${this.baseUrl}/menu?tenantId=${encodeURIComponent(tenantId)}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch menu: ${res.statusText}`);
    }
    return res.json();
  }

  /**
   * Récupère la liste des tables et leur occupation.
   */
  async getTables(): Promise<MobilePosTablesResponse> {
    const res = await authedFetch(`${this.baseUrl}/tables`);
    if (!res.ok) {
      throw new Error(`Failed to fetch tables: ${res.statusText}`);
    }
    return res.json();
  }

  /**
   * Crée une commande et la transmet au KDS.
   */
  async submitOrder(payload: CreateOrderPayload): Promise<CreateOrderResponse> {
    const res = await authedFetch(`${this.baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to create order: ${res.statusText}`);
    }
    return res.json();
  }

  /**
   * Récupère le statut d'une commande en cours.
   */
  async getOrder(orderId: string): Promise<OrderStatusResponse> {
    const res = await authedFetch(`${this.baseUrl}/orders/${encodeURIComponent(orderId)}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch order: ${res.statusText}`);
    }
    return res.json();
  }
}

export const mobilePosClient = new MobilePosClient();
