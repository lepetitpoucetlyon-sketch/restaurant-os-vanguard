import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export interface LostItemEntry {
  itemId: string;
  itemDescription: string; // ex: 'Parapluie noir poignée bois', 'iPhone 15 pro'
  locationFound: string; // 'Table 14 banquette'
  foundByStaffName: string;
  photoUrl?: string;
}

export interface LostItemRecord {
  itemId: string;
  isReturnedToOwner: boolean;
  registeredAt: number;
}

/**
 * LostAndFoundRegistryService — Angle mort T75.
 * Registre numérique des objets trouvés : traçabilité de la découverte, photo, sécurisation au coffre et émission de décharge lors de la restitution.
 */
export class LostAndFoundRegistryService {
  static registerItem(tenantId: string, item: LostItemEntry): LostItemRecord {
    NexusEventBus.emit('crm.lost_found_registered', {
      v: 1,
      tenantId,
      itemId: item.itemId,
      itemDescription: item.itemDescription,
      locationFound: item.locationFound,
      registeredAt: Date.now(),
    });

    return {
      itemId: item.itemId,
      isReturnedToOwner: false,
      registeredAt: Date.now(),
    };
  }
}
