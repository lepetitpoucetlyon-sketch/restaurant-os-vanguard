"use client";

import { useEffect, useRef, useState } from 'react';
import { useAtom } from 'jotai';
import { performanceModeAtom } from '@/store/operationalAtoms';
import { useToast } from '@ui/Toast';
import { logger } from '@/lib/logger';

/**
 * ⚡ PerformanceEngine - Lumière de Brigade
 * Orchestre l'optimisation adaptative de l'UI en fonction du matériel.
 */
export function PerformanceEngine(): null {
    const [performanceMode, setPerformanceMode] = useAtom(performanceModeAtom);
    const { showToast } = useToast();
    const frameCount = useRef(0);
    const lastTime = useRef<number | null>(null);
    const [fps, setFps] = useState(60);

    useEffect(() => {
        if (lastTime.current === null) {
            lastTime.current = performance.now();
        }
    }, []);
    const lowFpsCounter = useRef(0);
    const hasSuggestedMode = useRef(false);

    // 1. CSS CLASS SYNC
    useEffect(() => {
        if (performanceMode) {
            document.body.classList.add('brigade-light');
            logger.info('[PERF] Performance Mode Enabled: Brigade Light Active.');
        } else {
            document.body.classList.remove('brigade-light');
            logger.info('[PERF] Performance Mode Disabled: Premium Visuals Active.');
        }
    }, [performanceMode]);

    // 2. FPS MONITORING (Adaptive UI)
    useEffect(() => {
        if (performanceMode) return; // Don't monitor if already in perf mode

        let animationFrameId: number;

        const checkFps = () => {
            const now = performance.now();
            frameCount.current++;

            if (lastTime.current !== null && now >= lastTime.current + 1000) {
                const currentFps = Math.round((frameCount.current * 1000) / (now - lastTime.current));
                setFps(currentFps);
                
                // Si les FPS tombent sous 35 pendant 5 secondes consécutives
                if (currentFps < 35) {
                    lowFpsCounter.current++;
                    if (lowFpsCounter.current >= 5 && !hasSuggestedMode.current) {
                        suggestPerformanceMode();
                    }
                } else {
                    lowFpsCounter.current = 0;
                }

                frameCount.current = 0;
                lastTime.current = now;
            } else if (lastTime.current === null) {
                lastTime.current = now;
            }

            animationFrameId = requestAnimationFrame(checkFps);
        };

        const suggestPerformanceMode = () => {
            hasSuggestedMode.current = true;
            showToast(
                'Lumière de Brigade suggérée', 
                'premium'
            );
            // On affiche un toast informatif, l'utilisateur choisit.
            // Note: On pourrait aussi le forcer si < 20 FPS
        };

        animationFrameId = requestAnimationFrame(checkFps);
        return () => cancelAnimationFrame(animationFrameId);
    }, [performanceMode, showToast]);

    return null; // Orchestrator only
}
