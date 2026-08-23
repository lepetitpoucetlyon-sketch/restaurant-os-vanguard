'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import { usePathname } from 'next/navigation';
import { tenantVariantAtom, activeTenantIdAtom } from '@/store/pillars/sovereign';
import { VerticalUIRegistry } from '@/shared/plugins/VerticalUIRegistry';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import type { IVerticalUIPlugin } from '@/shared/plugins/IVerticalUIPlugin';
import {
    TenantUiOverridesSchema,
    tenantUiOverridesPath,
    type TenantUiOverrides,
} from '@/shared/plugins/tenantUiOverridesSchema';
import { resolveScopedTokens } from '@/shared/plugins/resolveUI';

// ── Context ───────────────────────────────────────────────────────────────────

/**
 * Valeur exposée par `VerticalUIProvider`.
 * - `plugin`         : plugin UI de la verticale (niveau 2 de la cascade)
 * - `tenantOverrides`: overrides tenant Nexus (niveau 1) — null tant que non chargé
 *
 * Les hooks `useVerticalUI()` / `useVerticalComponent(...)` lisent ce contexte
 * pour appliquer la cascade tenant > verticale > défaut (cf. `resolveUI.ts`).
 */
export interface VerticalUIContextValue {
    plugin: IVerticalUIPlugin | null;
    tenantOverrides: TenantUiOverrides | null;
}

const VerticalUIContext = createContext<VerticalUIContextValue>({
    plugin: null,
    tenantOverrides: null,
});

/**
 * VerticalUIProvider — P4 : cascade 3 étages.
 *
 * - Résout le plugin UI de la verticale via `VerticalUIRegistry` (étage 2).
 * - Charge `tenants/{id}/uiOverrides` depuis Nexus (étage 1). Persistant.
 * - Injecte les scopedTokens de la route courante sur le wrapper DOM. Le merge
 *   verticale + tenant est délégué à `resolveScopedTokens`.
 * - Expose le tout via `useVerticalUI()`.
 *
 * Monté après AuthGate — le variant et l'activeTenantId sont garantis résolus.
 */
export function VerticalUIProvider({ children }: { children: React.ReactNode }) {
    const variant = useAtomValue(tenantVariantAtom);
    const tenantId = useAtomValue(activeTenantIdAtom);
    const pathname = usePathname();
    const plugin = VerticalUIRegistry.resolve(variant);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const [tenantOverrides, setTenantOverrides] = useState<TenantUiOverrides | null>(null);

    // Charge (ou décharge) les overrides tenant à chaque changement de tenant.
    useEffect(() => {
        if (!tenantId) {
            setTenantOverrides(null);
            return;
        }
        let cancelled = false;
        void (async () => {
            try {
                const raw = await Nexus.adapter.get(tenantUiOverridesPath(tenantId));
                if (cancelled) return;
                if (!raw) {
                    setTenantOverrides(null);
                    return;
                }
                const parsed = TenantUiOverridesSchema.safeParse(raw);
                // Fail-soft : un doc invalide ne casse pas l'UI, on retombe sur la verticale.
                setTenantOverrides(parsed.success ? parsed.data : null);
            } catch {
                if (!cancelled) setTenantOverrides(null);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [tenantId]);

    useEffect(() => {
        const el = wrapperRef.current;
        if (!el) return;

        el.removeAttribute('style');

        const tokens = resolveScopedTokens(pathname, variant, VerticalUIRegistry, tenantOverrides);
        Object.entries(tokens).forEach(([key, val]) => el.style.setProperty(key, val));
    }, [pathname, variant, tenantOverrides]);

    return (
        <VerticalUIContext.Provider value={{ plugin, tenantOverrides }}>
            <div ref={wrapperRef} data-vertical-scope={variant} className="contents">
                {children}
            </div>
        </VerticalUIContext.Provider>
    );
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

/**
 * Retourne le plugin UI de la verticale courante (étage 2 seulement).
 * Rétro-compat : la signature d'origine ne renvoyait que `IVerticalUIPlugin | null`.
 */
export function useVerticalUI(): IVerticalUIPlugin | null {
    return useContext(VerticalUIContext).plugin;
}

/**
 * Accès complet au contexte (plugin verticale + overrides tenant).
 * Utilisé par `useVerticalComponent` pour appliquer la cascade complète.
 */
export function useVerticalUIContext(): VerticalUIContextValue {
    return useContext(VerticalUIContext);
}
