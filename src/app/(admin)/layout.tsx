"use client";

import { ReactNode } from "react";
import { useAuth } from "@/hooks";
import { Shield } from "lucide-react";

// Roles allowed to access any (admin) route.
// MCC-specific pages (/admin/mcc) have their own MFAGate on top of this.
const ADMIN_ROLES = ["fleet_admin", "SUPER_ADMIN", "admin", "manager"];

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
            <div className="min-h-screen flex items-center justify-center bg-[#0B0B10]">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const role = currentUser.role ?? "";
    if (!ADMIN_ROLES.includes(role)) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#0B0B10] text-white">
                <Shield className="w-10 h-10 text-red-500" />
                <p className="text-sm font-bold uppercase tracking-widest text-red-400">Accès refusé</p>
                <p className="text-xs text-white/40">Ce panneau requiert un rôle administrateur.</p>
            </div>
        );
    }

    return <>{children}</>;
}
