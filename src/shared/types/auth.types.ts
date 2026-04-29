/**
 * 🔐 SOVEREIGN AUTH PROTOCOL
 * Agnostic to domain implementation.
 */
export type UserRole = string; // Domain-Specific roles are injected at the Domain layer

export interface UserPermissions {
    level: number; // 0 to 10
    scope: string[]; // e.g. ['FINANCE_READ', 'OPS_WRITE']
}

export interface User {
    id: string;
    tenantId?: string;
    name: string;
    pin?: string;
    pinHash?: string;
    role: UserRole;
    avatar?: string;
    lastActive?: string;
    performanceScore?: number;
    accessLevel?: number;
    weeklyHours?: number[]; // Hours per day [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
    hourlyRateInCents?: number;
    hourlyRate?: number;
    setupComplete?: boolean;
    phones?: string[];
    rescueEmail?: string;
    twoFactorVerifiedAt?: string;
    email?: string;
    uid?: string;
    displayName?: string;
    kudos?: number;
}

export type UserStatus = 'active' | 'inactive' | 'suspended' | 'on_leave';
