'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Trash2, Camera, Download, ChevronRight } from 'lucide-react';
import type { Candidate } from '@nexus/contracts';
import { PremiumSelect } from '@components/ui/PremiumSelect';

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

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!formData.gdpr.consented) {
            alert("Le consentement RGPD est obligatoire pour enregistrer un candidat.");
            return;
        }
        await onAdd({ ...formData, status: 'new' });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[200] flex items-center justify-center p-6">
            <motion.div 
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
                    <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-bg-secondary border border-border flex items-center justify-center">
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
                            <div className="grid grid-cols-2 gap-6">
                                <button className="flex flex-col items-center justify-center gap-4 p-8 bg-bg-secondary border border-dashed border-border rounded-[2rem] hover:bg-bg-tertiary transition-all group">
                                    <div className="w-16 h-16 rounded-2xl bg-bg-primary flex items-center justify-center text-text-muted group-hover:text-accent-gold transition-colors shadow-soft">
                                        <Camera className="w-8 h-8" />
                                    </div>
                                    <span className="text-chip-label">Scanner CV Papier</span>
                                </button>
                                <button className="flex flex-col items-center justify-center gap-4 p-8 bg-bg-secondary border border-dashed border-border rounded-[2rem] hover:bg-bg-tertiary transition-all group">
                                    <div className="w-16 h-16 rounded-2xl bg-bg-primary flex items-center justify-center text-text-muted group-hover:text-blue-500 transition-colors shadow-soft">
                                        <Download className="w-8 h-8 rotate-180" />
                                    </div>
                                    <span className="text-chip-label">Télécharger PDF</span>
                                </button>
                            </div>

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
                    <button 
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
