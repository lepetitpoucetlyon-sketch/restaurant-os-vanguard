'use client';

/**
 * 🎉 CelebrationParticles & useCelebration — Animation cinématique de célébration.
 *
 * Déclenche une explosion de particules / confettis dorés et multicolores
 * avec synchronisation haptique (`useHaptic.celebrate()`).
 *
 * Conçu pour :
 * - Clôture réussie du Ticket Z (NF525)
 * - Objectif de CA ou de réservations atteint
 * - Premier onboarding réussi
 *
 * Implémentation légère en Canvas 2D natif — ZÉRO dépendance externe lourde.
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { useHaptic } from '@/shared/hooks/useHaptic';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    size: number;
    alpha: number;
    rotation: number;
    rotationSpeed: number;
}

const CELEBRATION_COLORS = [
    '#C5A059', // Gold
    '#E5C378', // Light gold
    '#10B981', // Emerald
    '#6366F1', // Indigo
    '#F59E0B', // Amber
    '#EC4899', // Pink
    '#FFFFFF', // White
];

export function CelebrationCanvas({ active, onComplete }: { active: boolean; onComplete?: () => void }) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        if (!active) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles: Particle[] = [];
        const count = 120;

        for (let i = 0; i < count; i++) {
            particles.push({
                x: canvas.width / 2 + (Math.random() - 0.5) * 200,
                y: canvas.height * 0.4 + (Math.random() - 0.5) * 50,
                vx: (Math.random() - 0.5) * 14,
                vy: (Math.random() - 0.8) * 16,
                color: CELEBRATION_COLORS[Math.floor(Math.random() * CELEBRATION_COLORS.length)],
                size: Math.random() * 8 + 4,
                alpha: 1,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 10,
            });
        }

        let animationFrameId: number;

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let aliveCount = 0;

            particles.forEach((p) => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.35; // Gravité
                p.vx *= 0.98; // Friction
                p.alpha -= 0.008; // Fondu progressif
                p.rotation += p.rotationSpeed;

                if (p.alpha > 0) {
                    aliveCount++;
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate((p.rotation * Math.PI) / 180);
                    ctx.globalAlpha = Math.max(0, p.alpha);
                    ctx.fillStyle = p.color;
                    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
                    ctx.restore();
                }
            });

            if (aliveCount > 0) {
                animationFrameId = requestAnimationFrame(render);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                onComplete?.();
            }
        };

        animationFrameId = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [active, onComplete]);

    if (!active) return null;

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[99999]"
        />
    );
}

/**
 * Hook de déclenchement de célébration.
 */
export function useCelebration() {
    const [isCelebrating, setIsCelebrating] = React.useState(false);
    const haptic = useHaptic();

    const trigger = useCallback(() => {
        setIsCelebrating(true);
        haptic.celebrate();
    }, [haptic]);

    const onComplete = useCallback(() => {
        setIsCelebrating(false);
    }, []);

    return {
        isCelebrating,
        trigger,
        onComplete,
    };
}
