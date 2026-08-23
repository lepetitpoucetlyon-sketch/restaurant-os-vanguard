/**
 * 🎚️ displayDepth — profondeur d'affichage RUNTIME (§C.5 P4bis du MEGA-PLAN).
 *
 * ⚠️ À NE PAS CONFONDRE avec `PrecisionTier` (`L0-L3`) qui décide de la
 * profondeur PRODUITE À LA CRÉATION (combien de code/features le générateur
 * émet). Ici : profondeur AFFICHÉE AU RUNTIME — quelle densité d'UI le gérant
 * voit sur des données identiques. Deux notions distinctes qui coexistent :
 *   PrecisionTier    ↔ build-time  ↔ ce qui existe dans l'app
 *   DisplayDepthLevel ↔ runtime     ↔ ce qui est affiché à ce gérant
 *
 * Aucune interaction avec la persistance : ce toggle FILTRE l'UI côté client
 * sans jamais toucher aux données. Un gérant en `essential` voit 3 items menu ;
 * en `enterprise` voit le FEC. Réversible sans redéploiement.
 */

import { atom, useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type { ReactNode } from 'react';
import React from 'react';

// ── Contrats ────────────────────────────────────────────────────────────────────

export type DisplayDepthLevel = 'essential' | 'manager' | 'enterprise';

export const DISPLAY_DEPTH_LEVELS: readonly DisplayDepthLevel[] = ['essential', 'manager', 'enterprise'];

/** Ordre numérique : plus haut = plus profond (essential=0, enterprise=2). */
const ORDER: Record<DisplayDepthLevel, number> = { essential: 0, manager: 1, enterprise: 2 };

/** Vrai si `current` atteint ou dépasse `required`. */
export function displayDepthAtLeast(current: DisplayDepthLevel, required: DisplayDepthLevel): boolean {
    return ORDER[current] >= ORDER[required];
}

// ── Atom Jotai persisté (par tenant via clé localStorage préfixée) ─────────────

const STORAGE_KEY = 'roscore:displayDepth';
const DEFAULT_LEVEL: DisplayDepthLevel = 'essential';

/**
 * Atom persistant dans localStorage. Chaque tenant peut avoir sa propre valeur
 * (le clé est préfixée par le tenantId si l'app le souhaite via `withTenantKey`).
 * Défaut : essential (interface la plus épurée — moins de risque de submerger).
 */
export const displayDepthAtom = atomWithStorage<DisplayDepthLevel>(STORAGE_KEY, DEFAULT_LEVEL);

/** Atom dérivé en lecture seule pour les composants qui ne changent pas la valeur. */
export const displayDepthReadAtom = atom<DisplayDepthLevel>(get => get(displayDepthAtom));

// ── Hook + composant ───────────────────────────────────────────────────────────

export interface UseDisplayDepth {
    readonly level: DisplayDepthLevel;
    setLevel: (l: DisplayDepthLevel) => void;
    isAtLeast: (min: DisplayDepthLevel) => boolean;
}

/** Hook pour lire et modifier le displayDepth courant. */
export function useDisplayDepth(): UseDisplayDepth {
    const [level, setLevel] = useAtom(displayDepthAtom);
    return {
        level,
        setLevel,
        isAtLeast: (min) => displayDepthAtLeast(level, min),
    };
}

export interface DisplayDepthGateProps {
    /** Niveau minimum requis pour afficher les enfants. */
    level: DisplayDepthLevel;
    children: ReactNode;
    /** Fallback affiché si le niveau courant est insuffisant (défaut : rien). */
    fallback?: ReactNode;
}

/**
 * Masque son contenu si le displayDepth courant est en dessous du seuil.
 * Utilisation : <DisplayDepthGate level="enterprise">Bouton FEC</DisplayDepthGate>.
 */
export function DisplayDepthGate({ level, children, fallback = null }: DisplayDepthGateProps): React.ReactElement | null {
    const { isAtLeast } = useDisplayDepth();
    if (!isAtLeast(level)) {
        return fallback === null ? null : (React.createElement(React.Fragment, null, fallback));
    }
    return React.createElement(React.Fragment, null, children);
}

// ── Métadonnées descriptives des niveaux (pour l'UI settings) ──────────────────

export interface DisplayDepthMeta {
    readonly level: DisplayDepthLevel;
    readonly label: string;
    readonly description: string;
    readonly emoji: string;
}

export const DISPLAY_DEPTH_META: Record<DisplayDepthLevel, DisplayDepthMeta> = {
    essential: {
        level: 'essential',
        label: 'Essentielle',
        description: 'Masque 80% des menus avancés. N\'affiche que le flux du jour (commande, encaissement, planning).',
        emoji: '🎯',
    },
    manager: {
        level: 'manager',
        label: 'Gestionnaire',
        description: 'Ajoute marges brutes, alertes stocks, suivi des heures et relances clients.',
        emoji: '📊',
    },
    enterprise: {
        level: 'enterprise',
        label: 'Expert',
        description: 'Audit trail complet, Grand Livre, exports FEC 19 colonnes, matrice RBAC fine, logs IoT.',
        emoji: '🏛️',
    },
};
