/**
 * 🔐 AUTH & USER DOMAIN - Shared Kernel
 */

export type UserRole = 
  | 'server' | 'manager' | 'floor_manager' 
  | 'kitchen_chef' | 'kitchen_line' | 'bartender' 
  | 'host' | 'cashier' | 'admin' 
  | 'kds-view' | 'pos-standard' | 'guest-view' | 'kitchen';

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
