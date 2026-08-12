'use client';

/**
 * SplashGate — Orchestration du splash screen + restauration de la dernière page
 *
 * Règles :
 *  1. Splash affiché seulement si branding.mode = 'custom' ET splashEnabled = true
 *  2. Une seule fois par session (sessionStorage 'nexus_splash_shown')
 *  3. Après le splash → redirige vers la dernière page visitée (SovereignStorage)
 *  4. Le tracking de lastPath est actif sur toutes les routes authentifiées
 *
 * DB-agnostique : lit les atoms Jotai, pas Firestore directement.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useAtomValue } from 'jotai';
import { usePathname, useRouter } from 'next/navigation';
import { tenantBrandTokensAtom, activeTenantIdAtom } from '@/store/pillars/sovereign';
import { BrandTokensSchema, defaultBrandTokens } from '@nexus/tokens/brand';
import { SplashScreen } from '@design/SplashScreen';
import { z } from 'zod';
import { getSystemTenantTier } from '@/lib/mcc/SystemTenantRegistry';
import { Nexus } from '@/lib/nexus/NexusAdapter';

// Clé pour savoir si le splash a déjà été affiché cette session
const SPLASH_SESSION_KEY = 'nexus_splash_shown';
// Clé pour la dernière page visitée (persist entre sessions)
const LAST_PATH_KEY      = 'nexus_last_path';

// Routes exclues du tracking lastPath (pages techniques, auth, publiques)
const EXCLUDED_PATHS = ['/login', '/signup', '/welcome', '/logout', '/admin', '/api', '/_next'];

// Schema partiel pour lecture safe des tokens branding depuis tenantConfig
const BrandingConfigSchema = z.object({
    mode:          z.enum(['default', 'custom']).default('default'),
    splashEnabled: z.boolean().default(false),
    primaryColor:  z.string().optional(),
    logoUrl:       z.string().nullable().optional(),
    brandName:     z.string().optional(),
    tagline:       z.string().optional(),
}).catchall(z.unknown());

export function SplashGate({ children }: { children: React.ReactNode }) {
    const rawTokens  = useAtomValue(tenantBrandTokensAtom);
    const tenantId   = useAtomValue(activeTenantIdAtom);
    const pathname   = usePathname();
    const router     = useRouter();
    const [showSplash, setShowSplash] = useState(false);
    const [ready, setReady]           = useState(false);

    // Parse tokens via le schema officiel
    const result = BrandTokensSchema.safeParse(rawTokens ?? defaultBrandTokens);
    const tokens = result.success ? result.data : defaultBrandTokens;

    const isCustom       = tokens.brandingMode === 'custom';
    const splashEnabled  = tokens.splashEnabled === true;

    // ── Tracking de la dernière page visitée ──────────────────────────────
    useEffect(() => {
        if (!pathname) return;
        const isExcluded = EXCLUDED_PATHS.some(p => pathname.startsWith(p));
        if (!isExcluded && typeof localStorage !== 'undefined') {
            try { localStorage.setItem(LAST_PATH_KEY, pathname); } catch { /* quota exceeded */ }
        }
    }, [pathname]);

    // ── Simulacra Mode pour tenants DEMO ──────────────────────────────────
    // Le Simulacra intercepte toutes les écritures Nexus côté IndexedDB local.
    // Le store réel du tenant DEMO reste intact après chaque session prospect.
    useEffect(() => {
        if (!tenantId) return;
        const tier = getSystemTenantTier(tenantId);
        if (tier === 'DEMO' && !Nexus.isSimulacraActive()) {
            Nexus.activateSimulacraMode(`demo_session_${tenantId}`).catch(err => {
                console.warn('[SplashGate] Simulacra activation failed:', err);
            });
        }
        // Désactivation à la déconnexion : gérée par NexusOpsProvider teardown
    }, [tenantId]);

    // ── Décision d'affichage du splash ────────────────────────────────────
    useEffect(() => {
        // Pas custom ou splash désactivé → skip immédiatement
        if (!isCustom || !splashEnabled) {
            setReady(true);
            return;
        }
        // Déjà affiché cette session
        if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(SPLASH_SESSION_KEY)) {
            setReady(true);
            return;
        }
        // → On affiche le splash
        setShowSplash(true);
    }, [isCustom, splashEnabled]);

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
