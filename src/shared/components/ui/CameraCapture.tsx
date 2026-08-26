"use client";

import { useRef, useState, useEffect } from "react";
import { RefreshCcw, Check, X, SwitchCamera } from "lucide-react";
import { Button } from "@ui/Button";
import { cn } from "@/lib/ui.foundations";

interface CameraCaptureProps {
    onCapture: (imageData: string) => void;
    /** Callback déclenché quand l'utilisateur ferme sans valider */
    onClose?: () => void;
    /** Titre affiché en en-tête du composant */
    title?: string;
}

export const CameraCapture = ({ onCapture, onClose, title }: CameraCaptureProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [_stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isMirror, setIsMirror] = useState(false);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

    useEffect(() => {
        let isCancelled = false;

        const startCamera = async () => {
            streamRef.current?.getTracks().forEach(track => track.stop());

            try {
                const newStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode,
                        width: { ideal: 1920 },
                        height: { ideal: 1080 }
                    },
                    audio: false
                });

                if (isCancelled) {
                    newStream.getTracks().forEach(track => track.stop());
                    return;
                }

                streamRef.current = newStream;
                setStream(newStream);

                if (videoRef.current) {
                    videoRef.current.srcObject = newStream;
                }
            } catch (err) {
                console.error("Camera access error:", err);
            }
        };

        void startCamera();

        return () => {
            isCancelled = true;
            streamRef.current?.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        };
    }, [facingMode]);

    const takePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            if (context) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                
                if (isMirror) {
                    context.translate(canvas.width, 0);
                    context.scale(-1, 1);
                }
                
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = canvas.toDataURL('image/jpeg');
                setCapturedImage(imageData);
            }
        }
    };

    const confirmPhoto = () => {
        if (capturedImage) {
            onCapture(capturedImage);
        }
    };

    const toggleFacingMode = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    return (
        <div className="relative w-full bg-black flex flex-col overflow-hidden">
            {(title || onClose) && (
                <div className="flex items-center justify-between px-6 py-4 border-b border-border-default">
                    {title && <p className="text-micro font-black uppercase tracking-[0.2em] text-text-secondary">{title}</p>}
                    {onClose && (
                        <button onClick={onClose} className="ml-auto w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-glass text-text-muted transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            )}
        <div className="relative aspect-[3/4] md:aspect-video flex flex-col items-center justify-center overflow-hidden">
            {!capturedImage ? (
                <>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className={cn(
                            "w-full h-full object-cover transition-transform duration-500",
                            isMirror && "scale-x-[-1]"
                        )}
                    />
                    
                    {/* Camera Controls Overlay */}
                    <div className="absolute inset-x-0 bottom-0 p-10 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-center gap-12">
                        <button 
                            onClick={toggleFacingMode}
                            className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all backdrop-blur-md"
                        >
                            <SwitchCamera className="w-6 h-6" />
                        </button>
                        
                        <button 
                            onClick={takePhoto}
                            className="w-20 h-20 rounded-full bg-white flex items-center justify-center group active:scale-95 transition-all shadow-2xl relative"
                        >
                            <div className="w-16 h-16 rounded-full border-2 border-black/10 flex items-center justify-center">
                                <div className="w-12 h-12 rounded-full bg-action-primary group-hover:bg-action-primary-hover transition-colors" />
                            </div>
                            <div className="absolute -inset-2 border-2 border-white/30 rounded-full animate-ping pointer-events-none opacity-0 group-hover:opacity-100" />
                        </button>

                        <button 
                            onClick={() => setIsMirror(!isMirror)}
                            className={cn(
                                "w-14 h-14 rounded-full flex items-center justify-center transition-all backdrop-blur-md",
                                isMirror ? "bg-action-primary text-text-on-primary" : "bg-white/10 text-white hover:bg-white/20"
                            )}
                        >
                            <RefreshCcw className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Scan Guide UI */}
                    <div className="absolute inset-0 border-[2px] border-white/30 m-12 rounded-[2rem] pointer-events-none">
                        <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-action-primary rounded-tl-3xl m-[-4px]" />
                        <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-action-primary rounded-tr-3xl m-[-4px]" />
                        <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-action-primary rounded-bl-3xl m-[-4px]" />
                        <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-action-primary rounded-br-3xl m-[-4px]" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <p className="text-white/60 text-nano font-black uppercase tracking-[0.3em] font-serif italic bg-black/40 px-6 py-3 rounded-full backdrop-blur-sm">Cadrage CV</p>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <img src={capturedImage} alt="Captured" className="w-full h-full object-contain bg-black" />
                    
                    <div className="absolute inset-x-0 bottom-0 p-10 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-center gap-8">
                        <Button 
                            variant="outline" 
                            className="h-16 px-10 rounded-2xl bg-surface-card/10 hover:bg-surface-card/20 text-text-primary border-default font-black uppercase text-micro tracking-widest transition-all"
                            onClick={() => setCapturedImage(null)}
                        >
                            <X className="w-5 h-5 mr-3" />
                            Recommencer
                        </Button>
                        <Button 
                            className="h-16 px-12 rounded-2xl bg-accent hover:bg-surface-card text-text-primary hover:text-primary font-black uppercase text-micro tracking-widest shadow-2xl transition-all"
                            onClick={confirmPhoto}
                        >
                            <Check className="w-5 h-5 mr-3" />
                            Valider le Scan
                        </Button>
                    </div>
                </>
            )}
            <canvas ref={canvasRef} className="hidden" />
        </div>
        </div>
    );
};
