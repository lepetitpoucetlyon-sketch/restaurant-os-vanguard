'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlertOctagon, Plus, CheckCircle2 } from 'lucide-react';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { useTenant } from '@/shared/hooks';
import { NonConformity } from './non-conformity/types';
import { NonConformityCreateForm } from './non-conformity/NonConformityCreateForm';
import { NonConformityCard } from './non-conformity/NonConformityCard';

function buildCollectionPath(tenantId: string): string {
    if (tenantId && tenantId !== 'restaurant-os' && tenantId !== 'main') {
        return `tenants/${tenantId}/nonConformities`;
    }
    return 'nonConformities';
}

interface NonConformityFormProps {
    onCountChange?: (openCount: number) => void;
}

export function NonConformityForm({ onCountChange }: NonConformityFormProps) {
    const { tenantId } = useTenant();

    // Liste des NC
    const [records, setRecords] = useState<NonConformity[]>([]);
    const [loading, setLoading] = useState(true);

    // Formulaire création
    const [showForm, setShowForm] = useState(false);

    // Expand / collapse des items
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const loadRecords = useCallback(async () => {
        setLoading(true);
        try {
            const path = buildCollectionPath(tenantId ?? '');
            const raw = await Nexus.adapter.query<NonConformity>(path, {
                orderBy: { field: 'createdAt', direction: 'desc' },
            });
            setRecords(raw);
            onCountChange?.(raw.filter(r => r.status === 'open').length);
        } catch {
            // Silencieux
        } finally {
            setLoading(false);
        }
    }, [tenantId, onCountChange]);

    useEffect(() => {
        loadRecords();
    }, [loadRecords]);

    const openCount = records.filter(r => r.status === 'open').length;

    const handleCreated = (nc: NonConformity) => {
        setRecords(prev => [nc, ...prev]);
        onCountChange?.(records.filter(r => r.status === 'open').length + 1);
    };

    const handleResolved = (ncToResolve: NonConformity, resolutionNote: string) => {
        const update: Partial<NonConformity> = {
            status: 'resolved',
            resolutionNote: resolutionNote,
            resolvedAt: Date.now(),
        };
        setRecords(prev =>
            prev.map(r => r.id === ncToResolve.id ? { ...r, ...update } as NonConformity : r)
        );
        const newOpen = records.filter(r => r.status === 'open' && r.id !== ncToResolve.id).length;
        onCountChange?.(newOpen);
    };

    return (
        <div className="space-y-4">
            {/* En-tête */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-text-primary">Non-conformités</h2>
                    {openCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-status-danger/15 text-status-danger text-xs font-bold">
                            <AlertOctagon className="w-3 h-3" />
                            {openCount} ouverte{openCount > 1 ? 's' : ''}
                        </span>
                    )}
                </div>
                <button
                    onClick={() => setShowForm(s => !s)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-action-primary text-text-primary text-sm font-medium hover:opacity-90 transition-opacity"
                >
                    <Plus className="w-4 h-4" />
                    Signaler
                </button>
            </div>

            {/* Formulaire de création */}
            {showForm && (
                <NonConformityCreateForm setShowForm={setShowForm} onCreated={handleCreated} />
            )}

            {/* Liste des NC */}
            {loading ? (
                <div className="text-sm text-text-muted animate-pulse p-4">Chargement...</div>
            ) : records.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-text-muted bg-surface-sidebar rounded-xl border border-border">
                    <CheckCircle2 className="w-8 h-8 opacity-40" />
                    <p className="text-sm">Aucune non-conformité enregistrée</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {records.map(nc => (
                        <NonConformityCard 
                            key={nc.id}
                            nc={nc}
                            expandedId={expandedId}
                            setExpandedId={setExpandedId}
                            onResolved={handleResolved}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
