import React from 'react';
import { 
    Check, 
    X, 
    ShieldCheck, 
    CircleDot,
    Waves,
    Wind,
    PackageSearch,
    Truck
} from 'lucide-react';
import { cn } from '@/lib/ui.foundations';
import { useQuality } from '../../hooks/useQuality';
import type { QualityControl } from '../../../../types/quality';

export const VisualInspection: React.FC = () => {
    const { activeControl, setActiveControl: updateControl } = useQuality();
    const conditions = activeControl?.delivery_conditions;

    const criteria = [
        { 
            key: 'vehicle_cleanliness', 
            label: 'Hygiène Véhicule', 
            icon: <Truck className="w-4 h-4" />,
            status: conditions?.vehicle_cleanliness === 'clean' ? 'pass' : 'fail' 
        },
        { 
            key: 'packaging_integrity', 
            label: 'Intégrité Colis', 
            icon: <PackageSearch className="w-4 h-4" />,
            status: conditions?.packaging_integrity === 'intact' ? 'pass' : 'fail' 
        },
        { 
            key: 'color_aspect', 
            label: 'Aspect / Couleur', 
            icon: <CircleDot className="w-4 h-4" />,
            status: activeControl?.color_aspect !== false ? 'pass' : 'fail' 
        },
        { 
            key: 'texture_aspect', 
            label: 'Texture / Fermeté', 
            icon: <Waves className="w-4 h-4" />,
            status: activeControl?.texture_aspect !== false ? 'pass' : 'fail' 
        },
        { 
            key: 'odor_aspect', 
            label: 'Odeur / Fraîcheur', 
            icon: <Wind className="w-4 h-4" />,
            status: activeControl?.odor_aspect !== false ? 'pass' : 'fail' 
        },
    ];

    const handleToggle = (key: string, currentStatus: string) => {
        if (!activeControl) return;
        
        // Handle delivery_conditions keys or root keys for simulation
        if (['vehicle_cleanliness', 'packaging_integrity'].includes(key)) {
            updateControl({
                ...activeControl,
                delivery_conditions: {
                    ...activeControl.delivery_conditions,
                    [key]: currentStatus === 'pass' ? 'dirty' : 'clean'
                }
            });
        } else {
            updateControl({
                ...activeControl,
                [key as keyof QualityControl]: currentStatus !== 'pass'
            });
        }
    };

    return (
        <div className="bg-surface-card rounded-[3rem] p-10 border border-subtle shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-5">
                <ShieldCheck className="w-32 h-32" />
            </div>

            <div className="flex items-center gap-4 mb-10 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-surface-sidebar text-text-primary flex items-center justify-center shadow-lg shadow-slate-900/20">
                    <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-xl font-serif font-black italic tracking-tight">Audit Sensoriel</h3>
                    <p className="text-[10px] font-black text-muted uppercase tracking-widest">Contrôle Organoleptique Grade VI</p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 relative z-10">
                {criteria.map((c) => (
                    <button 
                        key={c.key} 
                        onClick={() => handleToggle(c.key, c.status)}
                        className={cn(
                            "group p-6 rounded-[2rem] flex items-center justify-between border transition-all duration-300 active:scale-95",
                            c.status === 'pass' 
                                ? "bg-surface-card border-subtle hover:border-emerald-200 hover:bg-status-success/20" 
                                : "bg-status-danger/30 border-rose-100 hover:border-rose-200"
                        )}
                    >
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-inner",
                                c.status === 'pass' ? "bg-surface-bg text-muted group-hover:text-status-success" : "bg-status-danger text-status-danger"
                            )}>
                                {c.icon}
                            </div>
                            <span className="text-xs font-black uppercase text-primary tracking-wider font-sans">{c.label}</span>
                        </div>
                        
                        <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center shadow-md transition-all",
                            c.status === 'pass' 
                                ? "bg-status-success text-text-primary" 
                                : "bg-status-danger text-text-primary shadow-rose-500/30"
                        )}>
                            {c.status === 'pass' ? <Check className="w-6 h-6" /> : <X className="w-6 h-6" />}
                        </div>
                    </button>
                ))}
            </div>

            <div className="mt-8 p-6 bg-surface-bg rounded-2xl flex items-start gap-4">
                <div className="mt-0.5 text-status-warning">
                    <CircleDot className="w-4 h-4" />
                </div>
                <p className="text-[10px] font-bold text-secondary uppercase leading-relaxed tracking-widest">
                    Les critères sensoriels sont obligatoires pour la certification de fraîcheur. 
                    Un échec sur 2 critères entraîne un rejet automatique du lot.
                </p>
            </div>
        </div>
    );
};
