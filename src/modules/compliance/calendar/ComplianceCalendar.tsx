'use client';

import { useState, useEffect } from 'react';
import { CalendarCheck, AlertTriangle, Clock, FileText, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { useTenant } from '@/shared/hooks';
import type { EmployeeDocument } from '@/domain/schemas/employeeDocument';
import type { License } from '@/domain/schemas/license';

interface ComplianceItem {
    id: string;
    type: 'document' | 'license' | 'duerp' | 'certification';
    name: string;
    expiresAt: string;
    status: 'ok' | 'expiring' | 'expired';
    relatedEntity?: string;
}

function getStatus(expiresAt: string): 'ok' | 'expiring' | 'expired' {
    const now = new Date();
    const exp = new Date(expiresAt);
    if (exp < now) return 'expired';
    const daysLeft = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (daysLeft <= 30) return 'expiring';
    return 'ok';
}

function statusColor(status: 'ok' | 'expiring' | 'expired'): string {
    switch (status) {
        case 'expired': return 'text-status-error bg-status-error/10 border-status-error/20';
        case 'expiring': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
        case 'ok': return 'text-status-success bg-status-success/10 border-status-success/20';
    }
}

export function ComplianceCalendar() {
    const { tenantId } = useTenant();
    const [items, setItems] = useState<ComplianceItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!tenantId) return;
        let cancelled = false;

        async function load() {
            const [docs, licenses] = await Promise.all([
                Nexus.adapter.query<EmployeeDocument>(`tenants/${tenantId}/employeeDocuments`),
                Nexus.adapter.query<License>(`tenants/${tenantId}/licenses`),
            ]);

            if (cancelled) return;

            const allItems: ComplianceItem[] = [];

            for (const doc of docs) {
                if (!doc.expiresAt) continue;
                allItems.push({
                    id: doc.id,
                    type: 'document',
                    name: `${doc.name} (${doc.type})`,
                    expiresAt: doc.expiresAt,
                    status: getStatus(doc.expiresAt),
                    relatedEntity: doc.userId,
                });
            }

            for (const lic of licenses) {
                if (!lic.expiresAt) continue;
                allItems.push({
                    id: lic.id,
                    type: 'license',
                    name: `${lic.name} (${lic.type})`,
                    expiresAt: lic.expiresAt,
                    status: getStatus(lic.expiresAt),
                });
            }

            allItems.sort((a, b) => a.expiresAt.localeCompare(b.expiresAt));
            setItems(allItems);
            setLoading(false);
        }

        load();
        return () => { cancelled = true; };
    }, [tenantId]);

    const expired = items.filter(i => i.status === 'expired');
    const expiring = items.filter(i => i.status === 'expiring');

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-action-primary/10 flex items-center justify-center">
                    <CalendarCheck className="w-4 h-4 text-action-primary" />
                </div>
                <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-text-primary">
                        Calendrier de conformité
                    </h3>
                    <p className="text-[10px] text-text-muted">
                        {expired.length} expiré{expired.length > 1 ? 's' : ''} · {expiring.length} à renouveler
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="w-5 h-5 border-2 border-action-primary/30 border-t-action-primary rounded-full animate-spin" />
                </div>
            ) : items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-text-muted">
                    <ShieldCheck className="w-8 h-8" />
                    <p className="text-xs">Aucune échéance enregistrée</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {items.map(item => (
                        <div
                            key={item.id}
                            className={cn(
                                'flex items-center justify-between rounded-xl border px-4 py-3 text-[11px]',
                                statusColor(item.status)
                            )}
                        >
                            <div className="flex items-center gap-2">
                                {item.status === 'expired' ? (
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                ) : item.status === 'expiring' ? (
                                    <Clock className="w-3.5 h-3.5" />
                                ) : (
                                    <FileText className="w-3.5 h-3.5" />
                                )}
                                <span className="font-bold">{item.name}</span>
                            </div>
                            <span className="font-mono text-[10px]">
                                {new Date(item.expiresAt).toLocaleDateString('fr-FR')}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
