import React from 'react';
import { PremiumCard } from '@/shared/components/ui/PremiumCard';

interface PaySlipViewerProps {
    employeeId: string;
    tenantId: string;
}

/**
 * 💶 C5.2: PaySlip Viewer - Lecture seule pour l'employé
 */
export function PaySlipViewer({ employeeId, tenantId }: PaySlipViewerProps) {
    // Dans un cas réel, chargement via useQuery(`payslips/${tenantId}/${employeeId}`)
    const mockPayslips = [
        { id: 'ps-07-2026', month: 'Juillet 2026', net: 2450.50, status: 'scellé' },
        { id: 'ps-06-2026', month: 'Juin 2026', net: 2380.00, status: 'scellé' },
    ];

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-text-primary mb-6">Mes Bulletins de Paie</h2>
            
            {mockPayslips.map(ps => (
                <PremiumCard key={ps.id} variant="glass" glowColor="none" className="flex items-center justify-between">
                    <div>
                        <p className="font-bold text-lg">{ps.month}</p>
                        <p className="text-sm text-status-success uppercase font-black tracking-widest mt-1">
                            {ps.status}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="font-serif text-2xl text-accent">€ {ps.net.toFixed(2)}</p>
                        <button className="text-sm text-brand underline mt-2 hover:text-white">
                            Télécharger PDF
                        </button>
                    </div>
                </PremiumCard>
            ))}

            <p className="text-xs text-text-muted mt-8 italic text-center">
                Conformément à la réglementation RGPD, vos bulletins sont scellés et inaltérables.
            </p>
        </div>
    );
}
