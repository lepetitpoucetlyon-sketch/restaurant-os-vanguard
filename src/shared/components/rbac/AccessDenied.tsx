import React from "react";
import { ShieldAlert } from "lucide-react";

export function AccessDenied() {
    return (
        <div className="flex flex-col items-center justify-center w-full h-full p-8 text-center bg-bg-primary">
            <div className="w-16 h-16 mb-4 rounded-full bg-status-danger/10 flex items-center justify-center">
                <ShieldAlert className="w-8 h-8 text-status-danger" />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">Accès Refusé</h2>
            <p className="text-sm text-text-muted max-w-md">
                Vous n'avez pas les permissions nécessaires pour accéder à cette page ou à cette fonctionnalité. 
                Veuillez contacter un administrateur si vous pensez qu'il s'agit d'une erreur.
            </p>
        </div>
    );
}
