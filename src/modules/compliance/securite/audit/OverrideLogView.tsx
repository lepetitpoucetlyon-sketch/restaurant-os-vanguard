'use client';

import { useState, useEffect } from 'react';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { useTenant } from '@/shared/hooks/useTenant';
import type { AuditEvent } from '../../domain/schemas/audit';

const OVERRIDE_ACTIONS = ['override', 'elevation'] as const;

export function OverrideLogView() {
    const { activeTenantId } = useTenant();
    const [events, setEvents] = useState<AuditEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!activeTenantId) return;
        let cancelled = false;

        async function load() {
            const path = `tenants/${activeTenantId}/auditLog`;
            const all = await Nexus.adapter.query<AuditEvent>(path, {
                orderBy: { field: 'ts', direction: 'desc' },
                limit: 200,
            });
            if (cancelled) return;
            const overrides = all.filter(e =>
                (OVERRIDE_ACTIONS as readonly string[]).includes(e.action)
            );
            setEvents(overrides);
            setLoading(false);
        }

        load();
        return () => { cancelled = true; };
    }, [activeTenantId]);

    if (loading) return <div className="p-4 text-sm text-text-muted">Chargement du journal des overrides…</div>;
    if (events.length === 0) return <div className="p-4 text-sm text-text-muted">Aucun override enregistré.</div>;

    return (
        <div className="space-y-2 p-4">
            <h3 className="text-lg font-semibold">Journal des overrides (30 derniers jours)</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="border-b text-left text-text-muted">
                            <th className="py-2 pr-4">Date</th>
                            <th className="py-2 pr-4">Acteur</th>
                            <th className="py-2 pr-4">Rôle</th>
                            <th className="py-2 pr-4">Action</th>
                            <th className="py-2 pr-4">Collection</th>
                            <th className="py-2 pr-4">Entité</th>
                        </tr>
                    </thead>
                    <tbody>
                        {events.map(event => (
                            <tr key={event.id} className="border-b hover:bg-gray-50 dark:hover:bg-surface-card">
                                <td className="py-2 pr-4 font-mono text-xs">
                                    {new Date(event.ts).toLocaleString('fr-FR')}
                                </td>
                                <td className="py-2 pr-4">{event.actorId}</td>
                                <td className="py-2 pr-4">{event.actorRole}</td>
                                <td className="py-2 pr-4">
                                    <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                                        {event.action}
                                    </span>
                                </td>
                                <td className="py-2 pr-4">{event.collection}</td>
                                <td className="py-2 pr-4 font-mono text-xs">{event.entityId ?? '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
