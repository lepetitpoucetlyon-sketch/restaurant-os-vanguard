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
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-accent-gold/10 border border-accent-gold/20 flex items-center justify-center text-accent-gold">
                        <Building2 className="w-6 h-6" />
                    </div>
                    <div className="space-y-1.5">
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.32em]">
                            Réseau Multi-Sites
                        </p>
                        <h1 className="text-3xl md:text-[34px] font-serif font-black italic text-text-primary tracking-tight leading-none">
                            Empire<span className="text-accent-gold not-italic">.</span>
                        </h1>
                        <p className="text-xs text-text-secondary">
                            Pilotage consolidé et transferts de stocks pour l&apos;ensemble de vos restaurants.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="h-11 px-5 rounded-xl bg-accent-gold hover:bg-accent-gold/90 text-text-on-primary font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-accent-gold/20 hover:-translate-y-0.5"
                    >
                        <ArrowRightLeft className="w-4 h-4" />
                        Nouveau Transfert
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
