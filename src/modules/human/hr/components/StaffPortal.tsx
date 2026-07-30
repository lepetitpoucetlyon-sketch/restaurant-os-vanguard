import React, { useState } from 'react';
import { PremiumCard } from '@/shared/components/ui/PremiumCard';
import { StatCard, StatsGrid } from '@/shared/components/ui/StatCard';
import { ActionToolbar, ToolbarGroup } from '@/shared/components/ui/ActionToolbar';
import { PaySlipViewer } from './PaySlipViewer';

interface StaffPortalProps {
    employeeId: string;
    tenantId: string;
}

/**
 * 🧑‍💼 C5.2: Staff Portal - L'espace unique de l'employé (Mobile-first).
 */
export function StaffPortal({ employeeId, tenantId }: StaffPortalProps) {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'payslips' | 'schedule'>('dashboard');

    return (
        <div className="flex flex-col h-full bg-bg-primary text-text-primary p-4 md:p-8" aria-label="Portail Salarié">
            <ActionToolbar position="top" align="between" className="mb-6 rounded-2xl">
                <h1 className="text-2xl font-black tracking-tight text-accent">Mon Espace</h1>
                <ToolbarGroup gap="md">
                    <button 
                        onClick={() => setActiveTab('dashboard')}
                        className={`px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'dashboard' ? 'bg-accent/20 text-accent' : 'hover:bg-bg-secondary'}`}
                    >
                        Vue d'ensemble
                    </button>
                    <button 
                        onClick={() => setActiveTab('payslips')}
                        className={`px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'payslips' ? 'bg-accent/20 text-accent' : 'hover:bg-bg-secondary'}`}
                    >
                        Bulletins
                    </button>
                </ToolbarGroup>
            </ActionToolbar>

            {activeTab === 'dashboard' && (
                <div className="space-y-6">
                    <StatsGrid columns={2}>
                        <StatCard 
                            label="Solde Congés" 
                            value="14.5" 
                            emoji="🌴" 
                            accentColor="success" 
                        />
                        <StatCard 
                            label="Heures ce mois" 
                            value="112h" 
                            emoji="⏱️" 
                            accentColor="info" 
                        />
                        <StatCard 
                            label="Pourboires (Tronc)" 
                            value="€ 142.50" 
                            emoji="🪙" 
                            accentColor="warning" 
                            trend={{ value: 12, direction: 'up' }}
                        />
                    </StatsGrid>
                    
                    <PremiumCard variant="glass" glowColor="accent">
                        <h2 className="text-xl font-bold mb-4">Prochain Shift</h2>
                        <div className="bg-bg-secondary p-4 rounded-xl border border-border">
                            <p className="text-lg font-medium">Demain — 10:00 à 18:00</p>
                            <p className="text-text-muted text-sm mt-1">Poste : Chef de Rang (Salle Principale)</p>
                        </div>
                    </PremiumCard>
                </div>
            )}

            {activeTab === 'payslips' && (
                <div className="flex-1">
                    <PaySlipViewer employeeId={employeeId} tenantId={tenantId} />
                </div>
            )}
        </div>
    );
}
