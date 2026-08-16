'use client';

import { Lock } from "lucide-react";

export function AccountAccessDenied() {
    return (
        <div className="min-h-[80vh] flex items-center justify-center">
            <div className="text-center">
                <div className="w-20 h-20 bg-status-danger dark:bg-status-danger rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <Lock className="w-10 h-10 text-status-danger" />
                </div>
                <h1 className="text-2xl font-black text-text-primary mb-2">Accès Refusé</h1>
                <p className="text-text-muted">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
            </div>
        </div>
    );
}
