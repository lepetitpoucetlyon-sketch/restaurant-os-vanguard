"use client";

import { useState } from "react";
import { User } from "@nexus/contracts";
import { Modal } from "@ui/Modal";
import { Button } from "@ui/Button";
import { HcrLegalContractService, type GeneratedLegalDocument } from "@/modules/human";
import { Download, FileText, CheckCircle2, Shield } from "lucide-react";
import { useToast } from "@ui/Toast";

interface ContractGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    collaborator: User | null;
}

export function ContractGeneratorModal({
    isOpen,
    onClose,
    collaborator
}: ContractGeneratorModalProps) {
    const { showToast } = useToast();
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState('');
    const [jobTitle, setJobTitle] = useState(collaborator?.role || 'Chef de Rang');
    const [classificationLevel, setClassificationLevel] = useState('Niveau I Échelon 1');
    const [generatedDoc, setGeneratedDoc] = useState<GeneratedLegalDocument | null>(null);

    if (!collaborator) return null;

    const isFreelance = collaborator.contractType === 'freelance' || collaborator.employmentStatus === 'contractor';

    const handleGenerate = () => {
        const hourlyRateEur = collaborator.hourlyRateInMicrounits
            ? collaborator.hourlyRateInMicrounits / 1_000_000
            : (collaborator.hourlyRate || (isFreelance ? 25 : 14));

        const doc = HcrLegalContractService.generateContract({
            collaborator,
            restaurant: {
                name: 'Restaurant OS Core',
                companyName: 'Restaurant OS SAS',
                siret: '89012345600012',
                address: '10 Place Bellecour',
                city: 'Lyon',
                postalCode: '69002',
                representativeName: 'Direction Générale',
                representativeRole: 'Président',
            },
            startDate,
            endDate: endDate || undefined,
            jobTitle: jobTitle || 'Collaborateur',
            classificationLevel,
            hourlyRateEur,
            weeklyHours: 39,
        });

        setGeneratedDoc(doc);
        showToast("Contrat généré avec succès", "success");
    };

    const handleDownload = () => {
        if (!generatedDoc) return;
        const blob = new Blob([generatedDoc.fullText], { type: 'text/markdown;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${generatedDoc.documentId}.md`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast("Document téléchargé", "success");
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => {
                setGeneratedDoc(null);
                onClose();
            }}
            title={isFreelance ? "Convention de Prestation & Mandat B2B" : "Générateur de Contrat HCR (IDCC 1979)"}
        >
            <div className="space-y-6">
                {!generatedDoc ? (
                    <div className="space-y-4">
                        <div className="p-3.5 rounded-xl bg-action-primary/5 border border-action-primary/20 flex items-center gap-3">
                            <Shield className="w-5 h-5 text-action-primary shrink-0" />
                            <div className="text-xs">
                                <p className="font-bold text-text-primary">
                                    {isFreelance ? "Convention B2B Anti-Requalification Juridique" : "Conformité Légale CCN HCR 1979"}
                                </p>
                                <p className="text-text-muted mt-0.5">
                                    {isFreelance 
                                        ? "Mandat d'auto-facturation Art. 242 nonies CGI + Absence de lien de subordination."
                                        : "Période d'essai, repos hebdomadaire, heures sup majorées 10% et repas MG."}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-nano font-black text-text-muted uppercase tracking-[0.2em]">{"Intitulé du Poste / Mission"}</label>
                                <input
                                    type="text"
                                    value={jobTitle}
                                    onChange={e => setJobTitle(e.target.value)}
                                    className="w-full h-12 px-4 bg-bg-tertiary rounded-xl border border-border focus:border-action-primary outline-none font-bold text-sm"
                                    placeholder="ex: Serveur de Soirée"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-nano font-black text-text-muted uppercase tracking-[0.2em]">Date de Prise d'Effet</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                    className="w-full h-12 px-4 bg-bg-tertiary rounded-xl border border-border focus:border-action-primary outline-none text-sm font-bold"
                                />
                            </div>
                        </div>

                        {!isFreelance && (
                            <div className="space-y-2">
                                <label className="text-nano font-black text-text-muted uppercase tracking-[0.2em]">Classification Conventionnelle HCR</label>
                                <input
                                    type="text"
                                    value={classificationLevel}
                                    onChange={e => setClassificationLevel(e.target.value)}
                                    className="w-full h-12 px-4 bg-bg-tertiary rounded-xl border border-border focus:border-action-primary outline-none text-sm font-bold"
                                    placeholder="Niveau I Échelon 1"
                                />
                            </div>
                        )}

                        <div className="pt-2">
                            <Button
                                variant="default"
                                className="w-full h-12 text-xs font-bold uppercase tracking-wider bg-action-primary text-text-on-primary"
                                onClick={handleGenerate}
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                Générer le Contrat Officiel
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-status-success font-bold text-xs uppercase tracking-wider">
                                <CheckCircle2 className="w-4 h-4" />
                                Document Prêt ({generatedDoc.documentId})
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setGeneratedDoc(null)}
                                className="text-xs"
                            >
                                Modifier
                            </Button>
                        </div>

                        {/* Document Articles Preview */}
                        <div className="max-h-72 overflow-y-auto p-4 rounded-xl bg-bg-tertiary border border-border space-y-3 text-xs">
                            <h4 className="font-bold text-sm text-text-primary border-b border-border/50 pb-2">
                                {generatedDoc.title}
                            </h4>
                            {generatedDoc.sections.map((sec, idx) => (
                                <div key={idx} className="space-y-1">
                                    <p className="font-bold text-action-primary uppercase text-nano tracking-wider">
                                        {sec.articleNumber} — {sec.title}
                                    </p>
                                    <p className="text-text-secondary leading-relaxed">{sec.content}</p>
                                </div>
                            ))}
                        </div>

                        <div className="pt-2 flex gap-3">
                            <Button
                                variant="default"
                                className="w-full h-12 text-xs font-bold uppercase tracking-wider bg-action-primary text-text-on-primary"
                                onClick={handleDownload}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Télécharger le Document Signable (.md / .pdf)
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}
