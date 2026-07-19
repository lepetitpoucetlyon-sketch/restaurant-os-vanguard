'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    AlertOctagon,
    Plus,
    CheckCircle2,
    Clock,
    ChevronDown,
    ChevronUp,
    Paperclip,
    X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { useTenant } from '@/hooks';

// ── Types ──────────────────────────────────────────────────────────────────────

export type NonConformityType =
    | 'température hors norme'
    | 'produit non-conforme'
    | 'livraison refusée'
    | 'contamination'
    | 'autre';

export interface NonConformity {
    id: string;
    type: NonConformityType;
    description: string;
    photoRef?: string;       // base64 data URI or file name reference
    correctiveAction: string;
    responsible: string;
    date: string;            // ISO date string
    status: 'open' | 'resolved';
    createdAt: number;
    resolutionNote?: string;
    resolvedAt?: number;
}

// ── Configuration ──────────────────────────────────────────────────────────────

const NC_TYPES: NonConformityType[] = [
    'température hors norme',
    'produit non-conforme',
    'livraison refusée',
    'contamination',
    'autre',
];

const STAFF_LIST = [
    'Chef de cuisine',
    'Second de cuisine',
    'Chef de partie',
    'Responsable HACCP',
    'Responsable de salle',
    'Directeur / Manager',
];

const TYPE_LABELS: Record<NonConformityType, string> = {
    'température hors norme': 'Température hors norme',
    'produit non-conforme': 'Produit non-conforme',
    'livraison refusée': 'Livraison refusée',
    'contamination': 'Contamination',
    'autre': 'Autre',
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function buildPath(tenantId: string, id: string): string {
    if (tenantId && tenantId !== 'restaurant-os' && tenantId !== 'main') {
        return `tenants/${tenantId}/nonConformities/${id}`;
    }
    return `nonConformities/${id}`;
}

function buildCollectionPath(tenantId: string): string {
    if (tenantId && tenantId !== 'restaurant-os' && tenantId !== 'main') {
        return `tenants/${tenantId}/nonConformities`;
    }
    return 'nonConformities';
}

function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Lecture du fichier échouée'));
        reader.readAsDataURL(file);
    });
}

// ── Sous-composant : badge statut ─────────────────────────────────────────────

function StatusBadge({ status }: { status: NonConformity['status'] }) {
    if (status === 'resolved') {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-status-success/15 text-status-success text-xs font-medium">
                <CheckCircle2 className="w-3 h-3" /> Résolu
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-status-danger/15 text-status-danger text-xs font-medium animate-pulse">
            <Clock className="w-3 h-3" /> Ouvert
        </span>
    );
}

