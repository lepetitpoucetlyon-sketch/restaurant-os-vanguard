// @ts-nocheck
export type ControlFrequency = 'daily' | 'weekly' | 'monthly';
export type ControlCategory = 'temperature' | 'cleaning' | 'reception' | 'storage';

export interface ControlPoint {
    id: string;
    name: string;
    category: ControlCategory;
    frequency: ControlFrequency;
    scheduledTime?: string;
    minValue?: number;
    maxValue?: number;
    equipmentId?: string;
    responsibleId?: string;
    correctiveAction?: string;
    isRequired: boolean;
}

export interface NonConformity {
    id: string;
    type: string;
    severity: 'minor' | 'major' | 'critical';
    detectionDate: string;
    description: string;
    affectedProducts?: string[];
    immediateAction?: string;
    correctiveAction?: string;
    responsibleId?: string;
    status: 'open' | 'in_progress' | 'closed';
    closedDate?: string;
}

export interface HACCPConfig {
    tempCheckFrequencyHours: number;
    tempAlertDelay: number;
    tempCriticalDelay: number;
    autoTempRecording: boolean;
    sensorIntegration: boolean;
    tempLogRetentionDays: number;
    digitalChecklist: boolean;
    photoRequired: boolean;
    signatureRequired: boolean;
    supervisorValidation: boolean;
    correctiveActionRequired: boolean;
    alertOnNonConformity: boolean;
    alertSupervisor: boolean;
    alertEmail: string;
    alertSMS: boolean;
    alertPhone: string;
    escalationDelay: number;
    lotTrackingEnabled: boolean;
    supplierTrackingEnabled: boolean;
    productionDateRequired: boolean;
    expiryDateRequired: boolean;
    allergenTracking: boolean;
    autoGenerateReports: boolean;
    reportFrequency: 'daily' | 'weekly' | 'monthly';
    pdfExport: boolean;
    cloudBackup: boolean;
    retentionYears: number;
    trainingReminders: boolean;
    trainingFrequencyMonths: number;
    certificationTracking: boolean;
    internalAuditFrequency: 'weekly' | 'monthly' | 'quarterly';
    externalAuditReminder: boolean;
    auditScoreTarget: number;
    nonConformityTracking: boolean;
    temperatureZones: {
        id: string;
        name: string;
        type: 'fridge' | 'freezer' | 'hot' | 'ambient';
        minTemp: number;
        maxTemp: number;
        frequency: number;
        sensorId: string;
        autoAlert: boolean;
    }[];
}
