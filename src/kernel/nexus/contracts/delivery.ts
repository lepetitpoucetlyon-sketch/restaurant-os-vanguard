export interface DeliveryItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  price?: number;
}

import { SovereignData } from '@nexus/contracts/nexus-contract';

export interface Delivery {
  id: string;
  reference: string;
  supplier_id: string;
  supplier_name: string;
  status: 'pending' | 'received' | 'cancelled';
  expected_at: string;
  items: DeliveryItem[];
  metadata?: SovereignData;
}
