import React from 'react';
import { Tag, Printer } from 'lucide-react';
import { Button } from '@ui/button';

export const BatchLabelGenerator: React.FC = () => {
    return (
        <div className="p-6 bg-surface-card dark:bg-bg-secondary rounded-[2rem] border border-border">
            <div className="flex items-center gap-3 mb-6">
                <Tag className="w-5 h-5 text-accent-gold" />
                <h3 className="font-bold font-serif italic">Générateur d'Étiquettes Traçabilité</h3>
            </div>
            <div className="p-4 bg-bg-tertiary rounded-xl border border-border mb-6">
                <p className="text-[10px] font-mono text-text-muted">Prêt pour l'impression (Zebra/Dymo)</p>
            </div>
            <Button className="w-full bg-accent-gold text-text-primary font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                <Printer className="w-4 h-4" /> Imprimer les Étiquettes
            </Button>
        </div>
    );
};
