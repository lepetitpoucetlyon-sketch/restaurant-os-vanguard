import { SOVEREIGN_MODULE_IDS } from '@kernel/ModuleRegistry';
import { UserPermissions } from './auth.types';

/**
 * DNA Protocol for Module Access
 */
export function canAccessModule(permissions: UserPermissions, moduleId: string): boolean {
    if (permissions.isSovereignAdmin) return true;
    if (!SOVEREIGN_MODULE_IDS.has(moduleId as import('@nexus/contracts/genome.types').ModuleId)) return false;
    return permissions.allowedModules.includes(moduleId);
}
