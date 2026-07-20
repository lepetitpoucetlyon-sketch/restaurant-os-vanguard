"use client";

import { ReactNode, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { Shield } from "lucide-react";

const FLEET_ROLES = ["fleet_admin", "SUPER_ADMIN"] as const;

export default function AdminLayout({ children }: { children: ReactNode }) {
    const [status, setStatus] = useState<"loading" | "authorized" | "denied">("loading");

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (!user) {
                setStatus("denied");
                return;
            }
            try {
                const token = await user.getIdTokenResult(true);
                const role = typeof token.claims.role === "string" ? token.claims.role : "";
                setStatus((FLEET_ROLES as readonly string[]).includes(role) ? "authorized" : "denied");
            } catch {
                setStatus("denied");
            }
        });
        return () => unsubscribe();
    }, []);

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0B0B10]">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (status === "denied") {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#0B0B10] text-white">
                <Shield className="w-10 h-10 text-red-500" />
                <p className="text-sm font-bold uppercase tracking-widest text-red-400">Accès refusé</p>
                <p className="text-xs text-white/40">Ce panneau requiert le rôle <code className="text-indigo-400">fleet_admin</code>.</p>
            </div>
        );
    }

    return <>{children}</>;
}
