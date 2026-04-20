export interface RoleSettings {
    id: string;
    name: string;
    description?: string;
    color: string;
    permissions: { module: string; read: boolean; write: boolean; delete: boolean }[];
    hourRestrictions?: { startTime: string; endTime: string }[];
    zoneRestrictions?: string[];
    canAccessFinancials: boolean;
    canAccessSensitiveData: boolean;
}

export interface SessionSettings {
    autoLogoutMinutes: number;
    requireMFA: boolean;
    maxConcurrentSessions: number;
    logRetentionDays: number;
}

export interface SecurityConfig {
    require2FA: boolean;
    twoFactorFrequency: 'always' | 'weekly' | 'on_reopen';
    allowEmailRescue: boolean;
    allowMultiplePhones: boolean;
    sessionTimeout: number;
    logRetention: number;
    allowSupportAccess: boolean;
}
