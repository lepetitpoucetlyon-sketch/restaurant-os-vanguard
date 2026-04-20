// @ts-nocheck
"use client";

import { useMemo, useState } from "react";
import { Modal, PremiumSelect } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/Toast";
import { useRecruitment } from "@/hooks/useRecruitment";
import { Candidate, CandidateStatus, GDPRConsent } from "@/types/recruitment";
import { 
    User, 
    Mail, 
    Phone, 
    Briefcase, 
    ShieldCheck, 
    Upload, 
    Camera, 
    X, 
    FileText,
    CheckCircle2,
    Calendar,
    AlertCircle
} from "lucide-react";
import { cn } from "@/lib/ui.foundations";;
import { CameraCapture } from "@/components/ui/CameraCapture";

interface CandidateModalProps {
    isOpen: boolean;
    onClose: () => void;
    candidate?: Candidate | null;
}

const ROLES = [
    { value: 'server', label: 'Serveur(se)' },
    { value: 'bartender', label: 'Barman/Barmaid' },
    { value: 'kitchen_chef', label: 'Chef de cuisine' },
    { value: 'kitchen_line', label: 'Commis de cuisine' },
    { value: 'manager', label: 'Directeur/Manager' },
    { value: 'host', label: 'Hôte(sse) d\'accueil' },
];

const STATUS_OPTIONS = [
    { value: 'new', label: 'Nouveau' },
    { value: 'interview', label: 'Entretien' },
    { value: 'trial', label: 'Essai' },
    { value: 'hired', label: 'Embauché' },
    { value: 'refused', label: 'Refusé' },
];

const DEFAULT_GDPR_CONSENT: GDPRConsent = {
    consented: false,
    date: new Date().toISOString(),
    method: 'digital'
};

function getInitialCandidateForm(candidate?: Candidate | null): Partial<Candidate> {
    if (!candidate) {
        return {
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            appliedRole: "server",
            status: "new",
            notes: "",
            gdpr: DEFAULT_GDPR_CONSENT
        };
    }

    return candidate;
}

