import { SupplierOrder } from '@/modules/inventory/types';

export interface CleaningTask {
    id: string;
    label: string;
    frequency: 'Quotidien' | 'Hebdomadaire' | 'Mensuel';
}

export type ZoneColor = 'emerald' | 'blue' | 'purple' | 'amber' | 'cyan' | 'rose';

export interface ZoneConfig {
    id: string;
    label: string;
    icon: React.ElementType; 
    color: ZoneColor;
    tasks: CleaningTask[];
}

export interface EquipmentConfig {
    id: string;
    label: string;
    zone: string;
    min: number;
    max: number;
}

export interface HygieneLog {
    id: string;
    type: 'cleaning' | 'temperature' | 'incident';
    item: string;
    zone: string;
    value?: string;
    status: 'ok' | 'alert' | 'done' | 'critical';
    notes?: string;
    user: string;
    createdAt: string; 
    critical_issue?: boolean;
}

export interface HygieneLabel {
    id: string;
    productName: string;
    batchNumber: string;
    expirationDate: string;
    supplier: string;
    storageLocation: string;
    imageUrl?: string;
    createdAt: string;
}

export interface ReceptionLog {
    id: string;
    supplier: string;
    productName: string;
    temperature: number;
    expirationDate: string;
    batchNumber: string;
    integrityStatus: 'conforme' | 'non-conforme';
    imageUrl?: string;
    user: string;
    receptionDate: string;
    status?: string;
}

// ... Autres types spécifiques HACCP
export interface MaintenanceLog {
    id: string;
    equipmentId: string;
    type: 'preventive' | 'curative';
    description: string;
    performedBy: string;
    performedAt: string;
    costInCents: number;
    status: 'completed' | 'pending';
}

// SensorReading moved to central types.ts
