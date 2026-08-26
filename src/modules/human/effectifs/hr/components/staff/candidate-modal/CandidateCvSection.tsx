"use client";

import { Upload, Camera, FileText } from "lucide-react";
import { Button } from "@ui/Button";

interface CandidateCvSectionProps {
    cvFile: string | null;
    setCvFileDraft: (v: string | null) => void;
    handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    setIsCameraOpen: (v: boolean) => void;
}

export function CandidateCvSection({
    cvFile,
    setCvFileDraft,
    handleFileUpload,
    setIsCameraOpen,
}: CandidateCvSectionProps) {
    return (
        <div className="space-y-4">
            <label className="text-chip-label text-text-muted flex items-center gap-2">
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
                            <p className="text-nano text-text-muted mt-2">Le document a été chargé avec succès</p>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-4 transition-all scale-110 group-hover:scale-100">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-surface-card text-text-primary border-border hover:bg-surface-glass"
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
                        <span className="text-micro font-black uppercase tracking-widest text-text-muted group-hover:text-accent">Charger PDF</span>
                        <input type="file" className="hidden" accept=".pdf,image/*" onChange={handleFileUpload} />
                    </label>
                    <button 
                        onClick={() => setIsCameraOpen(true)}
                        className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-2xl hover:border-accent hover:bg-bg-tertiary/20 transition-all group"
                    >
                        <Camera className="w-8 h-8 text-text-muted mb-3 group-hover:text-accent group-hover:scale-110 transition-all" />
                        <span className="text-micro font-black uppercase tracking-widest text-text-muted group-hover:text-accent">Prendre Photo</span>
                    </button>
                </div>
            )}
        </div>
    );
}
