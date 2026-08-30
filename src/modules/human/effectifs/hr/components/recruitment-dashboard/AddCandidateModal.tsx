'use client';

import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Trash2, Camera, Download, ChevronRight, FileCheck2, X } from 'lucide-react';
import type { Candidate } from '@nexus/contracts';
import { PremiumSelect } from '@components/ui/PremiumSelect';
import { StorageManager } from '@/infrastructure/services/storage';
import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';

/** Au-delà, l'envoi échoue côté stockage sans message utile. */
const MAX_CV_BYTES = 8 * 1024 * 1024;

interface AddCandidateModalProps { 
    isOpen: boolean; 
    onClose: () => void; 
    onAdd: (candidate: Partial<Candidate>) => Promise<void>;
}

export function AddCandidateModal({ isOpen, onClose, onAdd }: AddCandidateModalProps) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        appliedRole: '',
        cvUrl: undefined as string | undefined,
        gdpr: { 
            consented: false, 
            method: 'digital' as "digital" | "written" | "verbal_logged", 
            date: new Date().toISOString() 
        }
    });

    const [cvName, setCvName] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const pdfInputRef = useRef<HTMLInputElement>(null);
    const scanInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    /**
     * Dépose le CV via l'abstraction de stockage (agnostique du fournisseur)
     * et renseigne `cvUrl`, qui existait dans le formulaire mais n'était
     * jamais alimenté : les deux zones de dépôt ne faisaient rien.
     */
    const handleCvFile = async (file: File) => {
        if (file.size > MAX_CV_BYTES) {
            setUploadError(`Fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(1)} Mo). Maximum 8 Mo.`);
            return;
        }
        setIsUploading(true);
        setUploadError(null);
        try {
            const safeName = file.name.replace(/[^\w.\-]/g, '_');
            const path = `recruitment/cv/${Date.now()}_${safeName}`;
            const url = await StorageManager.provider.upload(path, file, { contentType: file.type });
            setFormData(prev => ({ ...prev, cvUrl: url }));
            setCvName(file.name);
        } catch (err) {
            logger.warn('[AddCandidateModal] Dépôt du CV impossible', { error: toError(err).message });
            setUploadError("Le dépôt du CV a échoué. Vous pouvez enregistrer le candidat sans CV et l'ajouter plus tard.");
        } finally {
            setIsUploading(false);
            if (pdfInputRef.current) pdfInputRef.current.value = '';
            if (scanInputRef.current) scanInputRef.current.value = '';
        }
    };

    const clearCv = () => {
        setFormData(prev => ({ ...prev, cvUrl: undefined }));
        setCvName(null);
        setUploadError(null);
    };

    const handleSubmit = async () => {
        if (!formData.gdpr.consented) {
            alert("Le consentement RGPD est obligatoire pour enregistrer un candidat.");
            return;
        }
        await onAdd({ ...formData, status: 'new' });
        onClose();
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[200] flex items-center justify-center p-6"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <motion.div 
                role="dialog"
                aria-modal="true"
                aria-label="Saisie du dossier candidat"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="bg-bg-primary border border-border w-full max-w-2xl rounded-[3rem] shadow-premium overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Modal Header */}
                <div className="p-10 border-b border-border bg-bg-secondary/30 flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <UserPlus className="w-5 h-5 text-accent-gold" />
                            <span className="text-nano font-black uppercase tracking-[0.3em] text-accent-gold">Nouveau Candidat</span>
                        </div>
                        <h2 className="text-3xl font-serif font-black italic text-text-primary tracking-tight">Saisie du Dossier</h2>
                    </div>
                    <button aria-label="Supprimer" onClick={onClose} className="w-12 h-12 rounded-2xl bg-bg-secondary border border-border flex items-center justify-center">
                        <Trash2 className="w-5 h-5 text-text-muted" />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="p-10 overflow-y-auto space-y-8 flex-1 elegant-scrollbar">
                    {step === 1 ? (
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-chip-label text-text-muted ml-2">Prénom</label>
                                <input 
                                    className="w-full h-14 bg-bg-secondary border border-border rounded-xl px-5 text-sm font-medium outline-none focus:border-accent-gold"
                                    value={formData.firstName}
                                    onChange={e => setFormData({...formData, firstName: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-chip-label text-text-muted ml-2">Nom</label>
                                <input 
                                    className="w-full h-14 bg-bg-secondary border border-border rounded-xl px-5 text-sm font-medium outline-none focus:border-accent-gold"
                                    value={formData.lastName}
                                    onChange={e => setFormData({...formData, lastName: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-chip-label text-text-muted ml-2">Email</label>
                                <input 
                                    type="email"
                                    className="w-full h-14 bg-bg-secondary border border-border rounded-xl px-5 text-sm font-medium outline-none focus:border-accent-gold"
                                    value={formData.email}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-chip-label text-text-muted ml-2">Téléphone</label>
                                <input 
                                    className="w-full h-14 bg-bg-secondary border border-border rounded-xl px-5 text-sm font-medium outline-none focus:border-accent-gold"
                                    value={formData.phone}
                                    onChange={e => setFormData({...formData, phone: e.target.value})}
                                />
                            </div>
                            <div className="col-span-2 space-y-2">
                                <label className="text-chip-label text-text-muted ml-2">Poste Visé</label>
                                <PremiumSelect 
                                    value={formData.appliedRole}
                                    onChange={e => setFormData({...formData, appliedRole: e})}
                                    options={[
                                        { value: 'server', label: 'Serveur' },
                                        { value: 'kitchen', label: 'Cuisine' },
                                        { value: 'management', label: 'Management' },
                                        { value: 'bar', label: 'Bar' },
                                    ]}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* CV Upload / Photo */}
                            {/* capture="environment" ouvre directement l'appareil photo
                                sur mobile — c'est le geste attendu pour un CV papier
                                remis en main propre pendant le service. */}
                            <input
                                ref={scanInputRef}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="sr-only"
                                onChange={e => { const f = e.target.files?.[0]; if (f) void handleCvFile(f); }}
                            />
                            <input
                                ref={pdfInputRef}
                                type="file"
                                accept="application/pdf,.pdf"
                                className="sr-only"
                                onChange={e => { const f = e.target.files?.[0]; if (f) void handleCvFile(f); }}
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <button
                                    type="button"
                                    onClick={() => scanInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="flex flex-col items-center justify-center gap-4 p-8 bg-bg-secondary border border-dashed border-border rounded-[2rem] hover:bg-bg-tertiary transition-all group disabled:opacity-50"
                                >
                                    <div className={`w-16 h-16 rounded-2xl bg-bg-primary flex items-center justify-center text-text-muted group-hover:text-accent-gold transition-colors shadow-soft ${isUploading ? "animate-pulse" : ""}`}>
                                        <Camera className="w-8 h-8" />
                                    </div>
                                    <span className="text-chip-label">Scanner CV Papier</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => pdfInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="flex flex-col items-center justify-center gap-4 p-8 bg-bg-secondary border border-dashed border-border rounded-[2rem] hover:bg-bg-tertiary transition-all group disabled:opacity-50"
                                >
                                    <div className={`w-16 h-16 rounded-2xl bg-bg-primary flex items-center justify-center text-text-muted group-hover:text-blue-500 transition-colors shadow-soft ${isUploading ? "animate-pulse" : ""}`}>
                                        <Download className="w-8 h-8 rotate-180" />
                                    </div>
                                    <span className="text-chip-label">Télécharger PDF</span>
                                </button>
                            </div>

                            {cvName && (
                                <div className="flex items-center justify-between gap-3 px-5 py-4 rounded-2xl bg-status-success/10 border border-status-success/20">
                                    <span className="flex items-center gap-2 text-xs font-bold text-status-success min-w-0">
                                        <FileCheck2 className="w-4 h-4 shrink-0" />
                                        <span className="truncate">{cvName}</span>
                                    </span>
                                    <button
                                        type="button"
                                        onClick={clearCv}
                                        aria-label="Retirer le CV joint"
                                        className="w-11 h-11 rounded-xl flex items-center justify-center text-text-muted hover:text-text-primary shrink-0"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            {uploadError && (
                                <p role="alert" className="text-xs text-status-danger px-2">{uploadError}</p>
                            )}

                            {/* GDPR Consent */}
                            <div className="p-8 bg-accent-gold/5 border border-accent-gold/20 rounded-[2rem] space-y-4">
                                <div className="flex items-start gap-4">
                                    <input 
                                        type="checkbox" 
                                        id="gdpr"
                                        className="mt-1 w-5 h-5 rounded border-accent-gold text-accent-gold focus:ring-accent-gold"
                                        checked={formData.gdpr.consented}
                                        onChange={e => setFormData({...formData, gdpr: {...formData.gdpr, consented: e.target.checked}})}
                                    />
                                    <label htmlFor="gdpr" className="text-xs text-text-muted leading-relaxed italic font-serif">
                                        Action RGPD : Je confirme avoir reçu le consentement du candidat pour le stockage et le traitement de ses données personnelles dans Restaurant OS. Les données seront automatiquement purgées après 6 mois sans interaction conformément à la politique de l'établissement.
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="p-10 border-t border-border bg-bg-secondary/30 flex justify-between items-center">
                    <button 
                        className="text-chip-label text-text-muted hover:text-text-primary"
                        onClick={() => step === 1 ? onClose() : setStep(1)}
                    >
                        {step === 1 ? 'Annuler' : 'Précédent'}
                    </button>
                    <button aria-label="Suivant" 
                        className="h-16 px-12 bg-text-primary text-text-primary rounded-2xl font-black text-micro uppercase tracking-[0.3em] hover:bg-black transition-all shadow-2xl flex items-center gap-3"
                        onClick={() => step === 1 ? setStep(2) : handleSubmit()}
                    >
                        {step === 1 ? 'Suivant' : 'Finaliser le Dossier'}
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
