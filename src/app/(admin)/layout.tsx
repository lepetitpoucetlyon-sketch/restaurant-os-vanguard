'use client';

import type { ReactNode } from 'react';
import { useAuth } from '@/shared/hooks';
import { Shield } from 'lucide-react';
import { isMCCMode } from '@/config/instance';

import { usePathname } from 'next/navigation';

// Tous les opérateurs MCC ont accès à l'admin layout.
// Les restrictions par onglet sont appliquées dans chaque composant via currentUser.role.
// Alias 'super_admin' conservé pour tokens Firebase legacy pendant la migration
const MCC_ROLES = ['mcc_super_admin', 'super_admin', 'mcc_support', 'mcc_junior_dev'];
const TENANT_ADMIN_ROLES = ['admin', 'manager'];
const ADMIN_ROLES = isMCCMode() ? MCC_ROLES : [...TENANT_ADMIN_ROLES, ...MCC_ROLES];

// Routes de gouvernance plateforme & flotte (MCC) — inaccessibles aux simples gérants/managers de restaurant
const MCC_EXCLUSIVE_PREFIXES = [
    '/admin/mcc',
    '/admin/simulation',
    '/admin/prospecting',
    '/admin/studio',
    '/system-map',
    '/simulator',
    '/blueprint',
];

export default function AdminLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const { currentUser, isAuthLoading } = useAuth();

    // While the session is still hydrating (AuthGate already guarantees the user is
    // authenticated before we render), show the spinner rather than flashing "denied".
    if (isAuthLoading || !currentUser) {
        return (
            <div className="min-h-[100dvh] flex items-center justify-center bg-surface-bg">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const role = currentUser.role ?? '';
    const isMccExclusiveRoute = pathname ? MCC_EXCLUSIVE_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`)) : false;

    // Si la route est une console globale de flotte MCC, seuls les opérateurs plateforme sont admis
    const allowedRoles = isMccExclusiveRoute ? MCC_ROLES : ADMIN_ROLES;

    if (!allowedRoles.includes(role)) {
        return (
            <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-4 bg-surface-bg text-text-primary">
                <Shield className="w-10 h-10 text-status-danger" />
                <p className="text-sm font-bold uppercase tracking-widest text-status-danger">
                    Accès refusé
                </p>
                <p className="text-xs text-text-primary/40">
                    {isMccExclusiveRoute 
                        ? "Ce panneau de flotte est strictement réservé aux opérateurs plateforme MCC." 
                        : "Ce panneau requiert un rôle administrateur."}
                </p>
            </div>
        );
    }

    // Le thème est géré par ThemeApplicator (root layout) via themeModeAtom.
    // L'admin MCC suit le thème global — pas de forçage light ici.
    return <>{children}</>;
}
