export interface IVehicle {
    id: string;
    licensePlate: string;
    brand: string;
    model: string;
    ownerCrmId: string; // Lien vers L2 Core CRM
}

export interface IRepairOrder {
    id: string;
    vehicleId: string;
    status: 'ESTIMATE' | 'IN_PROGRESS' | 'READY' | 'DELIVERED';
    mechanicId?: string;
    partsUsed: string[];
}

export interface IFleet {
    id: string;
    companyCrmId: string;
    vehicles: string[];
}
