"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/shared/hooks";
import { Shield } from "lucide-react";
import { isMCCMode } from "@/config/instance";

// Tous les opérateurs MCC ont accès à l'admin layout.
// Les restrictions par onglet sont appliquées dans chaque composant via currentUser.role.
const MCC_ROLES = ["super_admin", "mcc_support", "mcc_junior_dev"];
const TENANT_ADMIN_ROLES = ["admin", "manager"];
const ADMIN_ROLES = isMCCMode() ? MCC_ROLES : [...TENANT_ADMIN_ROLES, ...MCC_ROLES];

export default function AdminLayout({ children }: { children: ReactNode }) {
    // Gate on the Nexus session user — the same source the rest of the app uses
    // (RoleGate, AccessPolicyManager, the MCC dashboard). The PIN login mints a
    // Firebase custom token that does NOT carry a `role` claim, so reading
    // token.claims.role here always failed → "Accès refusé" for a valid admin.
    const { currentUser, isAuthLoading } = useAuth();

    // While the session is still hydrating (AuthGate already guarantees the user is
    // authenticated before we render), show the spinner rather than flashing "denied".
    if (isAuthLoading || !currentUser) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface-bg">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const role = currentUser.role ?? "";
    if (!ADMIN_ROLES.includes(role)) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-surface-bg text-text-primary">
                <Shield className="w-10 h-10 text-status-danger" />
                <p className="text-sm font-bold uppercase tracking-widest text-status-danger">Accès refusé</p>
                <p className="text-xs text-text-primary/40">Ce panneau requiert un rôle administrateur.</p>
            </div>
        );
    }

    // Le thème est géré par ThemeApplicator (root layout) via themeModeAtom.
    // L'admin MCC suit le thème global — pas de forçage light ici.
    return <>{children}</>;
}
