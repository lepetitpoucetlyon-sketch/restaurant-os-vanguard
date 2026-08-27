"use client";

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useTutorial } from '@/shared/contexts/TutorialContext';
import { ChevronRight, X } from 'lucide-react';
import { cn } from "@/lib/ui.foundations";
import { useHasMounted } from '@/shared/hooks';
import type { NexusTutorialState } from '@nexus/contracts/nexus.types';

import { usePathname, useRouter } from 'next/navigation';

export function TutorialBubble() {
    const { isActive, currentSection, currentPointIndex, nextStep, prevStep: _prevStep, stopTutorial } = useTutorial() as NexusTutorialState;
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });
    const isMounted = useHasMounted();
    const bubbleRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();
    const router = useRouter();
    const currentPoint = currentSection?.points?.[currentPointIndex];
    const isNavigating = Boolean(isActive && currentPoint?.path && pathname !== currentPoint.path);

    // Auto-Navigation Logic
    useEffect(() => {
        if (isNavigating && currentPoint?.path) {
            router.push(currentPoint.path);
        }
    }, [currentPoint?.path, isNavigating, router]);

    useEffect(() => {
        if (!isActive || !currentSection || isNavigating) return;

        let rafId: number;
        const point = currentPoint;
        if (!point) return;

        const updatePosition = () => {
            const element = document.querySelector(point.selector);

            if (element) {
                const rect = element.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    setCoords(prev => {
                        const newTop = rect.top + window.scrollY;
                        const newLeft = rect.left + window.scrollX;

                        if (Math.abs(prev.top - newTop) < 0.5 && Math.abs(prev.left - newLeft) < 0.5 && prev.width === rect.width) {
                            return prev;
                        }

                        return {
                            top: newTop,
                            left: newLeft,
                            width: rect.width,
                            height: rect.height
                        };
                    });
                }
            } else {
                // FALLBACK: If element is not found, center the bubble
                setCoords({
                    top: window.innerHeight / 2 - 50 + window.scrollY,
                    left: window.innerWidth / 2 - 50 + window.scrollX,
                    width: 0,
                    height: 0
                });
            }

            rafId = requestAnimationFrame(updatePosition);
        };

        const initialFindTimer = setTimeout(() => {
            if (!isNavigating) {
                const el = document.querySelector(point.selector);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }, 800); // Increased delay to allow for page transition

        rafId = requestAnimationFrame(updatePosition);

        return () => {
            cancelAnimationFrame(rafId);
            clearTimeout(initialFindTimer);
        };
    }, [currentPoint, currentSection, isActive, isNavigating, pathname]); // Re-run when pathname changes

    // Auto-Execute Action
    useEffect(() => {
        if (!isActive || !currentSection || isNavigating) return;
        if (!currentPoint) return;
        if (currentPoint?.action) {
            const timer = setTimeout(() => {
                currentPoint.action?.();
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [currentPoint, currentSection, isActive, isNavigating]);

    if (!isMounted || !isActive || !currentSection || !currentPoint) return null;

    if (isNavigating) {
        return createPortal(
            <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center">
                <div className="bg-surface-card p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                    <p className="font-serif italic text-lg text-text-primary">Navigation vers l'étape suivante...</p>
                </div>
            </div>,
            document.body
        );
    }

    const isLastStep = currentPointIndex === currentSection.points.length - 1;
    const hasTarget = coords.width > 0;

    // Calculate dynamic position
    const showAbove = hasTarget ? (coords.top - window.scrollY + coords.height + 250 > window.innerHeight) : false;
    const arrowPosition = showAbove ? 'bottom' : 'top';

    const bubbleTop = hasTarget
        ? (showAbove ? coords.top - 20 : coords.top + coords.height + 20)
        : (window.innerHeight / 2 + window.scrollY);

    const bubbleLeft = hasTarget
        ? Math.max(20, Math.min(window.innerWidth - 380, coords.left + coords.width / 2 - 160))
        : (window.innerWidth / 2 + window.scrollX);

    return createPortal(
        <div className="fixed inset-0 z-[9999] overflow-hidden">
            {/* Spotlight Overlay */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-[2px]"
                style={hasTarget ? {
                    clipPath: `polygon(
                        0% 0%, 0% 100%, 
                        ${coords.left - window.scrollX}px 100%, 
                        ${coords.left - window.scrollX}px ${coords.top - window.scrollY}px, 
                        ${coords.left - window.scrollX + coords.width}px ${coords.top - window.scrollY}px, 
                        ${coords.left - window.scrollX + coords.width}px ${coords.top - window.scrollY + coords.height}px, 
                        ${coords.left - window.scrollX}px ${coords.top - window.scrollY + coords.height}px, 
                        ${coords.left - window.scrollX}px 100%, 
                        100% 100%, 100% 0%
                    )`
                } : {}}
            >
                <div className="absolute inset-0" onClick={stopTutorial} aria-hidden="true" />
            </motion.div>

            {/* Glowing Border - only show if target found */}
            <AnimatePresence>
                {hasTarget && (
                    <motion.div
                        className="absolute pointer-events-none border-2 border-teal shadow-[0_0_30px_rgba(0,217,166,0.3)] rounded-xl"
                        initial={{ opacity: 0 }}
                        animate={{
                            opacity: 1,
                            top: coords.top - 4,
                            left: coords.left - 4,
                            width: coords.width + 8,
                            height: coords.height + 8
                        }}
                        exit={{ opacity: 0 }}
                    />
                )}
            </AnimatePresence>

            {/* The Tutorial Card */}
            <motion.div
                ref={bubbleRef}
                role="dialog"
                aria-modal="false"
                aria-label={currentPoint.label || "Tutoriel"}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{
                    opacity: 1,
                    scale: 1,
                    top: bubbleTop,
                    left: bubbleLeft,
                    x: hasTarget ? 0 : '-50%',
                    y: hasTarget ? (showAbove ? '-100%' : '0%') : '-50%'
                }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="absolute w-[320px] bg-surface-card rounded-[2.5rem] shadow-premium shadow-glow-accent/10 dark:shadow-black/80 border border-border-default p-7 pointer-events-auto overflow-hidden ring-1 ring-black/5"
            >
                {/* Status Indicator Bar */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-surface-glass rounded-b-xl flex items-center justify-center overflow-hidden">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal shadow-[0_0_8px_rgba(0,217,166,0.6)] animate-pulse" />
                </div>

                {/* Arrow Pointer - only if has target */}
                {hasTarget && (
                    <div
                        className={cn(
                            "absolute w-6 h-6 bg-surface-card rotate-45 left-1/2 -translate-x-1/2 border-border-default",
                            arrowPosition === 'top' ? "-top-3 border-t border-l" : "-bottom-3 border-b border-r"
                        )}
                    />
                )}

                {/* Header */}
                <div className="flex items-center justify-between mb-6 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-teal flex items-center justify-center text-text-primary text-sm font-black shadow-lg shadow-[#00D9A6]/20">
                            {currentPointIndex + 1}
                        </div>
                        <span className="text-nano font-black text-text-muted uppercase tracking-[0.2em]">
                            Étape {currentPointIndex + 1} / {currentSection.points.length}
                        </span>
                    </div>
                    <button
                        onClick={stopTutorial}
                        aria-label="Fermer le tutoriel"
                        className="p-2 hover:bg-surface-glass rounded-full transition-colors group cursor-pointer"
                    >
                        <X className="w-4 h-4 text-text-muted group-hover:text-text-primary" aria-hidden="true" />
                    </button>
                </div>

                {/* Content */}
                <div className="space-y-4 relative z-10 mb-8">
                    <h4 className="text-2xl font-serif italic font-black text-text-primary leading-tight">
                        {currentPoint.label}
                    </h4>
                    <p className="text-sm text-text-secondary font-medium leading-relaxed">
                        {currentPoint.description}
                    </p>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-end relative z-10">
                    {/* We prioritize Next button visibility as per screenshot style */}
                    <button
                        onClick={nextStep}
                        className="h-12 px-8 bg-accent-gold hover:bg-accent-gold/90 text-white rounded-full font-black text-nano uppercase tracking-widest transition-all flex items-center gap-3 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 cursor-pointer"
                    >
                        {isLastStep ? "Terminer" : "Suivant"}
                        <ChevronRight className="w-3 h-3" aria-hidden="true" />
                    </button>
                </div>
            </motion.div>
        </div>,
        document.body
    );
}
