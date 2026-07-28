'use client';

/**
 * MFAGate — mcc-core-3
 *
 * Enforces TOTP 2FA enrollment for fleet_admin accounts.
 * Wraps MCC pages with an enrollment modal when the Firebase user has no MFA factor.
 *
 * Flow:
 *  1. On mount: check multiFactor(user).enrolledFactors
 *  2. If none → show enrollment modal (blocks the page)
 *  3. User opens Google Authenticator, enters manual key (or scans otpauth:// URI)
 *  4. User enters 6-digit OTP → completeTOTPEnrollment
 *  5. On success → gate dissolves, children render
 */

import React, { useCallback, useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { ShieldAlert, ShieldCheck, Copy, Check, Loader2, AlertCircle } from 'lucide-react';
import {
    isMFAEnrolled,
    startTOTPEnrollment,
    completeTOTPEnrollment,
    type MFAEnrollmentSession,
} from '@/lib/auth/mfa';

type GateStatus = 'checking' | 'enrolled' | 'needs_enrollment' | 'enrolling' | 'verifying' | 'error';

interface MFAGateProps {
    /** Role required to trigger the MFA check — defaults to fleet_admin */
    role?: string;
    children: React.ReactNode;
}

export function MFAGate({ role = 'fleet_admin', children }: MFAGateProps) {
    const [status, setStatus] = useState<GateStatus>('checking');
    const [session, setSession] = useState<MFAEnrollmentSession | null>(null);
    const [otp, setOtp] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState<'url' | 'key' | null>(null);

    // Determine the current user's role from Firebase custom claims
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        const user = getAuth().currentUser;
        if (!user) {
            setStatus('enrolled'); // Auth guard upstream will block non-authed users
            return;
        }
        user.getIdTokenResult(false).then(result => {
            const claimedRole = typeof result.claims.role === 'string' ? result.claims.role : null;
            setUserRole(claimedRole);
        }).catch(() => setUserRole(null));
    }, []);

    useEffect(() => {
        if (userRole === null) return;
        // Only gate fleet_admin (or the specified role)
        if (userRole !== role && role === 'fleet_admin' && userRole !== 'SUPER_ADMIN') {
            setStatus('enrolled');
            return;
        }
        setStatus(isMFAEnrolled() ? 'enrolled' : 'needs_enrollment');
    }, [userRole, role]);

    const handleStartEnrollment = useCallback(async () => {
        setStatus('enrolling');
        setError(null);
        try {
            const user = getAuth().currentUser;
            if (!user?.email) throw new Error('Email introuvable sur le compte');
            const sess = await startTOTPEnrollment(user.email);
            setSession(sess);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors de la génération du secret TOTP');
            setStatus('needs_enrollment');
        }
    }, []);

    const handleVerifyOTP = useCallback(async () => {
        if (!session || otp.length !== 6) return;
        setStatus('verifying');
        setError(null);
        try {
            await completeTOTPEnrollment(session.secret, otp);
            setStatus('enrolled');
        } catch (err) {
            setError("Code incorrect ou expiré. Vérifiez l'heure système et réessayez.");
            setStatus('enrolling');
        }
    }, [session, otp]);

    const copy = useCallback(async (text: string, field: 'url' | 'key') => {
        await navigator.clipboard.writeText(text);
        setCopied(field);
        setTimeout(() => setCopied(null), 2000);
    }, []);

    if (status === 'checking') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-black">
                <Loader2 className="animate-spin text-orange-500" size={32} />
            </div>
        );
    }

    if (status === 'enrolled') {
        return <>{children}</>;
    }

    // -- Enrollment gate --
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm">
            <div className="w-full max-w-lg mx-4 bg-surface-bg border border-orange-500/40 rounded-2xl shadow-2xl shadow-orange-900/20 p-8">

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-orange-500/10 rounded-lg">
                        <ShieldAlert className="text-orange-400" size={24} />
                    </div>
                    <div>
                        <h2 className="text-text-primary font-semibold text-lg">Authentification 2 facteurs requise</h2>
                        <p className="text-text-secondary text-sm">Accès MCC — fleet_admin</p>
                    </div>
                </div>

                <p className="text-text-secondary text-sm mb-6 leading-relaxed">
                    Un compte admin compromis donne accès à <strong className="text-orange-400">tous les restaurants</strong> de la flotte.
                    Vous devez activer le TOTP (Google Authenticator, Authy, 1Password) pour continuer.
                </p>

                {status === 'needs_enrollment' && (
                    <button
                        onClick={handleStartEnrollment}
                        className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-text-primary font-medium rounded-xl transition-colors"
                    >
                        Configurer l&apos;authentificateur
                    </button>
                )}

                {status === 'enrolling' && session && (
                    <div className="space-y-5">
                        <div className="bg-surface-card rounded-xl p-4 space-y-4">
                            <p className="text-text-secondary text-sm font-medium">
                                1 — Ouvrez votre application (Google Authenticator · Authy · 1Password)
                            </p>
                            <p className="text-text-secondary text-sm font-medium">
                                2 — Ajoutez un compte manuellement et copiez cette clé secrète :
                            </p>

                            {/* Manual key */}
                            <div className="flex items-center gap-2">
                                <code className="flex-1 bg-surface-bg text-orange-300 text-xs font-mono px-3 py-2 rounded-lg break-all select-all">
                                    {session.manualKey}
                                </code>
                                <button
                                    onClick={() => copy(session.manualKey, 'key')}
                                    className="shrink-0 p-2 bg-surface-elevated hover:bg-zinc-600 rounded-lg transition-colors"
                                    title="Copier la clé"
                                >
                                    {copied === 'key' ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-text-secondary" />}
                                </button>
                            </div>

                            <p className="text-text-muted text-xs">
                                Type : TOTP · Algorithme : SHA-1 · Période : 30 s · Chiffres : 6
                            </p>

                            <p className="text-text-secondary text-sm font-medium mt-2">
                                Ou scannez l&apos;URI otpauth (mode avancé) :
                            </p>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 bg-surface-bg text-text-secondary text-xs font-mono px-3 py-2 rounded-lg break-all select-all">
                                    {session.qrUrl}
                                </code>
                                <button
                                    onClick={() => copy(session.qrUrl, 'url')}
                                    className="shrink-0 p-2 bg-surface-elevated hover:bg-zinc-600 rounded-lg transition-colors"
                                    title="Copier l'URI"
                                >
                                    {copied === 'url' ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-text-secondary" />}
                                </button>
                            </div>
                        </div>

                        {/* OTP input */}
                        <div className="space-y-2">
                            <label className="text-text-secondary text-sm font-medium">
                                3 — Entrez le code à 6 chiffres affiché dans l&apos;app :
                            </label>
                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                pattern="\d{6}"
                                placeholder="000000"
                                value={otp}
                                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                onKeyDown={e => e.key === 'Enter' && handleVerifyOTP()}
                                className="w-full bg-surface-card border border-zinc-600 text-text-primary text-center text-xl font-mono tracking-widest rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 transition-colors"
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-status-danger text-sm">
                                <AlertCircle size={14} />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            onClick={handleVerifyOTP}
                            disabled={otp.length !== 6}
                            className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 disabled:bg-surface-elevated disabled:cursor-not-allowed text-text-primary font-medium rounded-xl transition-colors"
                        >
                            Vérifier et activer le 2FA
                        </button>
                    </div>
                )}

                {status === 'verifying' && (
                    <div className="flex items-center justify-center gap-3 py-8 text-text-secondary">
                        <Loader2 className="animate-spin" size={20} />
                        <span>Vérification en cours…</span>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-zinc-800">
                    <div className="flex items-center gap-2 text-text-muted text-xs">
                        <ShieldCheck size={12} />
                        <span>Le secret TOTP n&apos;est jamais stocké sur nos serveurs — clé locale dans l&apos;app uniquement.</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
