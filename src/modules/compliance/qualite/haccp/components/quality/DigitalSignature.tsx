// @wip owner:compliance-team échéance:2026-Q4 — écran HACCP à intégrer dans le flow qualité (audit orphelins 2026-08-30)
"use client";

import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw, PenTool, CheckCircle2, User } from 'lucide-react';
import { Button } from '@ui/Button';
import { cn } from '@/lib/ui.foundations';

interface DigitalSignatureProps {
    onSave: (data: string, name: string) => void;
    defaultValue?: string;
    defaultName?: string;
}

export const DigitalSignature: React.FC<DigitalSignatureProps> = ({ onSave, defaultValue, defaultName }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSigned, setHasSigned] = useState(!!defaultValue);
    const [signerName, setSignerName] = useState(defaultName || '');
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set high res for canvas
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        
        ctx.strokeStyle = '#0f172a'; // slate-900
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (defaultValue) {
            const img = new Image();
            img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
            img.src = defaultValue;
        }
    }, [defaultValue]);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        setHasSigned(true);
        setIsSaved(false);
        const { offsetX, offsetY } = getCoordinates(e);
        const ctx = canvasRef.current?.getContext('2d');
        ctx?.beginPath();
        ctx?.moveTo(offsetX, offsetY);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const { offsetX, offsetY } = getCoordinates(e);
        const ctx = canvasRef.current?.getContext('2d');
        ctx?.lineTo(offsetX, offsetY);
        ctx?.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { offsetX: 0, offsetY: 0 };
        const rect = canvas.getBoundingClientRect();
        
        if ('touches' in e) {
            return {
                offsetX: e.touches[0].clientX - rect.left,
                offsetY: e.touches[0].clientY - rect.top
            };
        }
        return {
            offsetX: e.nativeEvent.offsetX,
            offsetY: e.nativeEvent.offsetY
        };
    };

    const clear = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            setHasSigned(false);
            setIsSaved(false);
        }
    };

    const handleSave = () => {
        const canvas = canvasRef.current;
        if (canvas && hasSigned && signerName) {
            const dataUrl = canvas.toDataURL('image/png');
            onSave(dataUrl, signerName);
            setIsSaved(true);
        }
    };

    return (
        <div className="bg-surface-card p-8 rounded-[3rem] border border-subtle shadow-xl space-y-6">
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h3 className="text-sm font-black text-primary uppercase tracking-widest flex items-center gap-2">
                        <PenTool className="w-4 h-4 text-status-success" />
                        Signature Mobile
                    </h3>
                    <p className="text-nano font-bold text-muted uppercase tracking-tighter mt-1">Certification HACCP • Nexus-Darwin 5</p>
                </div>
                <button aria-label="Rafraîchir" 
                    onClick={clear}
                    className="p-3 rounded-full hover:bg-surface-bg text-muted hover:text-status-danger transition-all active:rotate-180 duration-500"
                >
                    <RotateCcw className="w-4 h-4" />
                </button>
            </div>

            <div className="relative group">
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-48 bg-surface-bg rounded-[2rem] border-2 border-dashed border-default cursor-crosshair touch-none group-hover:border-emerald-200 transition-colors"
                />
                {!hasSigned && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <p className="text-nano font-black text-muted uppercase tracking-widest italic">Signer ici</p>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">
                        <User className="w-4 h-4" />
                    </div>
                    <input 
                        type="text"
                        placeholder="Nom du signataire"
                        value={signerName}
                        onChange={(e) => setSignerName(e.target.value)}
                        className="w-full bg-surface-bg border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-emerald-500/20 transition-all"
                    />
                </div>

                <Button 
                    onClick={handleSave}
                    disabled={!hasSigned || !signerName || isSaved}
                    className={cn(
                        "w-full py-6 rounded-2xl font-black uppercase text-nano tracking-widest transition-all",
                        isSaved ? "bg-status-success text-text-on-primary" : "bg-action-primary text-text-on-primary hover:bg-action-primary-hover"
                    )}
                >
                    {isSaved ? (
                        <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Signature Capturée</span>
                    ) : (
                        "Enregistrer la Signature"
                    )}
                </Button>
            </div>
            
            <p className="text-nano text-center text-muted font-bold leading-relaxed px-4 italic">
                La signature électronique apposée certifie la conformité de l'agréage et des relevés de température enregistrés.
            </p>
        </div>
    );
};
