/**
 * 🔐 SOVEREIGN AUTH PROTOCOL
 * Agnostic to domain implementation.
 * Derived from Zod Schemas - Single Source of Truth.
 */

import { UserSchema, UserPermissionsSchema } from '@/src/modules/hr/domain/schemas/users';;
import { z } from 'zod';

export type User = z.infer<typeof UserSchema>;
export type UserPermissions = z.infer<typeof UserPermissionsSchema>;

export type UserRole = string; 
export type CategoryKey = string;
export type RolePermissions = Record<UserRole | string, CategoryKey[]>;

export type UserStatus = 'active' | 'inactive' | 'suspended' | 'on_leave' | 'RESTRICTED';

export interface AuthCredentials {
    pin: string;
    userId?: string;
}

export interface AuthResponse {
    user: User;
    token?: string;
    expiresAt?: string;
}
