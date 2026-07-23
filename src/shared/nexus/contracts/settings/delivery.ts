export interface DeliveryZone {
    id: string;
    name: string;
    postalCodes?: string[];
    radiusKm?: number;
    deliveryFee: number;
    freeDeliveryMinimum?: number;
    estimatedTime: number;
    isActive: boolean;
}

export interface ClickCollectSettings {
    enabled: boolean;
    minPrepTime: number;
    slotsPerHour: number;
    maxOrdersPerSlot: number;
    pickupInstructions?: string;
    pickupLocation?: string;
}
