'use client';

/**
 * SplashGate — Orchestration du splash screen universel branded + restauration de la dernière page
 *
 * Règles :
 *  1. Splash universel affiché au boot selon `splashPolicy` ('always' | 'first-boot' | 'never')
 *  2. Branded par tenant (logo, couleurs, police) même en mode par défaut Restaurant OS
 *  3. Après le splash → redirige vers la dernière page visitée (SovereignStorage)
 *  4. Le tracking de lastPath est actif sur toutes les routes authentifiées
 *
 * DB-agnostique : lit les atoms Jotai, pas Firestore directement.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useAtomValue } from 'jotai';
import { usePathname, useRouter } from 'next/navigation';
import { tenantBrandTokensAtom, activeTenantIdAtom } from '@/store/pillars/sovereign';
import { BrandTokensSchema, defaultBrandTokens } from '@/shared/nexus/tokens/brand';
import { SplashScreen } from '@/shared/components/SplashScreen';
import { getSystemTenantTier } from '@/lib/mcc/SystemTenantRegistry';
import { Nexus } from '@/lib/nexus/NexusAdapter';

// Clé pour savoir si le splash a déjà été affiché cette session
const SPLASH_SESSION_KEY = 'nexus_splash_shown';
// Clé pour la dernière page visitée (persist entre sessions)
const LAST_PATH_KEY      = 'nexus_last_path';

// Routes exclues du tracking lastPath (pages techniques, auth, publiques, marketing)
const EXCLUDED_PATHS = ['/login', '/signup', '/welcome', '/logout', '/admin', '/api', '/_next', '/verticales', '/pricing', '/legal', '/landing', '/showcase', '/reserve', '/demo'];

export function SplashGate({ children }: { children: React.ReactNode }) {
    const rawTokens  = useAtomValue(tenantBrandTokensAtom);
    const tenantId   = useAtomValue(activeTenantIdAtom);
    const pathname   = usePathname();
    const router     = useRouter();
    const [showSplash, setShowSplash] = useState(false);
    const [, setReady]                = useState(false);

    // Parse tokens via le schema officiel
    const result = BrandTokensSchema.safeParse(rawTokens ?? defaultBrandTokens);
    const tokens = result.success ? result.data : defaultBrandTokens;

    const splashEnabled = tokens.splashEnabled !== false;
    const splashPolicy  = tokens.splashPolicy ?? 'always';

    // ── Tracking de la dernière page visitée ──────────────────────────────
    useEffect(() => {
        if (!pathname) return;
        const isExcluded = EXCLUDED_PATHS.some(p => pathname.startsWith(p));
        if (!isExcluded && typeof localStorage !== 'undefined') {
            try { localStorage.setItem(LAST_PATH_KEY, pathname); } catch { /* quota exceeded */ }
        }
    }, [pathname]);

    // ── Simulacra Mode pour tenants DEMO ──────────────────────────────────
    useEffect(() => {
        if (!tenantId) return;
        const tier = getSystemTenantTier(tenantId);
        if (tier === 'DEMO' && !Nexus.isSimulacraActive()) {
            Nexus.activateSimulacraMode(`demo_session_${tenantId}`).catch(err => {
                console.warn('[SplashGate] Simulacra activation failed:', err);
            });
        }
    }, [tenantId]);

    // ── Décision d'affichage du splash universel ───────────────────────────
    useEffect(() => {
        // Désactivé explicitement ou policy never
        if (!splashEnabled || splashPolicy === 'never') {
            setReady(true);
            return;
        }

        // Si policy first-boot et déjà affiché cette session
        if (splashPolicy === 'first-boot') {
            if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(SPLASH_SESSION_KEY)) {
                setReady(true);
                return;
            }
        }

        // → On affiche le splash branded
        setShowSplash(true);
    }, [splashEnabled, splashPolicy]);

    // ── Fin du splash ─────────────────────────────────────────────────────
    const handleSplashDone = useCallback(() => {
        setShowSplash(false);
        setReady(true);
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem(SPLASH_SESSION_KEY, '1');
        }
        // Restaurer la dernière page visitée
        try {
            const lastPath = typeof localStorage !== 'undefined' ? localStorage.getItem(LAST_PATH_KEY) : null;
            if (lastPath && lastPath !== pathname && !EXCLUDED_PATHS.some(p => lastPath.startsWith(p))) {
                router.replace(lastPath);
            }
        } catch { /* ignore */ }
    }, [pathname, router]);

    return (
        <>
            {showSplash && <SplashScreen onDone={handleSplashDone} />}
            {/* L'app est toujours montée en arrière-plan pour que les providers s'initialisent */}
            <div style={{ visibility: showSplash ? 'hidden' : 'visible' }}>
                {children}
            </div>
        </>
    );
}
