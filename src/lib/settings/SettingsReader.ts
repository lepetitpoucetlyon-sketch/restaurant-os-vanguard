/**
 * 🎚️ SettingsReader — Lecteur de réglages métier hors-React (Phase 2)
 *
 * Permet aux services purs (sans hooks React) d'accéder aux réglages configurés
 * par le restaurateur, avec repli obligatoire et garanti sur la constante métier (fallback).
 */
import { getDefaultStore } from 'jotai';
import { pageSettingsAtom } from '@/store/settingsAtoms';
import { SovereignValue } from '@/shared/nexus-contract';

export class SettingsReader {
    /**
     * Lit un réglage pour une page donnée avec fallback garanti.
     * @param page Identifiant de la page/domaine (ex: 'kds', 'pos', 'bar', 'haccp', 'finance')
     * @param key Clé du réglage (ex: 'overheat_threshold_min', 'table_lock_ttl_sec')
     * @param fallback Constante par défaut (utilisée si aucun réglage n'a été personnalisé)
     */
    static getSetting<T = SovereignValue>(page: string, key: string, fallback: T): T {
        try {
            const store = getDefaultStore();
            const allPageSettings = store.get(pageSettingsAtom);
            const value = allPageSettings?.[page]?.[key];
            if (value !== undefined && value !== null) {
                return value as unknown as T;
            }
        } catch {
            // En environnement isolé (ex: SSR partiel ou test unitaire sans store) -> repli immédiat
        }
        return fallback;
    }
}

/** Helper direct exportable */
export function getSetting<T = SovereignValue>(page: string, key: string, fallback: T): T {
    return SettingsReader.getSetting<T>(page, key, fallback);
}
