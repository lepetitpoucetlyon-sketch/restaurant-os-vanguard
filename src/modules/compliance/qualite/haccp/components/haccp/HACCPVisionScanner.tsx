import { logger } from '@/lib/logger';
"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ShieldCheck, AlertTriangle, Loader2, X } from 'lucide-react';
import { Button } from '@ui/button';
import { useHACCP } from '@nexus/guards/NexusGuardProvider';
// eslint-disable-next-line vanguard/no-inter-module-imports
import { VisionService } from '@modules/intelligence/services/VisionService';
import { cn } from '@/lib/ui.foundations';

interface HACCPVisionScannerProps {
    taskId: string;
    taskName: string;
    onClose: () => void;
}

export function HACCPVisionScanner({ taskId, taskName, onClose }: HACCPVisionScannerProps) {
    const { validateTaskWithVision } = useHACCP();
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<{ isCompliant: boolean; observation: string } | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        try {
            const base64 = await VisionService.fileToBase64(file);
            const success = await validateTaskWithVision(taskId, base64);
            
            // Re-fetch or simulate the result for the UI
            setResult({
                isCompliant: success,
                observation: success ? "Conformité visuelle validée." : "Non-conformité détectée sur l'image."
            });
            
            if (success) {
                onClose();
            }
        } catch (error) {
            logger.error('Error', error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[150] bg-surface-sidebar/95 backdrop-blur-xl flex items-center justify-center p-6">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg bg-surface-sidebar border border-subtle rounded-[3rem] p-10 text-center relative overflow-hidden shadow-2xl"
            >
                {/* Close Button */}
                <button onClick={onClose} className="absolute top-6 right-6 p-2 text-secondary hover:text-text-primary transition-colors">
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center space-y-8">
                    <div className={cn(
                        "w-24 h-24 rounded-3xl flex items-center justify-center transition-all duration-700",
                        isProcessing ? "bg-status-warning text-primary animate-pulse" : 
                        result?.isCompliant ? "bg-status-success text-text-primary shadow-2xl shadow-emerald-500/20" :
                        result ? "bg-status-danger text-text-primary" : "bg-surface-card/5 text-muted"
                    )}>
                        {isProcessing ? <Loader2 size={40} className="animate-spin" /> : 
                         result?.isCompliant ? <ShieldCheck size={40} /> :
                         result ? <AlertTriangle size={40} /> : <Camera size={40} />}
                    </div>

                    <div>
                        <h3 className="text-2xl font-serif italic text-text-primary mb-2 uppercase tracking-tighter">Audit Sanitaire</h3>
                        <p className="text-[10px] font-black text-secondary uppercase tracking-[0.4em] mb-4">{taskName}</p>
                        
                        <AnimatePresence>
                            {result && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn(
                                        "p-4 rounded-2xl border text-[11px] font-bold",
                                        result.isCompliant ? "bg-status-success/5 border-emerald-500/20 text-status-success" : "bg-status-danger/5 border-red-500/20 text-status-danger"
                                    )}
                                >
                                    {result.observation}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {!result && (
                        <div className="w-full space-y-4">
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleCapture} 
                                className="hidden" 
                                accept="image/*"
                                capture="environment" 
                            />
                            <Button 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isProcessing}
                                className="w-full py-8 bg-surface-card text-primary text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl hover:scale-105 transition-all shadow-xl"
                            >
                                <Camera size={18} className="mr-2" />
                                Capturer la Preuve
                            </Button>
                            <p className="text-[9px] font-bold text-secondary uppercase tracking-widest leading-relaxed">
                                L'IA analysera la propreté et la conformité <br />pour valider la tâche automatiquement.
                            </p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
