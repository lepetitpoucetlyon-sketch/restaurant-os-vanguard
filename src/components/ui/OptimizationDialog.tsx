"use client";

import { Sparkles, Settings2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";

interface OptimizationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description: string;
    type?: "ai" | "system" | "security";
}

export function OptimizationDialog({ isOpen, onClose, title, description, type = "system" }: OptimizationDialogProps) {
    const icons = {
        ai: <Sparkles className="w-12 h-12 text-accent" />,
        system: <Settings2 className="w-12 h-12 text-accent" />,
        security: <ShieldCheck className="w-12 h-12 text-accent" />,
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="md"
            className="p-0 border-none bg-transparent"
            showClose={false}
            noPadding
        >
            <div className="relative bg-bg-primary rounded-[3rem] shadow-[0_32px_128px_rgba(0,0,0,0.4)] border border-white/10 overflow-hidden group/modal">
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/carbon-fibre.png")` }} />
                <div className="p-10 text-center">
                    <div className="w-24 h-24 rounded-[2rem] bg-accent/5 flex items-center justify-center mx-auto mb-8 border border-accent/10">
                        {icons[type]}
                    </div>

                    <h2 className="text-2xl font-serif font-black text-text-primary tracking-tight mb-4 italic">
                        {title}
                    </h2>

                    <p className="text-[13px] text-text-muted leading-relaxed mb-10 px-4">
                        {description}
                    </p>

                    <div className="space-y-3">
                        <Button
                            onClick={onClose}
                            className="w-full h-12 bg-accent text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-accent/20 hover:opacity-90 transition-all"
                        >
                            Optimisation en cours
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="w-full h-10 text-[10px] font-black text-text-muted uppercase tracking-widest hover:text-text-primary"
                        >
                            Fermer
                        </Button>
                    </div>
                </div>

                <div className="px-10 py-4 bg-bg-tertiary/50 border-t border-border flex items-center justify-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">
                        Moteur d'Intelligence Active
                    </span>
                </div>
            </div>
        </Modal>
    );
}
