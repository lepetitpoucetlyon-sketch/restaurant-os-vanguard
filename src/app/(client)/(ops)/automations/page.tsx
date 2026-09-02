"use client";

import { AutomationsPanel } from '@/modules/intelligence';
import { withPageGuard } from '@/shared/components/rbac/PageGuard';
import { PageShell } from '@/shared/components/ui/PageShell';
import { Zap } from 'lucide-react';

function AutomationsPage() {
    return (
        <PageShell
            kicker="Règles & Triggers"
            title="Automatisations"
            subtitle="Faites réagir le socle tout seul aux événements du service."
            icon={Zap}
            breadcrumbs={[{ label: "Opérations" }, { label: "Automatisations" }]}
        >
            <div className="p-6">
                <AutomationsPanel />
            </div>
        </PageShell>
    );
}

export default withPageGuard(AutomationsPage, 'automations');
