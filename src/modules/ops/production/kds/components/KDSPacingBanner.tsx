'use client';

import { AlertTriangle } from 'lucide-react';
import type { KDSPacingStatus } from '../services/KDSPacingEngine';

interface Props {
    status: KDSPacingStatus;
    /** Optionnel : bouton de reprise de poste après déconnexion. */
    onRecoverStation?: () => void;
}

/**
 * Bandeau de régulation KDS — visible uniquement quand la cuisine est en surchauffe.
 * `KDSPacingEngine.evaluatePacing` (appelé dans `useKDSController`) décide de `isThrottled`
 * dès que le retard moyen dépasse `kds.overheat_threshold_min`.
 */
export function KDSPacingBanner({ status, onRecoverStation }: Props) {
    if (!status.isThrottled) {
        if (!onRecoverStation) return null;
        return (
            <div className="flex justify-end px-3 md:px-6 pt-2">
                <button
                    type="button"
                    onClick={onRecoverStation}
                    className="text-xs text-text-muted hover:text-text-primary underline underline-offset-2"
                >
                    Resynchroniser le poste
                </button>
            </div>
        );
    }

    const windowMinutes = Math.round(status.throttleDurationSeconds / 60);

    return (
        <div
            role="status"
            className="mx-3 md:mx-6 mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-warning/40 bg-warning/10 px-4 py-2.5 text-sm text-warning"
        >
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="font-semibold">Cuisine en surchauffe</span>
            <span className="tabular-nums">
                retard moyen {status.averageDelayMinutes} min — acceptation des commandes en ligne bridée à
                {' '}{status.maxOrdersPerWindow}/{windowMinutes} min
            </span>
            {onRecoverStation && (
                <button
                    type="button"
                    onClick={onRecoverStation}
                    className="ml-auto text-xs underline underline-offset-2 hover:text-text-primary"
                >
                    Resynchroniser le poste
                </button>
            )}
        </div>
    );
}
