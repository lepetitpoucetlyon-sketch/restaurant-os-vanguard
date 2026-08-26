"use client";

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Scan, Zap } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';
import type { ExtractedInvoice } from '@/modules/intelligence';

function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}


interface VisionScannerProps {
    onAnalysisComplete: (data: ExtractedInvoice) => void;
    label?: string;
}

export function VisionScanner({ onAnalysisComplete, label = "Scanner une Facture" }: VisionScannerProps) {
    const [isScanning, setIsScanning] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const base64 = await fileToBase64(file);
        setPreview(base64);
        processImage(base64);
    };

    const processImage = async (base64: string) => {
        setIsScanning(true);
        setIsProcessing(true);

        try {
            const { VisionService } = await import('@/modules/intelligence/services/VisionService');
            const data = await VisionService.analyzeInvoice(base64);
            onAnalysisComplete(data);
            setPreview(null);
        } catch (error) {
            console.error(error);
        } finally {
            setIsScanning(false);
            setIsProcessing(false);
        }
    };

    return (
        <div className="relative">
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                className="hidden" 
                accept="image/*"
            />

            <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                    "relative group cursor-pointer overflow-hidden rounded-[2.5rem] border-2 border-dashed transition-all duration-500",
                    isProcessing ? "border-action-primary/50 bg-status-warning/5" : "border-subtle hover:border-white/30 bg-surface-card/[0.02]"
                )}
            >
                {/* 🛰️ Laser Scan Animation */}
                <AnimatePresence>
                    {isScanning && (
                        <motion.div 
                            initial={{ top: "-10%" }}
                            animate={{ top: "110%" }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-status-warning to-transparent shadow-[0_0_20px_#f59e0b] z-20"
                        />
                    )}
                </AnimatePresence>

                <div className="p-12 flex flex-col items-center text-center space-y-6">
                    <div className={cn(
                        "w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-700",
                        isProcessing ? "bg-status-warning text-primary shadow-2xl shadow-amber-500/20 rotate-12" : "bg-surface-card/5 text-muted group-hover:text-text-primary group-hover:bg-surface-card/10"
                    )}>
                        {isProcessing ? <Zap size={36} className="fill-current animate-pulse" /> : <Scan size={36} />}
                    </div>

                    <div>
                        <h3 className="text-xl font-serif italic text-text-primary uppercase tracking-tighter mb-2">{label}</h3>
                        <p className="text-nano font-black text-secondary uppercase tracking-[0.3em]">
                            {isProcessing ? "IA vision en cours d'analyse brute..." : "Glissez-déposez ou cliquez pour capturer"}
                        </p>
                    </div>

                    {isProcessing && (
                        <div className="flex items-center gap-3 px-4 py-2 bg-surface-glass rounded-full border border-border">
                            <Loader2 size={12} className="animate-spin text-status-warning" />
                            <span className="text-nano font-bold text-status-warning uppercase tracking-widest">GEMINI 1.5 PRO ACTIVE</span>
                        </div>
                    )}
                </div>

                {/* Preview Overlay */}
                <AnimatePresence>
                    {preview && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 z-10 bg-black/80 backdrop-blur-sm"
                        >
                            <img src={preview} alt="Preview" className="w-full h-full object-cover opacity-40" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
