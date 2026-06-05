"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, AlertTriangle, TrendingDown, TrendingUp, Target } from 'lucide-react';
import { OraclePrediction } from '@domain/services/OracleEngine';
import { StatusBadge } from '@ui/StatusBadge';
import { PremiumCard } from '@ui/PremiumCard';

interface OraclePredictorProps {
    prediction: OraclePrediction;
    itemName: string;
}

export const OraclePredictor: React.FC<OraclePredictorProps> = ({ prediction, itemName }) => {
    const riskColors: Record<'LOW' | 'MEDIUM' | 'HIGH', import('@ui/StatusBadge').BadgeStatus> = {
        LOW: 'success',
        MEDIUM: 'warning',
        HIGH: 'error'
    };

    const trendIcon = prediction.trend === 'ACCELERATING' ? 
        <TrendingUp className="w-4 h-4 text-error" /> : 
        <TrendingDown className="w-4 h-4 text-success" />;

    return (
        <PremiumCard className="overflow-hidden border-accent-gold/20 bg-gradient-to-br from-bg-secondary to-bg-tertiary">
            <div className="p-6 space-y-6">
                {/* Header: L'IA Oracle */}
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-accent-gold/10 flex items-center justify-center text-accent-gold">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-text-primary">Oracle Prédictif v7</h3>
                            <p className="text-[10px] text-text-muted font-light">Analyse Monte-Carlo • 1000 scénarios</p>
                        </div>
                    </div>
                    <StatusBadge 
                        status={riskColors[prediction.riskLevel]} 
                        label={`Risque ${prediction.riskLevel}`} 
                    />
                </div>

                {/* Main Insight: Days remaining */}
                <div className="text-center py-4 relative">
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-gold/60 mb-2">Rupture Estimée</div>
                    <div className="text-7xl font-serif italic font-black text-text-primary flex items-center justify-center gap-2">
                        {prediction.estimatedDaysRemaining}
                        <span className="text-lg font-sans not-italic uppercase tracking-widest opacity-40">Jours</span>
                    </div>
                    
                    {/* Progress Bar Custom */}
                    <div className="mt-6 w-full h-1.5 bg-bg-primary rounded-full overflow-hidden border border-border/10">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(10, 100 - (prediction.estimatedDaysRemaining * 5))}%` }}
                            className={`h-full ${prediction.riskLevel === 'HIGH' ? 'bg-error' : 'bg-accent-gold'}`}
                        />
                    </div>
                </div>

                {/* Probabilistic Scenarios */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-bg-primary/50 p-4 rounded-3xl border border-border/5 text-center">
                        <p className="text-[8px] font-black uppercase opacity-40 mb-1">Pessimiste</p>
                        <p className="text-lg font-serif italic font-black text-error">{prediction.scenarios.pessimistic}j</p>
                    </div>
                    <div className="bg-bg-primary/80 p-4 rounded-3xl border border-accent-gold/20 text-center scale-110 shadow-xl">
                        <p className="text-[8px] font-black uppercase text-accent-gold mb-1">Médian (P50)</p>
                        <p className="text-xl font-serif italic font-black text-text-primary">{prediction.scenarios.p50}j</p>
                    </div>
                    <div className="bg-bg-primary/50 p-4 rounded-3xl border border-border/5 text-center">
                        <p className="text-[8px] font-black uppercase opacity-40 mb-1">Optimiste</p>
                        <p className="text-lg font-serif italic font-black text-success">{prediction.scenarios.optimistic}j</p>
                    </div>
                </div>

                {/* Meta Data: Confidence & Trend */}
                <div className="flex items-center justify-between pt-2 px-2 border-t border-border/10">
                    <div className="flex items-center gap-2">
                        {trendIcon}
                        <span className="text-[9px] font-black uppercase tracking-wider text-text-muted">Tendance {prediction.trend}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-accent-gold opacity-60" />
                        <span className="text-[9px] font-black uppercase tracking-wider text-text-muted">Confiance {(prediction.confidence * 100).toFixed(0)}%</span>
                    </div>
                </div>
                
                {prediction.riskLevel === 'HIGH' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-2xl bg-error/10 border border-error/20 flex items-center gap-4"
                    >
                        <AlertTriangle className="w-5 h-5 text-error shrink-0" />
                        <p className="text-[10px] font-medium text-error leading-relaxed">
                            Rupture critique imminente pour <strong>{itemName}</strong>. Réapprovisionnement suggéré sous 24h.
                        </p>
                    </motion.div>
                )}
            </div>
        </PremiumCard>
    );
};
