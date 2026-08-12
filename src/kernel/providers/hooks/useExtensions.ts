'use client';

import { useMemo } from 'react';
import { useSettings } from '@/shared/hooks';

/**
 * useExtensions — état runtime des intégrations actives pour le tenant courant.
 *
 * Source unique de vérité : settings.integrations[] persisté dans Nexus
 * via SettingsContext (DB-agnostique, pas de nexus-ledger.json statique).
 *
 * Usage :
 *   const { isExtensionActive, activeExtensions } = useExtensions();
 *   if (isExtensionActive('ubereats')) { ... }
 */
export function useExtensions() {
    const { settings } = useSettings();

    const activeExtensions = useMemo<string[]>(() => {
        const integrations = settings?.integrations ?? [];
        return integrations.filter(i => i.isActive).map(i => i.id);
    }, [settings?.integrations]);

    const isExtensionActive = useMemo(() => {
        const activeSet = new Set(activeExtensions);
        return (id: string): boolean => activeSet.has(id);
    }, [activeExtensions]);

    return { isExtensionActive, activeExtensions };
}
