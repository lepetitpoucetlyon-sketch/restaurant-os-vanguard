"use client";

import { motion } from "framer-motion";

export function ScoreGauge({ score, size = 160 }: { score: number; size?: number }) {
    const radius = (size - 24) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = (score / 100) * circumference;

    const getColor = (value: number) => {
        if (value >= 80) return '#00D9A6';
        if (value >= 60) return 'var(--color-status-warning)';
        return 'var(--color-status-danger)';
    };

    return (
        <div className="relative flex flex-col items-center" style={{ width: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    className="text-border"
                    strokeWidth="12"
                />
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={getColor(score)}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: circumference - progress }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-serif italic font-black text-text-primary">{score}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-text-muted mt-1">/100</span>
            </div>
        </div>
    );
}
