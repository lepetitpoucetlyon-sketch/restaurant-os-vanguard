"use client";

import { useMemo, useState } from "react";
import { Modal } from "@ui/Modal";
import { Button } from "@ui/Button";
import { useToast } from "@ui/Toast";
import { useRecruitment } from "../../hooks/useRecruitment";
import type { Candidate, CandidateStatus, GDPRConsent } from "@nexus/contracts";
import { X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { CameraCapture } from "@ui/CameraCapture";

import { CandidateFormFields } from "./candidate-modal/CandidateFormFields";
import { CandidateCvSection } from "./candidate-modal/CandidateCvSection";
import { CandidateGdprSection } from "./candidate-modal/CandidateGdprSection";

interface CandidateModalProps {
    isOpen: boolean;
    onClose: () => void;
    candidate?: Candidate | null;
}

const DEFAULT_GDPR_CONSENT: GDPRConsent = {
    consented: false,
    date: new Date().toISOString(),
    method: 'digital'
};

function buildCandidateData(
    formData: Partial<Candidate>,
    cvFile: string | null,
    existing?: Candidate | null,
): Candidate {
    return {
        id: existing?.id || crypto.randomUUID(),
        firstName: formData.firstName!,
        lastName: formData.lastName!,
        email: formData.email!,
        phone: formData.phone || "",
        appliedRole: formData.appliedRole || "server",
        status: formData.status as CandidateStatus || "new",
        notes: formData.notes || "",
        cvUrl: cvFile || undefined,
        gdpr: formData.gdpr!,
        createdAt: existing?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}

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
        const candidateData = buildCandidateData(formData, cvFile, candidate);
        try {
            if (candidate) {
                await updateCandidateStatus(candidate.id, candidateData.status);
                showToast("Candidature mise à jour (Statut)", "success");
            } else {
                await addCandidate(candidateData);
                showToast("Nouvelle candidature enregistrée", "success");
            }
            handleClose();
        } catch {
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
                <CandidateFormFields
                    formData={formData}
                    setFormDraft={setFormDraft}
                    initialFormData={initialFormData}
                />

                <CandidateCvSection
                    cvFile={cvFile}
                    setCvFileDraft={setCvFileDraft}
                    handleFileUpload={handleFileUpload}
                    setIsCameraOpen={setIsCameraOpen}
                />

                <CandidateGdprSection
                    formData={formData}
                    setFormDraft={setFormDraft}
                    initialFormData={initialFormData}
                />

                {/* Notes */}
                <div className="space-y-3">
                    <label className="text-chip-label text-text-muted">Notes internes & Observations</label>
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
                            "w-full h-14 rounded-2xl font-black uppercase text-micro tracking-[0.25em] transition-all",
                            formData.gdpr?.consented 
                                ? "bg-action-primary hover:bg-action-primary-hover text-text-on-primary shadow-xl shadow-action-primary/10" 
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
                <div role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); (e.currentTarget as HTMLElement).click(); } }} 
                    className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
                    onClick={(e) => { if (e.target === e.currentTarget) setIsCameraOpen(false); }}
                >
                    <div 
                        role="dialog"
                        aria-modal="true"
                        aria-label="Prise de vue du CV"
                        className="w-full max-w-2xl bg-surface-card rounded-[2.5rem] overflow-hidden border border-border relative shadow-2xl"
                    >
                        <CameraCapture onCapture={handleCapture} />
                        <button 
                            onClick={() => setIsCameraOpen(false)}
                            aria-label="Fermer la caméra"
                            className="absolute top-8 right-8 w-12 h-12 rounded-full bg-surface-glass hover:bg-surface-card text-text-primary flex items-center justify-center transition-all backdrop-blur-md z-10 cursor-pointer"
                        >
                            <X className="w-6 h-6" aria-hidden="true" />
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
};
