import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { useTenant } from '@/shared/hooks';
import { NonConformity, TYPE_LABELS } from './types';
import { StatusBadge } from './StatusBadge';

function buildPath(tenantId: string, id: string): string {
    if (tenantId && tenantId !== 'restaurant-os' && tenantId !== 'main') {
        return `tenants/${tenantId}/nonConformities/${id}`;
    }
    return `nonConformities/${id}`;
}

interface NonConformityCardProps {
    nc: NonConformity;
    expandedId: string | null;
    setExpandedId: (id: string | null) => void;
    onResolved: (nc: NonConformity, resolutionNote: string) => void;
}

export function NonConformityCard({ nc, expandedId, setExpandedId, onResolved }: NonConformityCardProps) {
    const { tenantId } = useTenant();
    const [resolvingId, setResolvingId] = useState<string | null>(null);
    const [resolutionNote, setResolutionNote] = useState('');

    const handleResolve = async (ncToResolve: NonConformity) => {
        if (!resolutionNote.trim()) {
            toast.error('Veuillez saisir une note de résolution');
            return;
        }
        try {
            const update: Partial<NonConformity> = {
                status: 'resolved',
                resolutionNote: resolutionNote.trim(),
                resolvedAt: Date.now(),
            };
            await Nexus.adapter.update(buildPath(tenantId ?? '', ncToResolve.id), update);
            onResolved(ncToResolve, resolutionNote.trim());
            setResolvingId(null);
            setResolutionNote('');
            toast.success('Non-conformité résolue');
        } catch {
            toast.error('Erreur lors de la résolution');
        }
    };

    return (
        <div
            className={`rounded-xl border transition-colors ${
                nc.status === 'open' ? 'border-status-danger/30 bg-status-danger/5' : 'border-border bg-surface-base'
            }`}
        >
            {/* En-tête carte */}
            <button
                onClick={() => setExpandedId(expandedId === nc.id ? null : nc.id)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
            >
                <div className="flex items-center gap-3 min-w-0">
                    <StatusBadge status={nc.status} />
                    <span className="font-medium text-sm text-text-primary truncate">{TYPE_LABELS[nc.type]}</span>
                    <span className="text-xs text-text-muted hidden sm:block">
                        {new Date(nc.date).toLocaleDateString('fr-FR')} — {nc.responsible}
                    </span>
                </div>
                {expandedId === nc.id ? (
                    <ChevronUp className="w-4 h-4 text-text-muted flex-shrink-0" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-text-muted flex-shrink-0" />
                )}
            </button>

            {/* Détail expandé */}
            {expandedId === nc.id && (
                <div className="px-4 pb-4 space-y-3 border-t border-border/50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                        <div>
                            <p className="text-xs text-text-muted mb-1">Description</p>
                            <p className="text-sm text-text-primary">{nc.description}</p>
                        </div>
                        <div>
                            <p className="text-xs text-text-muted mb-1">Action corrective</p>
                            <p className="text-sm text-text-primary">{nc.correctiveAction}</p>
                        </div>
                    </div>

                    {nc.photoRef && (
                        <div>
                            <p className="text-xs text-text-muted mb-1">Photo</p>
                            <img
                                src={nc.photoRef}
                                alt="Photo non-conformité"
                                className="max-w-[200px] rounded-lg border border-border object-cover"
                            />
                        </div>
                    )}

                    {nc.status === 'resolved' && nc.resolutionNote && (
                        <div className="bg-status-success/10 rounded-lg px-3 py-2">
                            <p className="text-xs text-status-success font-medium mb-0.5">Note de résolution</p>
                            <p className="text-sm text-text-primary">{nc.resolutionNote}</p>
                        </div>
                    )}

                    {nc.status === 'open' && (
                        <>
                            {resolvingId === nc.id ? (
                                <div className="space-y-2">
                                    <label className="block text-xs text-text-muted">Note de résolution *</label>
                                    <textarea
                                        value={resolutionNote}
                                        onChange={e => setResolutionNote(e.target.value)}
                                        rows={2}
                                        placeholder="Décrivez comment le problème a été résolu..."
                                        className="w-full px-3 py-2 rounded-lg border border-border bg-surface-base text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-action-primary resize-none"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => { setResolvingId(null); setResolutionNote(''); }}
                                            className="px-3 py-1.5 rounded-lg border border-border text-text-muted text-xs hover:text-text-primary transition-colors"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            onClick={() => handleResolve(nc)}
                                            className="px-3 py-1.5 rounded-lg bg-status-success text-text-primary text-xs font-medium hover:opacity-90 transition-opacity"
                                        >
                                            Marquer résolu
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => { setResolvingId(nc.id); setResolutionNote(''); }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-status-success/40 text-status-success text-xs font-medium hover:bg-status-success/10 transition-colors"
                                >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Marquer comme résolu
                                </button>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
