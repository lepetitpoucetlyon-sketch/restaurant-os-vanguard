/**
 * AUTH & USERS TYPES
 */

export type UserRole = 'server' | 'manager' | 'floor_manager' | 'kitchen_chef' | 'kitchen_line' | 'bartender' | 'host' | 'cashier' | 'admin';

export interface User {
    id: string;
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
    // SaaS & Security Extensions
    setupComplete?: boolean;
    phones?: string[];
    rescueEmail?: string;
    twoFactorVerifiedAt?: string; // ISO timestamp of last successful SMS verification
}
