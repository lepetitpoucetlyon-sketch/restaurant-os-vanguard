"use client";

import { useState } from 'react';
import { Building2, ArrowRightLeft, RefreshCw } from 'lucide-react';
import { useFranchiseData } from '../hooks/useFranchiseData';
import { FranchiseKPICards } from './_parts/FranchiseKPICards';
import { SitesTable } from './_parts/SitesTable';
import { TransfersTable } from './_parts/TransfersTable';
import { CatalogSyncPanel } from './_parts/CatalogSyncPanel';
import { NewTransferModal } from './_parts/NewTransferModal';

type Tab = 'sites' | 'transfers' | 'sync';

const TABS: { id: Tab; label: (n: number) => string }[] = [
    { id: 'sites', label: (n) => `Établissements du Réseau (${n})` },
    { id: 'transfers', label: (n) => `Transferts Inter-Sites (${n})` },
    { id: 'sync', label: () => 'Synchronisation Cartes & Menus' },
];

export function FranchiseDashboard() {
    const {
        sites,
        consolidated,
        transfers,
        isLoading,
        tenantId,
        switchTenant,
        refresh,
        createTransfer,
        executeTransfer,
    } = useFranchiseData();

    const [activeTab, setActiveTab] = useState<Tab>('sites');
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="min-h-screen bg-bg-primary text-text-primary p-6 md:p-8 space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
                        <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-text-primary">
                            Réseau &amp; Multi-Sites
                        </h1>
                        <p className="text-xs text-text-secondary">
                            Pilotage consolidé et transferts de stocks pour l’ensemble de vos restaurants
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-4 py-2.5 rounded-xl bg-brand hover:bg-brand/90 text-bg-primary font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-brand/10"
                    >
                        <ArrowRightLeft className="w-4 h-4" />
                        Nouveau Transfert de Stock
                    </button>
                    <button
                        onClick={refresh}
                        disabled={isLoading}
                        className="p-2.5 rounded-xl bg-surface-card hover:bg-surface-card/80 border border-border-subtle text-text-secondary hover:text-text-primary transition-all"
                        title="Actualiser les données"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </header>

            {consolidated && <FranchiseKPICards consolidated={consolidated} />}

            <div className="flex border-b border-border-subtle gap-2">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${
                            activeTab === tab.id
                                ? 'border-brand text-brand'
                                : 'border-transparent text-text-secondary hover:text-text-primary'
                        }`}
                    >
                        {tab.label(tab.id === 'sites' ? sites.length : transfers.length)}
                    </button>
                ))}
            </div>

            {activeTab === 'sites' && (
                <SitesTable sites={sites} currentTenantId={tenantId} onSwitchTenant={switchTenant} />
            )}
            {activeTab === 'transfers' && (
                <TransfersTable transfers={transfers} onExecute={executeTransfer} />
            )}
            {activeTab === 'sync' && <CatalogSyncPanel satelliteCount={Math.max(0, sites.length - 1)} />}

            <NewTransferModal
                open={isModalOpen}
                sites={sites}
                currentTenantId={tenantId}
                onClose={() => setIsModalOpen(false)}
                onSubmit={createTransfer}
            />
        </div>
    );
}
