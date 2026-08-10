import { NexusError, NexusErrorCode } from '@/shared/nexus/errors';
import { ACTION_MAP } from './actionPermissionMap';
import { PERMISSION_ROLE_LEVELS, PermissionRole } from '@/shared/nexus/contracts/permissions.types';

export function assertPermission(role: string | undefined, page: string, action: string) {
    const config = ACTION_MAP[page]?.[action];
    
    if (!config) {
        throw new NexusError(NexusErrorCode.ACCESS_DENIED, `Action inconnue: ${page}.${action}`);
    }

    const roleLevel = role && PERMISSION_ROLE_LEVELS[role as PermissionRole] 
        ? PERMISSION_ROLE_LEVELS[role as PermissionRole] 
        : 0;

    if (roleLevel < config.minLevel) {
        throw new NexusError(NexusErrorCode.ACCESS_DENIED, `Droits insuffisants pour ${page}.${action}. Requis: ${config.minLevel}, Actuel: ${roleLevel}`);
    }
}