export const CandidateModal = ({ isOpen, onClose, candidate }: CandidateModalProps) => {
    const initialFormData = useMemo(() => getInitialCandidateForm(candidate), [candidate]);
    const [formDraft, setFormDraft] = useState<Partial<Candidate> | null>(null);
    const formData = formDraft ?? initialFormData;
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [cvFileDraft, setCvFileDraft] = useState<string | null | undefined>(undefined);
    const cvFile = cvFileDraft === undefined ? (candidate?.cvUrl || null) : cvFileDraft;
    const { addCandidate, updateCandidateStatus } = useRecruitment();
    const { showToast } = useToast();

    const handleClose = () => {
        setFormDraft(null);
        setCvFileDraft(undefined);
        setIsCameraOpen(false);
        onClose();
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setCvFileDraft(reader.result as string);
            showToast("CV téléchargé avec succès", "success");
        };
        reader.readAsDataURL(file);
    };

    const handleCapture = (imageData: string) => {
        setCvFileDraft(imageData);
        setIsCameraOpen(false);
        showToast("Photo du CV capturée", "success");
    };

    const handleSave = async () => {
        if (!formData.firstName || !formData.lastName || !formData.email) {
            showToast("Veuillez remplir les informations obligatoires", "error");
            return;
        }

        if (!formData.gdpr?.consented) {
            showToast("Le consentement RGPD est obligatoire pour sauvegarder ces données", "error");
            return;
        }

        const candidateData: Candidate = {
            id: candidate?.id || crypto.randomUUID(),
            firstName: formData.firstName!,
            lastName: formData.lastName!,
            email: formData.email!,
            phone: formData.phone || "",
            appliedRole: formData.appliedRole || "server",
            status: formData.status as CandidateStatus || "new",
            notes: formData.notes || "",
            cvUrl: cvFile || undefined,
            gdpr: formData.gdpr!,
            createdAt: candidate?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        try {
            if (candidate) {
                await updateCandidateStatus(candidate.id, candidateData.status);
                // Note: If other fields changed, we might need a more generic updateCandidate in the hook
                // For now, focusing on status as per the current hook implementation
                showToast("Candidature mise à jour (Statut)", "success");
            } else {
                await addCandidate(candidateData);
                showToast("Nouvelle candidature enregistrée", "success");
            }
            handleClose();
        } catch (error) {
            showToast("Erreur lors de la sauvegarde", "error");
        }
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={handleClose} 
            title={candidate ? "Détails de la Candidature" : "Nouveau Candidat"}
        >
            <div className="space-y-8 elegant-scrollbar max-h-[75vh] overflow-y-auto px-1">
                {/* Personal Info */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                            <User className="w-3 h-3 text-accent" /> Prénom
                        </label>
                        <input
                            className="w-full h-12 px-5 bg-bg-tertiary rounded-xl border border-border focus:border-accent outline-none font-bold text-[14px]"
                            value={formData.firstName}
                            onChange={(e) => setFormDraft(p => ({ ...(p ?? initialFormData), firstName: e.target.value }))}
                            placeholder="Jean"
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                            <User className="w-3 h-3 text-accent" /> Nom
                        </label>
                        <input
                            className="w-full h-12 px-5 bg-bg-tertiary rounded-xl border border-border focus:border-accent outline-none font-bold text-[14px]"
                            value={formData.lastName}
                            onChange={(e) => setFormDraft(p => ({ ...(p ?? initialFormData), lastName: e.target.value }))}
                            placeholder="Dupont"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                            <Mail className="w-3 h-3 text-accent" /> Email
                        </label>
                        <input
                            className="w-full h-12 px-5 bg-bg-tertiary rounded-xl border border-border focus:border-accent outline-none font-bold text-[14px]"
                            value={formData.email}
                            onChange={(e) => setFormDraft(p => ({ ...(p ?? initialFormData), email: e.target.value }))}
                            placeholder="jean.dupont@email.com"
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                            <Phone className="w-3 h-3 text-accent" /> Téléphone
                        </label>
                        <input
                            className="w-full h-12 px-5 bg-bg-tertiary rounded-xl border border-border focus:border-accent outline-none font-bold text-[14px]"
                            value={formData.phone}
                            onChange={(e) => setFormDraft(p => ({ ...(p ?? initialFormData), phone: e.target.value }))}
                            placeholder="06 12 34 56 78"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <PremiumSelect
                            label="Poste"
                            value={formData.appliedRole || 'server'}
                            onChange={(val) => setFormDraft(p => ({ ...(p ?? initialFormData), appliedRole: val }))}
                            options={ROLES}
                        />
                    </div>
                    <div className="space-y-3">
                        <PremiumSelect
                            label="Statut"
                            value={formData.status || 'new'}
                            onChange={(val) => setFormDraft(p => ({ ...(p ?? initialFormData), status: val as CandidateStatus }))}
                            options={STATUS_OPTIONS}
                        />
                    </div>
                </div>

                {/* CV Section */}
                <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                        <FileText className="w-3 h-3 text-accent" /> Curriculum Vitae (CV)
                    </label>
                    
                    {cvFile ? (
                        <div className="relative group rounded-2xl overflow-hidden border border-border bg-bg-tertiary aspect-[4/3] flex items-center justify-center">
                            {cvFile.startsWith('data:image') || cvFile.startsWith('data:application/pdf') === false ? (
                                <img src={cvFile} alt="CV Preview" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                            ) : (
                                <div className="text-center p-10">
                                    <FileText className="w-16 h-16 text-accent mx-auto mb-4" strokeWidth={1} />
                                    <p className="text-[12px] font-bold text-text-primary uppercase tracking-widest">Document PDF</p>
                                    <p className="text-[10px] text-text-muted mt-2">Le document a été chargé avec succès</p>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-4 transition-all scale-110 group-hover:scale-100">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                                    onClick={() => setCvFileDraft(null)}
                                >
                                    Remplacer
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-2xl hover:border-accent hover:bg-bg-tertiary/20 cursor-pointer transition-all group">
                                <Upload className="w-8 h-8 text-text-muted mb-3 group-hover:text-accent group-hover:scale-110 transition-all" />
                                <span className="text-[11px] font-black uppercase tracking-widest text-text-muted group-hover:text-accent">Charger PDF</span>
                                <input type="file" className="hidden" accept=".pdf,image/*" onChange={handleFileUpload} />
                            </label>
                            <button 
                                onClick={() => setIsCameraOpen(true)}
                                className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-2xl hover:border-accent hover:bg-bg-tertiary/20 transition-all group"
                            >
                                <Camera className="w-8 h-8 text-text-muted mb-3 group-hover:text-accent group-hover:scale-110 transition-all" />
                                <span className="text-[11px] font-black uppercase tracking-widest text-text-muted group-hover:text-accent">Prendre Photo</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* GDPR Section */}
                <div className={cn(
                    "p-6 rounded-2xl border transition-all duration-500",
                    formData.gdpr?.consented ? "bg-success/5 border-success/20" : "bg-error/5 border-error/20"
                )}>
                    <div className="flex items-start gap-4">
                        <div className={cn(
                            "p-2.5 rounded-xl",
                            formData.gdpr?.consented ? "bg-success/10 text-success" : "bg-error/10 text-error"
                        )}>
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-[13px] font-bold text-text-primary uppercase tracking-widest">Conformité RGPD</h4>
                            <p className="text-[11px] text-text-muted mt-2 leading-relaxed">
                                Le candidat a été informé de la conservation de ses données par l'entreprise pour une durée maximale de 24 mois.
                                L'entreprise s'engage à ne pas céder ces données et à respecter le droit à l'effacement.
                            </p>
                            <div className="flex items-center gap-4 mt-6">
                                <button
                                    onClick={() => setFormDraft(p => {
                                        const next = p ?? initialFormData;
                                        return {
                                            ...next,
                                        gdpr: {
                                                ...next.gdpr!,
                                            consented: !next.gdpr?.consented,
                                            date: new Date().toISOString()
                                            }
                                        };
                                    })}
                                    className={cn(
                                        "h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2",
                                        formData.gdpr?.consented 
                                            ? "bg-success text-white shadow-lg shadow-success/20" 
                                            : "bg-bg-tertiary text-text-muted border border-border hover:border-error"
                                    )}
                                >
                                    {formData.gdpr?.consented ? <CheckCircle2 className="w-4 h-4" /> : null}
                                    {formData.gdpr?.consented ? "Consentement Donné" : "Donner mon consentement"}
                                </button>
                                {formData.gdpr?.consented && (
                                    <span className="text-[10px] font-bold text-success flex items-center gap-2 italic">
                                        <Calendar className="w-3.5 h-3.5" /> Loggé le {new Date().toLocaleDateString('fr-FR')}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Notes internes & Observations</label>
                    <textarea
                        className="w-full min-h-[120px] p-5 bg-bg-tertiary rounded-2xl border border-border focus:border-accent outline-none font-medium text-[14px] leading-relaxed resize-none"
                        value={formData.notes}
                        onChange={(e) => setFormDraft(p => ({ ...(p ?? initialFormData), notes: e.target.value }))}
                        placeholder="Points forts, impression générale lors de l'appel..."
                    />
                </div>

                <div className="pt-4">
                    <Button 
                        className={cn(
                            "w-full h-14 rounded-2xl font-black uppercase text-[11px] tracking-[0.25em] transition-all",
                            formData.gdpr?.consented 
                                ? "bg-accent hover:bg-black text-white shadow-xl shadow-accent/10" 
                                : "bg-bg-tertiary text-text-muted cursor-not-allowed border border-border"
                        )}
                        onClick={handleSave}
                        disabled={!formData.gdpr?.consented}
                    >
                        {!formData.gdpr?.consented && <AlertCircle className="w-4 h-4 mr-2" />}
                        {candidate ? "Mettre à jour le dossier" : "Enregistrer la candidature"}
                    </Button>
                </div>
            </div>

            {isCameraOpen && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4">
                    <div className="w-full max-w-2xl bg-bg-secondary rounded-[2.5rem] overflow-hidden border border-white/5 relative shadow-2xl">
                        <CameraCapture onCapture={handleCapture} />
                        <button 
                            onClick={() => setIsCameraOpen(false)}
                            className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all backdrop-blur-md z-10"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
};
