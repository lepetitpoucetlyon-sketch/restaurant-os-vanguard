"use client";

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { useHumanResources } from './useHumanResources';

/**
 * useSchedulePublish — wraps planning publication with a push notification.
 *
 * After shift statuses are persisted in Nexus, a fire-and-forget push is sent
 * to all "serveur" staff via POST /api/push/send.
 *
 * Push delivery requires PUSH_SECRET + VAPID keys configured on the server.
 * If not set, the server returns 401 and we log a warning — non-blocking.
 */
export function useSchedulePublish() {
    const [isPublishing, setIsPublishing] = useState(false);
    const { publishShifts } = useHumanResources();

    const publishAndNotify = useCallback(
        async (shiftIds: string[]): Promise<void> => {
            if (shiftIds.length === 0) return;
            setIsPublishing(true);

            try {
                // 1. Persist status → 'published' in Nexus for every given shift
                await publishShifts(shiftIds);

                // 2. Fire-and-forget push notification to all staff
                //    Requires PUSH_SECRET + VAPID keys on the server; fails gracefully if absent.
                void fetch('/api/push/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        role: 'serveur',
                        title: 'Planning mis à jour',
                        body: 'Votre planning de la semaine a été publié. Consultez vos horaires.',
                        url: '/staff',
                    }),
                }).catch(err => {
                    logger.warn('[useSchedulePublish] Push notification skipped', err);
                });

                toast.success(
                    `${shiftIds.length} shift${shiftIds.length > 1 ? 's' : ''} publié${shiftIds.length > 1 ? 's' : ''}`
                );
            } catch (err) {
                toast.error('Erreur lors de la publication du planning');
                logger.error('[useSchedulePublish] publish failed', err);
                throw err;
            } finally {
                setIsPublishing(false);
            }
        },
        [publishShifts]
    );

    return { publishAndNotify, isPublishing };
}
