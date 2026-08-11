/**
 * 🌿 HYGIENE & COMPLIANCE (HACCP) - Shared Kernel
 * Version Grade X - Sovereign Alignment
 */
import type { SovereignField } from '@/shared/nexus-contract';

export interface CleaningTask {
    id: string;
    label: string;
    frequency: 'Quotidien' | 'Hebdomadaire' | 'Mensuel';
}

export type ZoneColor = 'emerald' | 'blue' | 'purple' | 'amber' | 'cyan' | 'rose';

export interface ZoneConfig {
    id: string;
    label: string;
    icon: unknown; 
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
    updatedAt: string;
    critical_issue?: boolean;
    [key: string]: SovereignField;
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
    updatedAt: string;
    [key: string]: SovereignField;
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
    createdAt: string;
    updatedAt: string;
    status?: string;
    [key: string]: SovereignField;
}

export interface MaintenanceLog {
    id: string;
    equipmentId: string;
    type: 'preventive' | 'curative';
    description: string;
    performedBy: string;
    performedAt: string;
    costInCents: number;
    costInMicrounits?: number;
    status: 'completed' | 'pending';
    createdAt: string;
    updatedAt: string;
    [key: string]: SovereignField;
}

export interface OilLog {
    id: string;
    fryerName: string;
    tpomValue: number; 
    action: 'control' | 'fitering' | 'changing';
    status: 'ok' | 'warning' | 'critical';
    user: string;
    createdAt: string; 
    updatedAt: string;
    [key: string]: SovereignField;
}

export interface RegulatoryWasteLog {
    id: string;
    type: 'biodechets' | 'huiles' | 'graisse' | 'autre';
    quantity: number;
    unit: 'kg' | 'L' | 'bacs';
    provider?: string;
    status: 'pending' | 'collected';
    user: string;
    timestamp: string | Date;
    createdAt: string;
    updatedAt: string;
    [key: string]: SovereignField;
}

export interface EquipmentAuditLog {
    id: string;
    equipmentType: 'hottes' | 'bac_graisse' | 'froid' | 'autre';
    checkType: 'visual' | 'cleaning' | 'maintenance';
    status: 'ok' | 'warning' | 'critical';
    notes?: string;
    user: string;
    createdAt: string; 
    updatedAt: string;
}

export interface SensorReading {
    id: string;
    sensorId?: string;
    name: string;
    type: 'temperature' | 'humidity' | 'air_quality';
    value: number;
    unit: string;
    status: 'ok' | 'warning' | 'alert';
    lastUpdated: Date | string;
    [key: string]: SovereignField;
}

export interface HACCPChecklistItem {
    id: string;
    task: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    completed: boolean;
    completedAt?: Date | string;
}

export interface TemperatureLog {
    id: string;
    storageLocationId: string;
    recordedAt: string;
    temperature: number;
    recordedBy: string;
    isCompliant: boolean;
    notes?: string;
}
