import { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Box, Snowflake, Droplets, ChefHat, Truck } from 'lucide-react';
import { SupplierOrder } from '@/types';
import { SovereignData } from '@/shared/nexus-contract';


export interface CleaningTask {
    id: string;
    label: string;
    frequency: 'Quotidien' | 'Hebdomadaire' | 'Mensuel';
}

export type ZoneColor = 'emerald' | 'blue' | 'purple' | 'amber' | 'cyan' | 'rose';

export interface ZoneConfig {
    id: string;
    label: string;
    icon: LucideIcon; // LucideIcon Component
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

export const ZONES_CONFIG: ZoneConfig[] = [
    {
        id: 'reception',
        label: 'Réception & Quai',
        icon: Box,
        color: 'blue',
        tasks: [
            { id: 'rec_sol', label: 'Nettoyage du sol et plinthes', frequency: 'Quotidien' },
            { id: 'rec_poignees', label: 'Désinfection poignées & interrupteurs', frequency: 'Quotidien' },
            { id: 'rec_balance', label: 'Nettoyage balance de réception', frequency: 'Quotidien' },
            { id: 'rec_poubelle', label: 'Sortie et nettoyage poubelles', frequency: 'Quotidien' },
        ]
    },
    {
        id: 'stockage',
        label: 'Stockage Froid',
        icon: Snowflake,
        color: 'cyan',
        tasks: [
            { id: 'stk_sol', label: 'Nettoyage sol chambres froides', frequency: 'Hebdomadaire' },
            { id: 'stk_rayons', label: 'Nettoyage rayonnages', frequency: 'Mensuel' },
            { id: 'stk_joint', label: 'Vérification/Nettoyage joints portes', frequency: 'Hebdomadaire' },
        ]
    },
    {
        id: 'prep',
        label: 'Légumerie & Prépa',
        icon: Droplets,
        color: 'rose',
        tasks: [
            { id: 'prep_plan', label: 'Désinfection plans de travail', frequency: 'Quotidien' },
            { id: 'prep_bac', label: 'Nettoyage bacs de trempage', frequency: 'Quotidien' },
            { id: 'prep_evier', label: 'Nettoyage et désinfection éviers', frequency: 'Quotidien' },
            { id: 'prep_siphon', label: 'Nettoyage siphons de sol', frequency: 'Hebdomadaire' },
        ]
    },
    {
        id: 'production',
        label: 'Zone Production',
        icon: ChefHat,
        color: 'emerald',
        tasks: [
            { id: 'prod_sol', label: 'Balayage et lavage sol', frequency: 'Quotidien' },
            { id: 'prod_etagere', label: 'Dépoussiérage étagères', frequency: 'Hebdomadaire' },
            { id: 'prod_outils', label: 'Désinfection petits outils', frequency: 'Quotidien' },
        ]
    },
    {
        id: 'conditionnement',
        label: 'Conditionnement',
        icon: Truck,
        color: 'purple',
        tasks: [
            { id: 'cond_table', label: 'Nettoyage table emballage', frequency: 'Quotidien' },
            { id: 'cond_dateuse', label: 'Nettoyage dateuse/étiqueteuse', frequency: 'Quotidien' },
            { id: 'cond_stock', label: 'Rangement zone cartons', frequency: 'Hebdomadaire' },
        ]
    },
];

export const EQUIPMENT_CONFIG: EquipmentConfig[] = [
    { id: 'frigo1', label: 'Frigo Positif', zone: 'stockage', min: 0, max: 4 },
    { id: 'congel1', label: 'Congélateur', zone: 'stockage', min: -24, max: -18 },
    { id: 'vitrine1', label: 'Vitrine Réfrigérée', zone: 'production', min: 0, max: 6 },
];

export interface HygieneLog {
    id: string;
    type: 'cleaning' | 'temperature' | 'incident';
    item: string;
    zone: string;
    value?: string;
    status: 'ok' | 'alert' | 'done';
    notes?: string;
    user: string;
    createdAt: string; // ISO date string
}

export interface HygieneLabel {
    id: string;
    productName: string;
    batchNumber: string;
    expirationDate: string;
    supplier: string;
    storageLocation: string;
    imageUrl?: string;
    createdAt: string; // ISO date string
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
    receptionDate: string; // ISO date string
}

export interface OilLog {
    id: string;
    fryerName: string;
    tpomValue: number; // Total Polar Materials (%)
    action: 'control' | 'fitering' | 'changing';
    status: 'ok' | 'warning' | 'critical';
    user: string;
    createdAt: string; // ISO date string
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
}

export interface EquipmentAuditLog {
    id: string;
    equipmentType: 'hottes' | 'bac_graisse' | 'froid' | 'autre';
    checkType: 'visual' | 'cleaning' | 'maintenance';
    status: 'ok' | 'warning' | 'critical';
    notes?: string;
    user: string;
    createdAt: string; // ISO date string
}

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

export type Delivery = SupplierOrder;


// Old Types Restored to fix dependencies
export interface SensorReading {
    id: string;
    sensorId?: string;
    name: string;
    type: 'temperature' | 'humidity' | 'air_quality';
    value: number;
    unit: string;
    status: 'ok' | 'warning' | 'alert';
    lastUpdated: Date;
    minThreshold?: number;
    maxThreshold?: number;
}

export interface HACCPChecklistItem {
    id: string;
    task: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    completed: boolean;
    completedAt?: Date;
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

export interface HACCPContextType {
    sensors: SensorReading[];
    checklists: HACCPChecklistItem[];
    temperatureHistory: TemperatureLog[];
    isLoading: boolean;
    updateSensorValue: (id: string, value: number) => Promise<void>;
    toggleChecklistItem: (id: string) => Promise<void>;
    resetDailyChecklist: () => Promise<void>;
    getComplianceScore: () => number;
    criticalAlerts: SensorReading[];
    triggerAlert: (sensorId: string) => Promise<void>;
    logWaste: (data: Omit<RegulatoryWasteLog, 'id' | 'timestamp'>) => Promise<void>;
    validateTaskWithVision: (taskId: string, photoBase64: string) => Promise<boolean>;
    
    // Quality Guard / Intelligence
    agent?: {
        query: (prompt: string, context?: SovereignData) => Promise<string>;
        isProcessing: boolean;
    };
    expert?: {
        queryExpert: (prompt: string, contextData?: SovereignData) => Promise<{
            response: string;
            suggestions?: string[];
            metadata?: SovereignData;
        }>;
        isConfigured: boolean;
        isAuthorized: boolean;
        role: string;
        modelId: string;
    };
}


