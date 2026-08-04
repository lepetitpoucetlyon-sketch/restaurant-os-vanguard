import React from 'react';
import { 
    XOctagon, 
    AlertTriangle, 
    Truck, 
    Thermometer,
    ShieldCheck
} from 'lucide-react';
import type { QualityControl } from '../../../../types/quality';
import { cn } from '@/lib/ui.foundations';

interface ReceptionSummaryProps {
    control: Partial<QualityControl>;
}

export const ReceptionSummary: React.FC<ReceptionSummaryProps> = ({ control }) => {
    const stats = control.summary || {
        total_items: 0,
        items_accepted: 0,
        items_rejected: 0,
        temperature_issues: 0,
        visual_issues: 0,
        overall_status: 'pass'
    };

    const truckTemp = control.delivery_conditions?.vehicle_temperature?.measured;
    const isTruckTempCompliant = control.delivery_conditions?.vehicle_temperature?.compliant;

    return (
        <div className="space-y-8">
            {/* 🛸 GLOBAL STATUS BANNER */}
            <div className={cn(
                "p-10 rounded-[3rem] border flex flex-col items-center text-center gap-6 relative overflow-hidden",
                stats.overall_status === 'pass' 
                    ? "bg-status-success border-emerald-100 text-status-success" 
                    : "bg-status-danger border-rose-100 text-status-danger"
            )}>
                <div className={cn(
                    "w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-transform hover:scale-110 duration-500",
                    stats.overall_status === 'pass' ? "bg-status-success text-text-primary" : "bg-status-danger text-text-primary"
                )}>
                    {stats.overall_status === 'pass' ? <ShieldCheck className="w-10 h-10" /> : <XOctagon className="w-10 h-10" />}
                </div>
                
                <div>
                    <h2 className="text-3xl font-serif font-black italic tracking-tighter mb-2">
                        {stats.overall_status === 'pass' ? "Agréage Conforme" : "Non-Conformité Détectée"}
                    </h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">
                        {stats.items_accepted} / {stats.total_items} Lignes Validées • {stats.items_rejected} Rejets
                    </p>
                </div>
            </div>

            {/* 📊 KPI GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-surface-card p-6 rounded-[2rem] border border-subtle flex items-center gap-6 shadow-sm">
                    <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center",
                        isTruckTempCompliant ? "bg-status-success text-status-success" : "bg-status-danger text-status-danger"
                    )}>
                        <Truck className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Véhicule Logistique</p>
                        <p className="font-bold text-primary">
                            {truckTemp ? `${truckTemp}°C` : 'N/A'} • {isTruckTempCompliant ? 'CONFORME' : 'HORS NORMES'}
                        </p>
                    </div>
                </div>

                <div className="bg-surface-card p-6 rounded-[2rem] border border-subtle flex items-center gap-6 shadow-sm">
                    <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center",
                        stats.temperature_issues === 0 ? "bg-status-success text-status-success" : "bg-status-danger text-status-danger"
                    )}>
                        <Thermometer className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Items Thermiques</p>
                        <p className="font-bold text-primary">
                            {stats.temperature_issues} Alertes HACCP
                        </p>
                    </div>
                </div>
            </div>

            {/* 📝 CRITICAL OBSERVATIONS */}
            {(stats.items_rejected > 0 || stats.visual_issues > 0) && (
                <div className="p-8 rounded-[3rem] bg-surface-sidebar text-text-primary space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-text-primary/40 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-status-warning" />
                        Actions Correctives Requises
                    </h4>
                    <ul className="space-y-3">
                        {control.items?.filter(i => i.is_rejected).map(item => (
                            <li key={item.id} className="flex items-center gap-3 text-sm font-bold">
                                <div className="w-1.5 h-1.5 rounded-full bg-status-danger" />
                                {item.product_name} : {item.decision_reason || 'Rejeté pour non-conformité'}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};
