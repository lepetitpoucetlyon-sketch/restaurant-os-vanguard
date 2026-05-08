import React from 'react';
import { FileText, Download, ShieldCheck } from 'lucide-react';
import { Button } from '@ui/button';

export const SanitaryReport: React.FC = () => {
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
                    <span className="font-bold">142</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Taux de Conformité</span>
                    <span className="font-bold text-success">98.2%</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Alertes Critiques</span>
                    <span className="font-bold text-error">2</span>
                </div>
            </div>

            <Button className="w-full bg-surface-sidebar text-white rounded-xl py-6 font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Télécharger le PDF Certifié
            </Button>
        </div>
    );
};
