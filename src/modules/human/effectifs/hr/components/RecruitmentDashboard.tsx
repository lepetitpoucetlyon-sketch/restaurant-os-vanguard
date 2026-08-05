'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
    UserPlus, 
    Search, 
    MoreHorizontal, 
    Mail, 
    Phone, 
    ChevronRight,
    FileText,
    Camera,
    ShieldCheck,
    AlertCircle,
    Trash2,
    Download
} from 'lucide-react';
;
import { useRecruitment } from '..';
import { Candidate, CandidateStatus } from '@nexus/contracts';
import { PremiumSelect } from '@components/ui/PremiumSelect';

const COLUMNS: { id: CandidateStatus; label: string; color: string }[] = [
    { id: 'new', label: 'Nouveaux', color: '#10B981' },
    { id: 'interview', label: 'Entretien', color: '#3B82F6' },
    { id: 'trial', label: 'Essai', color: '#8B5CF6' },
    { id: 'refused', label: 'Refusés', color: '#EF4444' },
    { id: 'hired', label: 'Embauchés', color: '#F59E0B' },
];

export function RecruitmentDashboard() {
    const { candidates, updateCandidateStatus, addCandidate } = useRecruitment();
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const filteredCandidates = candidates.filter(c => 
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.appliedRole.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-serif font-black italic text-text-primary tracking-tighter mb-2">
                        Pipeline de <span className="text-accent-gold not-italic">Recrutement</span>
                    </h1>
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-status-success bg-status-success/10 px-3 py-1 rounded-full border border-emerald-500/20">
                            <ShieldCheck className="w-3 h-3" />
                            RGPD : Conforme
                        </span>
                        <span className="text-text-muted text-xs font-bold uppercase tracking-widest opacity-60">
                            {candidates.length} candidatures actives
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-72">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input
                            type="text"
                            placeholder="Rechercher un candidat..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 h-12 bg-bg-secondary border border-border rounded-xl text-sm font-medium focus:border-accent-gold outline-none transition-all"
                        />
                    </div>
                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="h-12 px-6 bg-text-primary text-text-primary rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 shadow-xl hover:-translate-y-0.5"
                    >
                        <UserPlus className="w-4 h-4" />
                        Nouveau Candidat
                    </button>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 h-[calc(100vh-280px)] min-h-[600px]">
                {COLUMNS.map(column => (
                    <div key={column.id} className="flex flex-col gap-4 bg-bg-secondary/30 rounded-[2rem] p-4 border border-border/50">
                        <div className="flex items-center justify-between px-4 py-2">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: column.color }} />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">
                                    {column.label}
                                </span>
                            </div>
                            <span className="text-[10px] font-bold text-text-muted bg-bg-tertiary px-2 py-0.5 rounded-md">
                                {filteredCandidates.filter(c => c.status === column.id).length}
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto elegant-scrollbar space-y-4 pr-2">
                            {filteredCandidates
                                .filter(c => c.status === column.id)
                                .map(candidate => (
                                    <CandidateCard 
                                        key={candidate.id} 
                                        candidate={candidate} 
                                        onStatusChange={updateCandidateStatus}
                                    />
                                ))
                            }
                        </div>
                    </div>
                ))}
            </div>
            
            <AddCandidateModal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)} 
                onAdd={addCandidate as React.ComponentProps<typeof AddCandidateModal>['onAdd']}
            />
        </div>
    );
}

