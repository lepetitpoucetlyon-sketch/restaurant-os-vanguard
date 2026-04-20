// @ts-nocheck
// @ts-nocheck
"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ShieldCheck, AlertTriangle, Loader2, X, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHACCP } from '@/engines/guard/NexusGuardProvider';
import { VisionService } from '@/domain/services/VisionService';
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
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg bg-[#0B0B0C] border border-white/10 rounded-[3rem] p-10 text-center relative overflow-hidden shadow-2xl"
            >
                {/* Close Button */}
                <button onClick={onClose} className="absolute top-6 right-6 p-2 text-neutral-500 hover:text-white transition-colors">
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center space-y-8">
                    <div className={cn(
                        "w-24 h-24 rounded-3xl flex items-center justify-center transition-all duration-700",
                        isProcessing ? "bg-amber-500 text-black animate-pulse" : 
                        result?.isCompliant ? "bg-emerald-500 text-white shadow-2xl shadow-emerald-500/20" :
                        result ? "bg-red-500 text-white" : "bg-white/5 text-neutral-400"
                    )}>
                        {isProcessing ? <Loader2 size={40} className="animate-spin" /> : 
                         result?.isCompliant ? <ShieldCheck size={40} /> :
                         result ? <AlertTriangle size={40} /> : <Camera size={40} />}
                    </div>

                    <div>
                        <h3 className="text-2xl font-serif italic text-white mb-2 uppercase tracking-tighter">Audit Sanitaire</h3>
                        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.4em] mb-4">{taskName}</p>
                        
                        <AnimatePresence>
                            {result && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn(
                                        "p-4 rounded-2xl border text-[11px] font-bold",
                                        result.isCompliant ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-500" : "bg-red-500/5 border-red-500/20 text-red-500"
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
                                className="w-full py-8 bg-white text-black text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl hover:scale-105 transition-all shadow-xl"
                            >
                                <Camera size={18} className="mr-2" />
                                Capturer la Preuve
                            </Button>
                            <p className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest leading-relaxed">
                                L'IA analysera la propreté et la conformité <br />pour valider la tâche automatiquement.
                            </p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
