"use client";

import React, { useCallback, useState } from 'react';
import { useNexusCore } from '@/shared/hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, CreditCard, Loader2, LifeBuoy } from 'lucide-react';
import { authedFetch } from '@/lib/client/authedFetch';
import { whiteLabelInstanceConfig } from '@/config/instance';
import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';

/**
 * 🔒 SovereignLock - Grade VIII Economy
 * Activated automatically when the Master Control Center detects
 * a 'locked' licenceStatus (e.g. Stripe payment failed).
 *
 * Cet écran recouvre TOUTE l'application : c'est la seule surface encore visible
 * pour un gérant verrouillé. Ses actions doivent donc réellement aboutir —
 * « Régulariser l'Abonnement » ouvre le portail de facturation Stripe
 * (`POST /api/billing/portal`), et le recours support reste offert si le
 * portail est indisponible.
 */
export const SovereignLock: React.FC = () => {
    const { tenantConfig } = useNexusCore();
    const [isOpening, setIsOpening] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isLocked = tenantConfig?.status?.licenceStatus === 'LOCKED';
    const tenantName = tenantConfig?.name || tenantConfig?.metadata?.name || 'Nexus Node';
    const supportEmail = whiteLabelInstanceConfig.supportEmail;

    const handleRegularize = useCallback(async () => {
        setIsOpening(true);
        setError(null);
        try {
            const res = await authedFetch('/api/billing/portal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ returnUrl: window.location.origin }),
            });

            const payload = await res.json().catch(() => null) as { url?: string; error?: string } | null;

            if (!res.ok || !payload?.url) {
                // On expose la raison au gérant : c'est sa seule porte de sortie,
                // un échec silencieux le laisserait bloqué sans explication.
                setError(payload?.error ?? 'Le portail de facturation est injoignable pour le moment.');
                return;
            }

            window.location.assign(payload.url);
        } catch (err) {
            logger.error('[SovereignLock] Ouverture du portail impossible', toError(err).message);
            setError('Connexion impossible. Vérifiez votre accès au réseau, puis réessayez.');
        } finally {
            setIsOpening(false);
        }
    }, []);

    const supportHref =
        `mailto:${supportEmail}` +
        `?subject=${encodeURIComponent(`[Accès suspendu] ${tenantName}`)}` +
        `&body=${encodeURIComponent(
            `Bonjour,\n\nL'accès à notre instance « ${tenantName} » est suspendu (code 402).\n` +
            `Nous souhaitons régulariser notre abonnement.\n\nMerci de nous recontacter.`,
        )}`;

    return (
        <AnimatePresence>
            {isLocked && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    role="alertdialog"
                    aria-modal="true"
                    aria-labelledby="sovereign-lock-title"
                    className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6"
                >
                    <div className="max-w-md w-full bg-surface-card border border-status-danger/20 rounded-3xl p-10 text-center shadow-[0_0_100px_rgba(239,68,68,0.1)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-status-danger/10 rounded-full blur-[50px] -mr-16 -mt-16 pointer-events-none" />

                        <div className="mx-auto w-24 h-24 bg-status-danger/10 rounded-full flex items-center justify-center mb-8 border border-status-danger/20">
                            <ShieldAlert className="w-10 h-10 text-status-danger" />
                        </div>

                        <h2 id="sovereign-lock-title" className="text-3xl font-serif italic text-text-primary mb-4">Accès Suspendu</h2>
                        <p className="text-text-muted mb-10 leading-relaxed">
                            Votre abonnement pour l&apos;instance <strong className="text-text-primary">{tenantName}</strong> est actuellement suspendu suite à un incident de facturation.
                        </p>

                        <button
                            type="button"
                            onClick={handleRegularize}
                            disabled={isOpening}
                            className="w-full h-14 bg-status-danger hover:bg-status-danger/90 disabled:opacity-60 disabled:cursor-wait text-text-on-primary rounded-2xl font-bold uppercase tracking-widest text-xs transition-colors flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(239,68,68,0.2)]"
                        >
                            {isOpening
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <CreditCard className="w-4 h-4" />}
                            {isOpening ? 'Ouverture du portail…' : "Régulariser l'Abonnement"}
                        </button>

                        {error && (
                            <div role="alert" className="mt-4 text-left space-y-3">
                                <p className="text-xs text-status-danger leading-relaxed">{error}</p>
                                <a
                                    href={supportHref}
                                    className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-text-primary hover:text-status-danger transition-colors"
                                >
                                    <LifeBuoy className="w-3.5 h-3.5" />
                                    Écrire au support
                                </a>
                            </div>
                        )}

                        <div className="mt-8 text-nano font-mono text-secondary uppercase tracking-widest text-center">
                            Empire Engine • Code 402 Payment Required
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