function CandidateCard({ candidate, onStatusChange }: { 
    candidate: Candidate; 
    onStatusChange: (id: string, status: CandidateStatus) => void 
}) {
    return (
        <motion.div
            layoutId={candidate.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group bg-white dark:bg-bg-tertiary border border-border rounded-2xl p-4 hover:shadow-xl transition-all cursor-pointer relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-1.5 hover:bg-bg-secondary rounded-lg text-text-muted">
                    <MoreHorizontal className="w-4 h-4" />
                </button>
            </div>

            <h4 className="font-serif italic font-bold text-text-primary text-base mb-1 truncate">
                {candidate.firstName} {candidate.lastName}
            </h4>
            <p className="text-[10px] font-bold text-accent uppercase tracking-widest mb-4">
                {candidate.appliedRole}
            </p>

            <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-[11px] text-text-muted">
                    <Mail className="w-3 h-3" />
                    <span className="truncate">{candidate.email}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-text-muted">
                    <Phone className="w-3 h-3" />
                    <span>{candidate.phone}</span>
                </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border/50 mt-auto">
                <div className="flex -space-x-1.5">
                    {candidate.gdpr.consented ? (
                        <div className="w-6 h-6 rounded-full bg-status-success/10 flex items-center justify-center border border-emerald-500/20 text-emerald-600" title="Consentement RGPD validé">
                            <ShieldCheck className="w-3 h-3" />
                        </div>
                    ) : (
                        <div className="w-6 h-6 rounded-full bg-status-danger/10 flex items-center justify-center border border-rose-500/20 text-rose-600" title="Consentement RGPD manquant">
                            <AlertCircle className="w-3 h-3" />
                        </div>
                    )}
                    {candidate.cvUrl && (
                        <div className="w-6 h-6 rounded-full bg-status-info/10 flex items-center justify-center border border-blue-500/20 text-blue-600" title="CV disponible">
                            <FileText className="w-3 h-3" />
                        </div>
                    )}
                </div>
                
                <div className="flex gap-1">
                    {candidate.status !== 'new' && (
                        <button 
                            onClick={() => onStatusChange(candidate.id, 'new')}
                            className="p-1.5 hover:bg-bg-secondary rounded-lg text-text-muted transition-colors"
                        >
                            <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                        </button>
                    )}
                    <button 
                        onClick={() => {
                            const statuses: CandidateStatus[] = ['new', 'interview', 'trial', 'refused', 'hired'];
                            const currentIndex = statuses.indexOf(candidate.status);
                            if (currentIndex < statuses.length - 1) {
                                onStatusChange(candidate.id, statuses[currentIndex + 1]);
                            }
                        }}
                        className="p-1.5 hover:bg-bg-secondary rounded-lg text-accent-gold transition-colors"
                    >
                        <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

function AddCandidateModal({ isOpen, onClose, onAdd }: { 
    isOpen: boolean; 
    onClose: () => void;
    onAdd: (candidate: Partial<Candidate>) => Promise<void>;
}) {
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
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-gold">Nouveau Candidat</span>
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
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-2">Prénom</label>
                                <input 
                                    className="w-full h-14 bg-bg-secondary border border-border rounded-xl px-5 text-sm font-medium outline-none focus:border-accent-gold"
                                    value={formData.firstName}
                                    onChange={e => setFormData({...formData, firstName: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-2">Nom</label>
                                <input 
                                    className="w-full h-14 bg-bg-secondary border border-border rounded-xl px-5 text-sm font-medium outline-none focus:border-accent-gold"
                                    value={formData.lastName}
                                    onChange={e => setFormData({...formData, lastName: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-2">Email</label>
                                <input 
                                    type="email"
                                    className="w-full h-14 bg-bg-secondary border border-border rounded-xl px-5 text-sm font-medium outline-none focus:border-accent-gold"
                                    value={formData.email}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-2">Téléphone</label>
                                <input 
                                    className="w-full h-14 bg-bg-secondary border border-border rounded-xl px-5 text-sm font-medium outline-none focus:border-accent-gold"
                                    value={formData.phone}
                                    onChange={e => setFormData({...formData, phone: e.target.value})}
                                />
                            </div>
                            <div className="col-span-2 space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-2">Poste Visé</label>
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
                                    <span className="text-[10px] font-black uppercase tracking-widest">Scanner CV Papier</span>
                                </button>
                                <button className="flex flex-col items-center justify-center gap-4 p-8 bg-bg-secondary border border-dashed border-border rounded-[2rem] hover:bg-bg-tertiary transition-all group">
                                    <div className="w-16 h-16 rounded-2xl bg-bg-primary flex items-center justify-center text-text-muted group-hover:text-blue-500 transition-colors shadow-soft">
                                        <Download className="w-8 h-8 rotate-180" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest">Télécharger PDF</span>
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
                        className="text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-text-primary"
                        onClick={() => step === 1 ? onClose() : setStep(1)}
                    >
                        {step === 1 ? 'Annuler' : 'Précédent'}
                    </button>
                    <button 
                        className="h-16 px-12 bg-text-primary text-text-primary rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] hover:bg-black transition-all shadow-2xl flex items-center gap-3"
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
