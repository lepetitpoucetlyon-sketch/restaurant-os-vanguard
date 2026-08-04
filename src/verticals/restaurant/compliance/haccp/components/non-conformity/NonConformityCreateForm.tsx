import React, { useState } from 'react';
import { Paperclip, X } from 'lucide-react';
import { toast } from 'sonner';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { useTenant } from '@/shared/hooks';
import { NonConformityType, NonConformity, NC_TYPES, TYPE_LABELS, STAFF_LIST } from './types';

function buildPath(tenantId: string, id: string): string {
    if (tenantId && tenantId !== 'restaurant-os' && tenantId !== 'main') {
        return `tenants/${tenantId}/nonConformities/${id}`;
    }
    return `nonConformities/${id}`;
}

function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Lecture du fichier échouée'));
        reader.readAsDataURL(file);
    });
}

interface NonConformityCreateFormProps {
    setShowForm: (show: boolean) => void;
    onCreated: (nc: NonConformity) => void;
}

export function NonConformityCreateForm({ setShowForm, onCreated }: NonConformityCreateFormProps) {
    const { tenantId } = useTenant();

    const [formType, setFormType] = useState<NonConformityType>('température hors norme');
    const [formDescription, setFormDescription] = useState('');
    const [formPhoto, setFormPhoto] = useState<string | undefined>(undefined);
    const [formPhotoName, setFormPhotoName] = useState('');
    const [formCorrective, setFormCorrective] = useState('');
    const [formResponsible, setFormResponsible] = useState(STAFF_LIST[0]);
    const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
    const [submitting, setSubmitting] = useState(false);

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
            onCreated(nc);
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

    return (
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
                            <img src={formPhoto} alt="Preview" className="w-20 h-20 object-cover rounded-lg border border-border" />
                            <button
                                onClick={() => { setFormPhoto(undefined); setFormPhotoName(''); }}
                                className="absolute -top-1 -right-1 w-5 h-5 bg-status-danger text-text-primary rounded-full flex items-center justify-center"
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
                    className="px-4 py-2 rounded-lg bg-action-primary text-text-primary text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
                >
                    {submitting ? 'Enregistrement...' : 'Enregistrer'}
                </button>
            </div>
        </div>
    );
}
