"use client";

import { useState, useRef, useCallback } from 'react';
import { Camera, RefreshCw, Check, X, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@ui/button';
import { cn } from "@/lib/ui.foundations";;

interface CameraCaptureProps {
    onCapture: (imageData: string) => void;
    onClose: () => void;
    title?: string;
}

export function CameraCapture({ onCapture, onClose, title = "Capturer une Photo" }: CameraCaptureProps) {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: false
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setError(null);
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
        }
    };

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    }, [stream]);

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = canvas.toDataURL('image/jpeg', 0.8);
                setCapturedImage(imageData);
                stopCamera();
            }
        }
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setCapturedImage(e.target?.result as string);
                stopCamera();
            };
            reader.readAsDataURL(file);
        }
    };

    const confirmCapture = () => {
        if (capturedImage) {
            onCapture(capturedImage);
            onClose();
        }
    };

    const reset = () => {
        setCapturedImage(null);
        startCamera();
    };

    return (
        <div className="flex flex-col gap-6 p-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-serif italic font-black text-text-primary">{title}</h3>
                <button 
                    onClick={() => { stopCamera(); onClose(); }}
                    className="p-2 rounded-full bg-bg-tertiary text-text-muted hover:text-text-primary transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="relative aspect-[4/3] bg-surface-sidebar rounded-[32px] overflow-hidden border border-border shadow-2xl">
                {!capturedImage ? (
                    <>
                        <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            className="w-full h-full object-cover"
                        />
                        {!stream && !error && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-bg-primary/50 backdrop-blur-sm">
                                <Button 
                                    onClick={startCamera}
                                    className="bg-accent-gold text-white rounded-full px-8 py-6 h-auto font-black uppercase tracking-widest text-[10px]"
                                >
                                    Activer la Caméra
                                </Button>
                                <label className="cursor-pointer group">
                                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                                    <div className="flex items-center gap-2 text-text-muted group-hover:text-text-primary transition-colors">
                                        <Upload size={16} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Ou importer un fichier</span>
                                    </div>
                                </label>
                            </div>
                        )}
                        {error && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-6">
                                <X size={48} className="text-status-danger" />
                                <p className="text-xs font-black uppercase text-status-danger tracking-wider leading-relaxed">{error}</p>
                                <Button onClick={startCamera} variant="outline" className="border-rose-500/20 text-status-danger">Réessayer</Button>
                            </div>
                        )}
                        {stream && (
                            <button 
                                onClick={capturePhoto}
                                className="absolute bottom-6 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full border-4 border-white flex items-center justify-center group"
                            >
                                <div className="w-16 h-16 rounded-full bg-surface-card/30 backdrop-blur-md group-hover:scale-95 transition-transform" />
                            </button>
                        )}
                    </>
                ) : (
                    <img 
                        src={capturedImage} 
                        alt="Capture preview" 
                        className="w-full h-full object-cover"
                    />
                )}
                <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="flex gap-4">
                {capturedImage ? (
                    <>
                        <Button 
                            variant="outline" 
                            className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] border-border text-text-muted"
                            onClick={reset}
                        >
                            <RefreshCw size={16} className="mr-2" />
                            Recommencer
                        </Button>
                        <Button 
                            className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-status-success text-white hover:bg-status-success"
                            onClick={confirmCapture}
                        >
                            <Check size={16} className="mr-2" />
                            Confirmer
                        </Button>
                    </>
                ) : (
                    <Button 
                        variant="outline" 
                        className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] border-border text-text-muted"
                        onClick={() => { stopCamera(); onClose(); }}
                    >
                        Annuler
                    </Button>
                )}
            </div>
        </div>
    );
}
