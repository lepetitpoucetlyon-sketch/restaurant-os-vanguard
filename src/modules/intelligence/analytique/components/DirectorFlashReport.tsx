import React, { useEffect, useState } from 'react';
import { DailyFlashReport, DailyConsolidationService } from '../services/DailyConsolidationService';
import { useTenant } from '@/shared/providers/NexusCoreProvider';
import { formatCurrency } from '@/lib/formatters';
import { PremiumCard, StatCard, PageHeader } from '@/shared/components/ui';
import { logger } from '@/lib/logger';

/**
 * ☕ C4.4: Director Flash Report (Le "café du matin")
 * Vue analytique condensée poussée sur le mobile du directeur.
 */
export const DirectorFlashReport: React.FC = () => {
    const { activeTenantId } = useTenant();
    const [report, setReport] = useState<DailyFlashReport | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchReport = async () => {
            if (!activeTenantId) return;
            try {
                // Pour l'exemple, on charge la veille
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const dateStr = yesterday.toISOString().slice(0, 10);
                
                const data = await DailyConsolidationService.generateFlashReport(activeTenantId, dateStr);
                setReport(data);
            } catch (e) {
                logger.error('[DirectorFlashReport] Échec du chargement', e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReport();
    }, [activeTenantId]);

    if (isLoading) {
        return <div className="p-8 text-center text-text-secondary animate-pulse">Génération du Flash Report...</div>;
    }

    if (!report) {
        return <div className="p-8 text-center text-red-500">Impossible de charger le rapport.</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
            <PageHeader 
                title={`Flash Report du ${report.date}`}
                subtitle="Synthèse exécutive de la journée précédente"
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    label="Chiffre d'Affaires"
                    value={formatCurrency((report.totalRevenueInMicrounits ?? (report.totalRevenueInCents * 10_000)) / 1_000_000)}
                    trend={{ value: 12, direction: 'up' }}
                />
                <StatCard
                    label="Couverts"
                    value={report.totalCovers.toString()}
                />
                <StatCard
                    label="Ticket Moyen"
                    value={formatCurrency((report.averageTicketInMicrounits ?? (report.averageTicketInCents * 10_000)) / 1_000_000)}
                />
                <StatCard
                    label="Incidents Sécurité"
                    value={report.incidentsCount.toString()}
                    trend={{ value: report.incidentsCount, direction: report.incidentsCount === 0 ? 'up' : 'down' }}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <PremiumCard title="Ratios Opérationnels (Masse Salariale / Food Cost)">
                    <div className="space-y-6 mt-4">
                        <div>
                            <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium text-text-secondary">Labor Cost (RH)</span>
                                <span className={`text-sm font-bold ${report.laborCostPercentage > 35 ? 'text-red-500' : 'text-green-500'}`}>
                                    {report.laborCostPercentage}%
                                </span>
                            </div>
                            <div className="w-full bg-bg-secondary rounded-full h-2">
                                <div 
                                    className={`h-2 rounded-full ${report.laborCostPercentage > 35 ? 'bg-red-500' : 'bg-green-500'}`} 
                                    style={{ width: `${Math.min(report.laborCostPercentage, 100)}%` }}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium text-text-secondary">Food Cost (Matière)</span>
                                <span className={`text-sm font-bold ${report.foodCostPercentage > 30 ? 'text-red-500' : 'text-green-500'}`}>
                                    {report.foodCostPercentage}%
                                </span>
                            </div>
                            <div className="w-full bg-bg-secondary rounded-full h-2">
                                <div 
                                    className={`h-2 rounded-full ${report.foodCostPercentage > 30 ? 'bg-red-500' : 'bg-green-500'}`} 
                                    style={{ width: `${Math.min(report.foodCostPercentage, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </PremiumCard>

                <PremiumCard title="Top Ventes">
                    <ul className="divide-y divide-border mt-4">
                        {report.topSellingItems.map((item, idx) => (
                            <li key={idx} className="py-3 flex justify-between items-center">
                                <span className="text-text-primary font-medium">{item.name}</span>
                                <span className="text-accent font-bold">{item.quantity} x</span>
                            </li>
                        ))}
                    </ul>
                </PremiumCard>
            </div>
        </div>
    );
};
