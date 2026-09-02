/** @wip vertical-forge — Échéance: 2026-11-01. Types domaine verticale Hôtel. */
export interface IHotelRoom {
    id: string;
    number: string;
    type: 'SINGLE' | 'DOUBLE' | 'SUITE' | 'PENTHOUSE';
    status: 'CLEAN' | 'DIRTY' | 'MAINTENANCE';
    floor: number;
}

export interface IHotelGuest {
    id: string;
    crmId: string; // Lien vers le L2 Core CRM
    preferences: string[];
}

export interface IHousekeepingTask {
    id: string;
    roomId: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
    assignedTo?: string;
}
