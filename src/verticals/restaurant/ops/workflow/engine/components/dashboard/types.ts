export interface OperationalArea {
    id: string;
    number: string;
    status: 'vacant' | 'busy' | 'maintenance' | 'reserved' | 'occupied' | 'available';
    type: string;
    price: number;
    lastCleaning: string;
    capacity?: number;
    currentCovers?: number;
}
