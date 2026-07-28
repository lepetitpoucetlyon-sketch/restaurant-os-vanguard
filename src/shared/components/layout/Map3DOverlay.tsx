"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2, ExternalLink, RefreshCw } from 'lucide-react';
import { useUI } from '@/shared/hooks';
;

export function Map3DOverlay() {
    const { isMap3DOpen, setIsMap3DOpen } = useUI();

    const handleRefresh = () => {
        const iframe = document.getElementById('map-3d-iframe') as HTMLIFrameElement;
        if (iframe) {
            iframe.src = iframe.src;
        }
    };

    return (
        <AnimatePresence>
            {isMap3DOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMap3DOpen(false)}
                        className="fixed inset-0 bg-surface-sidebar/60 backdrop-blur-xl z-[100]"
                    />

                    {/* Window Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed inset-2 md:inset-4 lg:inset-6 bg-[#F8F7F2] rounded-[1rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] z-[101] overflow-hidden flex flex-col"
                    >
                        {/* Header Bar */}
                        <div className="flex items-center justify-between px-8 py-5 border-b border-black/5 bg-[#F8F7F2]">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-accent-gold/10 text-accent-gold flex items-center justify-center border border-accent-gold/20">
                                    <Maximize2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-serif italic font-black text-[#1C1C1C]">Cartographie <span className="text-accent-gold not-italic">3D</span></h2>
                                    <p className="text-[10px] uppercase tracking-widest text-[#525252] mt-0.5">Intelligence Géospatiale & Flux Opérationnels</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleRefresh}
                                    className="p-3 text-[#525252] hover:text-[#1C1C1C] hover:bg-surface-sidebar/5 rounded-xl transition-all"
                                    title="Actualiser la vue"
                                >
                                    <RefreshCw className="w-5 h-5" />
                                </button>
                                <a
                                    href="/blueprint/index.html"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-3 text-[#525252] hover:text-[#1C1C1C] hover:bg-surface-sidebar/5 rounded-xl transition-all"
                                    title="Ouvrir plein écran"
                                >
                                    <ExternalLink className="w-5 h-5" />
                                </a>
                                <div className="w-px h-6 bg-surface-sidebar/10 mx-2" />
                                <button
                                    onClick={() => setIsMap3DOpen(false)}
                                    className="p-3 bg-surface-sidebar/5 hover:bg-surface-sidebar/10 text-[#1C1C1C] rounded-xl transition-all group"
                                >
                                    <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                                </button>
                            </div>
                        </div>

                        {/* Content (Iframe) */}
                        <div className="flex-1 bg-surface-sidebar/40 relative">
                            <iframe
                                id="map-3d-iframe"
                                src="/blueprint/index.html"
                                className="w-full h-full border-none"
                                title="Cartographie 3D"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                            
                            {/* Loading Overlay (Optional subtle effect) */}
                            <div className="absolute inset-0 pointer-events-none border-inset border-[40px] border-bg-primary/5 shadow-inner" />
                        </div>
                        
                        {/* Footer / Status Bar */}
                        <div className="px-8 py-3 bg-[#F8F7F2] border-t border-black/5 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-status-success">Système Connecté</span>
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#A3A3A3]">Rendu GPU Accéléré</span>
                            </div>
                            <span className="text-[9px] font-medium text-[#A3A3A3] font-mono italic">v1.2.0-STABLE</span>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
