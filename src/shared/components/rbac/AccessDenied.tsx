import React from "react";
import { ShieldAlert, Home, UserCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function AccessDenied() {
    const router = useRouter();

    return (
        <div className="flex flex-col items-center justify-center w-full min-h-[60vh] p-8 text-center bg-surface-bg">
            <div className="w-16 h-16 mb-4 rounded-full bg-status-danger/10 flex items-center justify-center">
                <ShieldAlert className="w-8 h-8 text-status-danger" />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">Accès Refusé</h2>
            <p className="text-sm text-text-muted max-w-md mb-6 leading-relaxed">
                Vous ne disposez pas des habilitations nécessaires pour accéder à cet écran ou à cette fonction.
                Veuillez contacter un responsable de salle ou vous connecter avec un profil autorisé.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-card border border-border text-text-primary text-xs font-medium hover:bg-surface-hover transition-colors cursor-pointer"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Retour</span>
                </button>
                <Link
                    href="/mon-espace"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-action-primary text-text-on-action text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                    <Home className="w-4 h-4" />
                    <span>Mon espace</span>
                </Link>
                <Link
                    href="/welcome-staff"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-card border border-border text-text-primary text-xs font-medium hover:bg-surface-hover transition-colors"
                >
                    <UserCheck className="w-4 h-4" />
                    <span>Changer d'utilisateur</span>
                </Link>
            </div>
        </div>
    );
}
