"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Sparkles, CheckCircle, AlertCircle, X, Loader2, Zap } from 'lucide-react';
import { Button } from '@ui/button';
export interface PlateAuditResult {
    score: number;
    feedback: string[];
    isCompliant: boolean;
    detectedIssues: string[];
}
import { cn } from '@/lib/ui.foundations';

interface PlateAuditWizardProps {
    recipeName: string;
    standardImage?: string;
    onComplete: (success: boolean) => void;
    onClose: () => void;
}

export function PlateAuditWizard({ recipeName, standardImage, onComplete, onClose }: PlateAuditWizardProps) {
    const [isScanning, setIsScanning] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [auditResult, setAuditResult] = useState<PlateAuditResult | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const { VisionService } = await import('@/modules/intelligence');
        const base64 = await VisionService.fileToBase64(file);
        setCapturedImage(base64);
        setIsScanning(true);

        try {
            // IA Comparison Logic
            const result = await VisionService.comparePlateToStandard(
                base64, 
                standardImage || '', 
                recipeName
            );
            setAuditResult(result);
        } catch (error) {
            console.error("Audit failed", error);
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-surface-sidebar/98 backdrop-blur-3xl flex items-center justify-center p-4 md:p-12 overflow-hidden">
            {/* Animated Laser Grid Background */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="w-full max-w-6xl bg-surface-sidebar/80 border border-subtle rounded-[4rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col md:flex-row h-full max-h-[85vh] relative"
            >
                {/* Header Section (Mobile/Top) */}
                <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50 text-center">
                    <h2 className="text-3xl font-serif italic text-text-primary tracking-tighter mb-1 uppercase">Audit de Dressage</h2>
                    <p className="text-[10px] font-black text-status-warning uppercase tracking-[0.5em]">{recipeName}</p>
                </div>

                <button onClick={onClose} className="absolute top-8 right-8 z-50 p-3 rounded-full bg-surface-card/5 text-muted hover:text-text-primary transition-all">
                    <X size={20} />
                </button>

                {/* Left: Comparison View */}
                <div className="flex-1 p-12 flex flex-col items-center justify-center space-y-8 border-r border-white/5 relative bg-surface-card/[0.02]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
                        {/* Standard Image */}
                        <div className="space-y-4">
                            <p className="text-[9px] font-black text-secondary uppercase tracking-[0.3em] text-center">STANDARD D'OR</p>
                            <div className="aspect-square rounded-[2rem] bg-surface-card/5 border border-subtle overflow-hidden relative group">
                                {standardImage ? (
                                    <img src={standardImage} className="w-full h-full object-cover opacity-60" alt="Standard" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-secondary">
                                        <Sparkles size={40} className="mb-4 opacity-20" />
                                        <p className="text-[8px] font-bold uppercase tracking-widest text-center px-6">Aucun standard enregistré</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Captured Image */}
                        <div className="space-y-4 relative">
                            <p className="text-[9px] font-black text-status-warning uppercase tracking-[0.3em] text-center font-bold">CAPTURE RÉELLE</p>
                            <div className="aspect-square rounded-[2rem] bg-surface-sidebar border-2 border-dashed border-action-primary/30 overflow-hidden relative">
                                {capturedImage ? (
                                    <img src={capturedImage} className="w-full h-full object-cover" alt="Capture" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center">
                                        {!isScanning && (
                                            <button 
                                                onClick={() => fileInputRef.current?.click()}
                                                className="group flex flex-col items-center"
                                            >
                                                <div className="w-16 h-16 rounded-full bg-status-warning/10 text-status-warning flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                    <Camera size={28} />
                                                </div>
                                                <p className="text-chip-label-sm text-status-warning">Scanner l'assiette</p>
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Laser Scan Animation */}
                                <AnimatePresence>
                                    {isScanning && (
                                        <motion.div 
                                            initial={{ top: "0%" }}
                                            animate={{ top: "100%" }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                            className="absolute left-0 right-0 h-1 bg-status-warning shadow-[0_0_15px_rgba(245,158,11,1)] z-10"
                                        />
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleCapture} />
                </div>

                {/* Right: AI Intelligence Panel */}
                <div className="w-full md:w-[450px] p-12 bg-surface-sidebar flex flex-col justify-center">
                    {!auditResult && !isScanning && (
                        <div className="text-center space-y-6">
                            <div className="w-20 h-20 bg-surface-card/5 rounded-3xl flex items-center justify-center mx-auto">
                                <Zap className="text-primary" size={32} />
                            </div>
                            <h4 className="text-xl font-serif italic text-text-primary">Contrôle de Conformité IA</h4>
                            <p className="text-[11px] font-bold text-secondary leading-relaxed uppercase tracking-widest">
                                Prenez une photo pour comparer <br />l'assiette avec le standard technique.
                            </p>
                        </div>
                    )}

                    {isScanning && (
                        <div className="text-center space-y-6">
                            <Loader2 className="animate-spin text-status-warning mx-auto" size={48} />
                            <h4 className="text-xl font-serif italic text-text-primary animate-pulse">Analyse Vision en cours...</h4>
                            <p className="text-[10px] font-black text-secondary uppercase tracking-[0.4em]">Gemini 1.5 Pro Multimodal</p>
                        </div>
                    )}

                    {auditResult && (
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-10"
                        >
                            {/* Score Gauge */}
                            <div className="relative flex flex-col items-center">
                                <div className="text-[100px] font-serif font-black italic text-text-primary leading-none tracking-tighter">
                                    {auditResult.score}<span className="text-3xl text-secondary">/10</span>
                                </div>
                                <div className={cn(
                                    "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.3em] mt-4 shadow-lg",
                                    auditResult.isCompliant ? "bg-status-success text-text-primary" : "bg-status-danger text-text-primary"
                                )}>
                                    {auditResult.isCompliant ? "Dressage Validé" : "Réajustement Requis"}
                                </div>
                            </div>

                            {/* Bullet Points */}
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <p className="text-[9px] font-black text-secondary uppercase tracking-widest">Feedback IA</p>
                                    {auditResult.feedback.map((f, i) => (
                                        <div key={i} className="flex gap-3 text-[11px] font-bold text-muted">
                                            <CheckCircle size={14} className="text-status-success shrink-0" />
                                            <span>{f}</span>
                                        </div>
                                    ))}
                                </div>

                                {auditResult.detectedIssues.length > 0 && (
                                    <div className="space-y-3">
                                        <p className="text-[9px] font-black text-status-danger/50 uppercase tracking-widest">Points d'Alerte</p>
                                        {auditResult.detectedIssues.map((issue, i) => (
                                            <div key={i} className="flex gap-3 text-[11px] font-bold text-status-danger">
                                                <AlertCircle size={14} className="shrink-0" />
                                                <span>{issue}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-8">
                                <Button 
                                    onClick={() => setAuditResult(null)}
                                    className="h-14 bg-surface-card/5 text-muted hover:text-text-primary text-chip-label rounded-2xl border border-subtle"
                                >
                                    Refaire
                                </Button>
                                <Button 
                                    onClick={() => onComplete(true)}
                                    className="h-14 bg-status-success text-text-primary hover:bg-status-success text-chip-label rounded-2xl shadow-xl shadow-emerald-500/20"
                                >
                                    Valider l'Envoi
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
