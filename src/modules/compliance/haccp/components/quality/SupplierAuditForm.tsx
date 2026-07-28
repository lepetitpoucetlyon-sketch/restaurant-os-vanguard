import React from 'react';
import { ClipboardCheck, Star, ShieldAlert } from 'lucide-react';
import { Button } from '@ui/button';

export const SupplierAuditForm: React.FC = () => {
    return (
        <div className="bg-surface-card rounded-[2rem] p-8 border border-subtle shadow-xl overflow-hidden relative">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-surface-sidebar text-text-primary flex items-center justify-center">
                    <ClipboardCheck className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-lg font-bold">Audit Fournisseur Annuel</h3>
                    <p className="text-xs text-muted font-medium">Certification Grade VI - Conformité NF525</p>
                </div>
            </div>

            <div className="space-y-6">
                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 block">Ponctualité & Livraison</label>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className="w-5 h-5 text-accent-gold fill-accent-gold" />
                        ))}
                    </div>
                </div>

                <div className="p-4 bg-status-danger border border-rose-100 rounded-2xl flex items-center gap-4">
                    <ShieldAlert className="w-5 h-5 text-status-danger" />
                    <div>
                        <p className="text-[10px] font-black text-status-danger uppercase">Attention</p>
                        <p className="text-xs text-status-danger font-medium">Dernier audit : 12/2025. Renouvellement imminent.</p>
                    </div>
                </div>
            </div>

            <Button className="w-full mt-8 bg-surface-sidebar text-text-primary py-4 rounded-xl font-bold uppercase text-[10px] tracking-widest">
                Lancer l'Audit de Certification
            </Button>
        </div>
    );
};
