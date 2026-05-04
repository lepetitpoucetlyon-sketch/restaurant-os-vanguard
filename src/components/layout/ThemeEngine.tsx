"use client";
import { useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { tenantConfigAtom } from '@/store/pillars/sovereign';

/**
 * 🎨 ThemeEngine - Grade X Stub
 * Applique les variables CSS dynamiques du Tenant configuré.
 */
export function ThemeEngine(): null {
    const config = useAtomValue(tenantConfigAtom);

    useEffect(() => {
        if (!config?.theme) return;
        
        const root = document.documentElement;
        root.style.setProperty('--primary', config.theme.primaryColor);
        root.style.setProperty('--secondary', config.theme.secondaryColor);
        root.style.setProperty('--radius', config.theme.borderRadius);
    }, [config]);

    return null;
}
