import React, { useEffect, useState } from 'react';
import { PremiumCard } from '@design/ui/PremiumCard';
import { Nexus } from '@/lib/nexus/NexusAdapter';

interface PaySlipViewerProps {
    employeeId: string;
    tenantId: string;
}

interface PaySlip {
    id: string;
    month: string;
    netInCents: number;
    status: string;
}

/**
 * 💶 C5.2: PaySlip Viewer - Lecture seule pour l'employé
 */
export function PaySlipViewer({ employeeId, tenantId }: PaySlipViewerProps) {
    const [payslips, setPayslips] = useState<PaySlip[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPayslips() {
            try {
                const data = await Nexus.adapter.get<Record<string, PaySlip>>(
                    `tenants/${tenantId}/hr/employees/${employeeId}/payslips`
                );
                if (data) {
                    setPayslips(Object.values(data));
                }
            } catch (err) {
                console.error("Failed to fetch payslips", err);
            } finally {
                setLoading(false);
            }
        }
        fetchPayslips();
    }, [employeeId, tenantId]);

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-text-primary mb-6">Mes Bulletins de Paie</h2>
            
            {loading ? (
                <div className="text-center py-4 text-text-muted">Chargement de vos bulletins...</div>
            ) : payslips.length === 0 ? (
                <div className="text-center py-4 text-text-muted">Aucun bulletin disponible.</div>
            ) : (
                payslips.map(ps => (
                    <PremiumCard key={ps.id} variant="glass" glowColor="none" className="flex items-center justify-between">
                        <div>
                            <p className="font-bold text-lg">{ps.month}</p>
                            <p className="text-sm text-status-success uppercase font-black tracking-widest mt-1">
                                {ps.status}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="font-serif text-2xl text-accent">€ {(ps.netInCents / 100).toFixed(2)}</p>
                            <button className="text-sm text-brand underline mt-2 hover:text-white">
                                Télécharger PDF
                            </button>
                        </div>
                    </PremiumCard>
                ))
            )}

            <p className="text-xs text-text-muted mt-8 italic text-center">
                Conformément à la réglementation RGPD, vos bulletins sont scellés et inaltérables.
            </p>
        </div>
    );
}
