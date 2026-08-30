"use client";

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2 } from 'lucide-react';
import { tutorialContent } from '@/lib/tutorialContent';
import { useHasMounted } from '@/shared/hooks';

interface TutorialOverlayProps {
    categoryId: string;
    isOpen: boolean;
    onClose: () => void;
}

export function TutorialOverlay({ categoryId, isOpen, onClose }: TutorialOverlayProps) {
    const mounted = useHasMounted();

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!mounted) return null;

    const data = tutorialContent[categoryId];
    if (!data) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex justify-end">
                    {/* Backdrop */}
                    <motion.div role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); (e.currentTarget as HTMLElement).click(); } }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    />

                    {/* Drawer (Sliding from Right) */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="relative w-full max-w-md h-full bg-surface-card shadow-2xl overflow-y-auto flex flex-col border-l border-border"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-surface-card/90 backdrop-blur-md z-10">
                            <h2 className="text-xl font-serif font-black italic text-text-primary tracking-tight">
                                {data.title}
                                <span className="text-accent-gold not-italic">.</span>
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-surface-glass text-text-muted transition-colors"
                                aria-label="Fermer le tutoriel"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content List */}
                        <div className="p-6 flex flex-col space-y-6">
                            {data.items.map((item, index) => (
                                <div key={index} className="flex space-x-4">
                                    <div className="mt-1 flex-shrink-0">
                                        <CheckCircle2 className="w-5 h-5 text-accent-gold" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-text-primary mb-1">{item.title}</h3>
                                        <p className="text-sm text-text-muted leading-relaxed">
                                            {item.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-auto p-6">
                            <button
                                onClick={onClose}
                                className="w-full py-3 px-4 bg-action-primary text-text-on-primary font-medium rounded-xl hover:bg-action-primary-hover transition-colors"
                            >
                                J'ai compris
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
