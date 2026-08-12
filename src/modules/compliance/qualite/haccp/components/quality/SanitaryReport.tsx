import React from 'react';
import { Download, ShieldCheck } from 'lucide-react';
import { Button } from '@ui/button';
import { useHACCP } from '../../hooks/useHACCP';
import { toast } from 'sonner';
import { JsonObject } from "@/lib/types/json";

export const SanitaryReport: React.FC = () => {
    const { hygieneLabels, maintenanceLogs } = useHACCP();

    const totalControls = hygieneLabels.length + maintenanceLogs.length;
    const nonConformCount = hygieneLabels.filter(l => (l as JsonObject).isNonConform).length;
    const conformityRate = totalControls > 0 
        ? (( (totalControls - nonConformCount) / totalControls ) * 100).toFixed(1)
        : '100.0';

    const handleDownloadPDF = () => {
        toast.info('Génération du rapport d\'inspection sanitaire...');
        window.print();
    };

    return (
        <div className="p-8 bg-bg-secondary border border-border rounded-[2rem] shadow-xl">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h3 className="text-2xl font-serif font-black italic">Rapport Sanitaire Mensuel</h3>
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mt-1">Conformité HACCP • ISO 22000</p>
                </div>
                <div className="p-3 bg-success/10 text-success rounded-2xl">
                    <ShieldCheck className="w-6 h-6" />
                </div>
            </div>
            
            <div className="space-y-4 mb-8">
                <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Total Contrôles</span>
                    <span className="font-bold">{totalControls}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Taux de Conformité</span>
                    <span className="font-bold text-success">{conformityRate}%</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Alertes Critiques</span>
                    <span className="font-bold text-error">{nonConformCount}</span>
                </div>
            </div>

            <Button 
                onClick={handleDownloadPDF}
                className="w-full bg-surface-sidebar text-text-primary rounded-xl py-6 font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
            >
                <Download className="w-4 h-4" /> Télécharger le Rapport Certifié
            </Button>
        </div>
    );
};
