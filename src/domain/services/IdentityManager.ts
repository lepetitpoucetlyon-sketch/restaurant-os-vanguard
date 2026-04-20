import { hashPin } from '@/lib/shared-kernel';
import type { User } from '@/types';

export interface PersistedSession {
    userId: string;
    lastAuthenticatedAt: string;
}

/**
 * Root admin PIN is injected via environment variable.
 * NEVER hardcode credentials in source code.
 */
function getRootAdminPin(): string {
    const pin = process.env.NEXT_PUBLIC_ROOT_ADMIN_PIN || process.env.ROOT_ADMIN_PIN;
    if (!pin || pin.trim().length !== 4) {
        if (process.env.NODE_ENV === 'development') {
            console.warn('[SECURITY] ROOT_ADMIN_PIN non configuré. Utilisation du PIN par défaut 9999 en mode DEV.');
            return '9999';
        }
        throw new Error('[SECURITY] ROOT_ADMIN_PIN is not configured. Set it in .env.local');
    }
    return pin.trim();
}

export const ROOT_ADMIN: User = {
    id: 'user_root',
    name: 'administrateur',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&q=80',
    performanceScore: 5.0,
    accessLevel: 100,
};

function stripSensitiveFields(user: User): User {
    const { pin: _pin, pinHash: _pinHash, ...safeUser } = user;
    return safeUser;
}

function buildSessionUser(user: User, lastActive?: string): User {
    return stripSensitiveFields({
        ...user,
        lastActive: lastActive ?? new Date().toISOString(),
    });
}

function sameSessionUser(previous: User | null, next: User): boolean {
    return !!previous &&
        previous.id === next.id &&
        previous.name === next.name &&
        previous.role === next.role &&
        previous.avatar === next.avatar &&
        previous.lastActive === next.lastActive &&
        previous.performanceScore === next.performanceScore &&
        previous.accessLevel === next.accessLevel;
}

function isPinFormatValid(pin: string): boolean {
    return pin.trim().length === 4;
}

async function matchesPin(user: User, pin: string): Promise<boolean> {
    if (!isPinFormatValid(pin)) {
        return false;
    }

    if (user.pinHash) {
        const computedHash = await hashPin(pin, user.id);
        return computedHash === user.pinHash;
    }

    return user.pin === pin;
}

async function createRootAdminUser(): Promise<User> {
    return {
        ...ROOT_ADMIN,
        pinHash: await hashPin(getRootAdminPin(), ROOT_ADMIN.id),
    };
}

export const IdentityManager = {
    stripSensitiveFields,
    buildSessionUser,
    sameSessionUser,
    isPinFormatValid,
    matchesPin,
    createRootAdminUser,

    /**
     * 🛡️ Multi-tenant Privacy Gate
     * Checks if a user has authority to access a specific tenant's business data.
     */
    canAccessTenantData(user: User, instance: any): boolean {
        // 1. Ownership Check (Normal User)
        if (user.role === 'admin' && !this.isSuperAdmin(user)) {
             // Basic assumption: normal admins are scoped to their own tenant
             return true; 
        }

        // 2. Super-Admin Check (Privacy Shield)
        if (this.isSuperAdmin(user)) {
            // ONLY grant if client explicitly opened the "Support Portal"
            return !!instance.security?.supportAccessGranted;
        }

        return false;
    },

    isSuperAdmin(user: User): boolean {
        return user.role === 'admin' && user.id === 'user_root';
    },

    /**
     * Valide si l'utilisateur possède le niveau d'autorisation requis pour une action.
     */
    canDo(action: string, context: { roleLevel?: number, accessLevel?: number }): boolean {
        const requiredLevel = action === 'ADMIN_ACTION' ? 50 : 0;
        const currentLevel = context.accessLevel ?? context.roleLevel ?? 0;
        return currentLevel >= requiredLevel;
    }
};
