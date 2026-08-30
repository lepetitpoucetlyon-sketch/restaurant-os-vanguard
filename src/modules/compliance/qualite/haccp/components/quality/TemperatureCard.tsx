// @wip owner:compliance-team échéance:2026-Q4 — écran HACCP à intégrer dans le flow qualité (audit orphelins 2026-08-30)
import React from 'react';
import { AlertCircle, CheckCircle2, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';

interface TemperatureCardProps {
    label: string;
    current: number;
    target: { min: number; max: number };
    editable?: boolean;
    onChange?: (value: number) => void;
}

export const TemperatureCard: React.FC<TemperatureCardProps> = ({ 
    label, 
    current, 
    target, 
    editable = false,
    onChange 
}) => {
    const isCompliant = current >= target.min && current <= target.max;
    // Calculate progress relative to target range plus a little buffer
    const buffer = 5;
    const rangeMin = target.min - buffer;
    const rangeMax = target.max + buffer;
    const progress = Math.min(Math.max(((current - rangeMin) / (rangeMax - rangeMin)) * 100, 0), 100);

    const handleIncrement = () => onChange?.(Number((current + 0.1).toFixed(1)));
    const handleDecrement = () => onChange?.(Number((current - 0.1).toFixed(1)));

    return (
        <div className={cn(
            "bg-surface-card p-6 rounded-[2rem] border transition-all duration-300 shadow-sm",
            isCompliant ? "border-subtle" : "border-rose-200 bg-status-danger/20 shadow-lg shadow-rose-500/5"
        )}>
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <p className="text-nano font-black text-muted uppercase tracking-widest mb-1">{label}</p>
                    <div className="flex items-center gap-4">
                        <h4 className={cn(
                            "text-3xl font-black font-mono tracking-tighter",
                            !isCompliant && "text-status-danger"
                        )}>
                            {current > 0 ? '+' : ''}{current.toFixed(1)}<span className="text-sm font-normal ml-0.5 opacity-40">°C</span>
                        </h4>
                        
                        {editable && (
                            <div className="flex flex-col gap-1">
                                <button aria-label="Réduire" 
                                    onClick={handleIncrement}
                                    className="p-1 hover:bg-surface-tertiary rounded-lg text-muted hover:text-primary transition-colors"
                                >
                                    <ChevronUp className="w-4 h-4" />
                                </button>
                                <button aria-label="Développer" 
                                    onClick={handleDecrement}
                                    className="p-1 hover:bg-surface-tertiary rounded-lg text-muted hover:text-primary transition-colors"
                                >
                                    <ChevronDown className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm",
                    isCompliant ? "bg-status-success text-status-success border border-emerald-100" : "bg-status-danger text-text-primary shadow-lg shadow-rose-500/20"
                )}>
                    {isCompliant ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                </div>
            </div>
            
            <div className="h-3 w-full bg-surface-tertiary rounded-full overflow-hidden relative mb-4">
                {/* Target Range Indicator */}
                <div 
                    className="absolute h-full bg-surface-bg/50"
                    style={{ 
                        left: `${((target.min - rangeMin) / (rangeMax - rangeMin)) * 100}%`,
                        width: `${((target.max - target.min) / (rangeMax - rangeMin)) * 100}%`
                    }}
                />
                <div 
                    className={cn("h-full transition-all duration-500 relative z-10", isCompliant ? "bg-status-success" : "bg-status-danger")}
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="flex justify-between items-center text-nano font-black text-muted uppercase tracking-widest px-1">
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-surface-tertiary" />
                    Target: {target.min}°C à {target.max}°C
                </div>
                {!isCompliant && (
                    <span className="text-status-danger animate-pulse">Hors Seuil HACCP</span>
                )}
            </div>
        </div>
    );
};
