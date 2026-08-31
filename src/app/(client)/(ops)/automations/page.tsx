"use client";

import { AutomationsPanel } from '@/modules/intelligence';
import { usePageAccess } from '@/shared/hooks/usePageAccess';

export default function AutomationsPage() {
    const canAccess = usePageAccess('automations');
    if (!canAccess) {
        return (
            <div className="p-8">
                <h1 className="text-2xl font-black text-text-primary mb-4">Automatisations</h1>
                <p className="text-text-muted">{"Accès réservé au directeur ou à l'administrateur."}</p>
            </div>
        );
    }
    return (
        <div className="p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-black text-text-primary">Automatisations</h1>
                <p className="text-text-muted mt-2">{"Faites réagir le socle tout seul aux événements du service."}</p>
            </header>
            <AutomationsPanel />
        </div>
    );
}