// ── Composant principal ────────────────────────────────────────────────────────

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
    const [formType, setFormType] = useState<NonConformityType>('température hors norme');
    const [formDescription, setFormDescription] = useState('');
    const [formPhoto, setFormPhoto] = useState<string | undefined>(undefined);
    const [formPhotoName, setFormPhotoName] = useState('');
    const [formCorrective, setFormCorrective] = useState('');
    const [formResponsible, setFormResponsible] = useState(STAFF_LIST[0]);
    const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
    const [submitting, setSubmitting] = useState(false);

    // Résolution
    const [resolvingId, setResolvingId] = useState<string | null>(null);
    const [resolutionNote, setResolutionNote] = useState('');

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

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            toast.error('Photo trop volumineuse (max 2 Mo)');
            return;
        }
        try {
            const b64 = await fileToBase64(file);
            setFormPhoto(b64);
            setFormPhotoName(file.name);
        } catch {
            toast.error('Impossible de lire l\'image');
        }
    };

    const handleSubmit = async () => {
        if (!formDescription.trim()) {
            toast.error('Veuillez saisir une description');
            return;
        }
        if (!formCorrective.trim()) {
            toast.error('Veuillez décrire l\'action corrective');
            return;
        }
        setSubmitting(true);
        try {
            const id = crypto.randomUUID();
            const nc: NonConformity = {
                id,
                type: formType,
                description: formDescription.trim(),
                photoRef: formPhoto,
                correctiveAction: formCorrective.trim(),
                responsible: formResponsible,
                date: formDate,
                status: 'open',
                createdAt: Date.now(),
            };
            await Nexus.adapter.set(buildPath(tenantId ?? '', id), nc);
            setRecords(prev => [nc, ...prev]);
            onCountChange?.(records.filter(r => r.status === 'open').length + 1);
            toast.success('Non-conformité enregistrée');
            // Reset form
            setShowForm(false);
            setFormDescription('');
            setFormCorrective('');
            setFormPhoto(undefined);
            setFormPhotoName('');
            setFormDate(new Date().toISOString().split('T')[0]);
            setFormType('température hors norme');
        } catch {
            toast.error('Erreur lors de l\'enregistrement');
        } finally {
            setSubmitting(false);
        }
    };

    const handleResolve = async (nc: NonConformity) => {
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
            await Nexus.adapter.update(buildPath(tenantId ?? '', nc.id), update);
            setRecords(prev =>
                prev.map(r => r.id === nc.id ? { ...r, ...update } : r)
            );
            const newOpen = records.filter(r => r.status === 'open' && r.id !== nc.id).length;
            onCountChange?.(newOpen);
            setResolvingId(null);
            setResolutionNote('');
            toast.success('Non-conformité résolue');
        } catch {
            toast.error('Erreur lors de la résolution');
        }
    };

    const openCount = records.filter(r => r.status === 'open').length;

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
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-action-primary text-white text-sm font-medium hover:opacity-90 transition-opacity"
                >
                    <Plus className="w-4 h-4" />
                    Signaler
                </button>
            </div>

            {/* Formulaire de création */}
            {showForm && (
                <div className="bg-surface-sidebar rounded-xl border border-border p-5 space-y-4">
                    <h3 className="font-semibold text-text-primary text-sm">Nouvelle non-conformité</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Type */}
                        <div>
                            <label className="block text-xs text-text-muted mb-1">Type *</label>
                            <select
                                value={formType}
                                onChange={e => setFormType(e.target.value as NonConformityType)}
                                className="w-full px-3 py-2 rounded-lg border border-border bg-surface-base text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-action-primary"
                            >
                                {NC_TYPES.map(t => (
                                    <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                                ))}
                            </select>
                        </div>

                        {/* Date */}
                        <div>
                            <label className="block text-xs text-text-muted mb-1">Date *</label>
                            <input
                                type="date"
                                value={formDate}
                                onChange={e => setFormDate(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-border bg-surface-base text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-action-primary"
                            />
                        </div>

                        {/* Responsable */}
                        <div>
                            <label className="block text-xs text-text-muted mb-1">Responsable *</label>
                            <select
                                value={formResponsible}
                                onChange={e => setFormResponsible(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-border bg-surface-base text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-action-primary"
                            >
                                {STAFF_LIST.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>

                        {/* Photo */}
                        <div>
                            <label className="block text-xs text-text-muted mb-1">Photo (optionnel)</label>
                            <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-surface-base text-text-muted text-sm cursor-pointer hover:text-text-primary transition-colors">
                                <Paperclip className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{formPhotoName || 'Joindre une photo'}</span>
                                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                            </label>
                            {formPhoto && (
                                <div className="relative mt-2 w-20 h-20">
                                    { }
                                    <img src={formPhoto} alt="Preview" className="w-20 h-20 object-cover rounded-lg border border-border" />
                                    <button
                                        onClick={() => { setFormPhoto(undefined); setFormPhotoName(''); }}
                                        className="absolute -top-1 -right-1 w-5 h-5 bg-status-danger text-white rounded-full flex items-center justify-center"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs text-text-muted mb-1">Description *</label>
                        <textarea
                            value={formDescription}
                            onChange={e => setFormDescription(e.target.value)}
                            rows={3}
                            placeholder="Décrivez la non-conformité observée..."
                            className="w-full px-3 py-2 rounded-lg border border-border bg-surface-base text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-action-primary resize-none"
                        />
                    </div>

                    {/* Action corrective */}
                    <div>
                        <label className="block text-xs text-text-muted mb-1">Action corrective *</label>
                        <textarea
                            value={formCorrective}
                            onChange={e => setFormCorrective(e.target.value)}
                            rows={2}
                            placeholder="Mesure corrective immédiate appliquée ou prévue..."
                            className="w-full px-3 py-2 rounded-lg border border-border bg-surface-base text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-action-primary resize-none"
                        />
                    </div>

                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={() => setShowForm(false)}
                            className="px-4 py-2 rounded-lg border border-border text-text-muted text-sm hover:text-text-primary transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="px-4 py-2 rounded-lg bg-action-primary text-white text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
                        >
                            {submitting ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                    </div>
                </div>
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
                        <div
                            key={nc.id}
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
                                            { }
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
                                                            className="px-3 py-1.5 rounded-lg bg-status-success text-white text-xs font-medium hover:opacity-90 transition-opacity"
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
                    ))}
                </div>
            )}
        </div>
    );
}
