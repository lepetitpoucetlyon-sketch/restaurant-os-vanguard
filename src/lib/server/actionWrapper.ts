import { z } from 'zod';
import { requireSession } from '@/lib/server/verifySession';
import { NexusError, NexusErrorCode } from '@/shared/nexus/errors';
import { assertPermission } from '@/shared/rbac/checkPermission';
import { ACTION_MAP } from '@/shared/rbac/actionPermissionMap';
import { PinHashService } from '@/lib/server/PinHashService';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import type { User } from '@/modules/human';

export function createSafeAction<TArgs extends any[], TOutput>(
    schema: z.ZodType<TArgs>,
    permission: { page: string; action: string },
    handler: (tenantId: string, ...args: TArgs) => Promise<TOutput>,
) {
    return async (tenantId: string, ...args: unknown[]): Promise<TOutput> => {
        // 1. Souveraineté - Lève si session invalide
        const session = await requireSession(tenantId);

        // 2. RBAC - Vérifie le rôle
        assertPermission(session.role, permission.page, permission.action);
        
        const config = ACTION_MAP[permission.page]?.[permission.action];

        // 3. Validation Zod (valide le tuple d'arguments)
        const parsed = schema.safeParse(args);
        if (!parsed.success) {
            throw new NexusError(
                NexusErrorCode.VALIDATION_ERROR,
                `Payload invalide : ${parsed.error.issues.map(i => `${i.path.join('.')} ${i.message}`).join(' · ')}`,
                parsed.error.issues,
            );
        }

        // 4. Vérification PIN côté serveur si exigé
        if (config?.requiresPin) {
            // Le PIN est attendu soit dans le dernier argument s'il s'agit d'un objet { pin: string },
            // soit explicitement défini par le client.
            const lastArg = args[args.length - 1];
            const pin = typeof lastArg === 'object' && lastArg !== null && 'pin' in lastArg 
                ? (lastArg as any).pin as string 
                : undefined;
                
            if (!pin) {
                throw new NexusError(NexusErrorCode.ACCESS_DENIED, 'Code PIN requis pour cette action');
            }
            
            const user = await Nexus.adapter.get<User & { pinHash?: string; pinSalt?: string; pin?: string }>(
                `tenants/${tenantId}/staff/${session.uid}`
            );
            
            if (!user) {
                throw new NexusError(NexusErrorCode.ACCESS_DENIED, 'Utilisateur introuvable');
            }

            let isValid = false;
            if (user.pinHash && user.pinSalt) {
                isValid = PinHashService.verify(pin, user.pinHash, user.pinSalt);
            } else if (user.pin === pin) {
                isValid = true;
            }

            if (!isValid) {
                throw new NexusError(NexusErrorCode.ACCESS_DENIED, 'Code PIN incorrect');
            }
        }

        // 5. Exécution métier
        return handler(tenantId, ...parsed.data);
    };
}
