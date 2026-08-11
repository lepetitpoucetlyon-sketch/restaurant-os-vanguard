import { SOVEREIGN_MODULE_IDS } from '@/shared/ModuleRegistry';
import { UserPermissions } from './auth.types';

/**
 * DNA Protocol for Module Access
 */
export function canAccessModule(permissions: UserPermissions, moduleId: string): boolean {
    if (permissions.isSovereignAdmin) return true;
    if (!SOVEREIGN_MODULE_IDS.has(moduleId as import('@/shared/genome.types').ModuleId)) return false;
    return permissions.allowedModules.includes(moduleId);
}
