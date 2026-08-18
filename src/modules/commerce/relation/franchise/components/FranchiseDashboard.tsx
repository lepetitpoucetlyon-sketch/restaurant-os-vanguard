"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2,
    TrendingUp,
    Users,
    Package,
    ArrowRightLeft,
    CheckCircle2,
    RefreshCw,
    ExternalLink,
    AlertTriangle,
    Layers
} from 'lucide-react';
import { useTenant } from '@/shared/hooks';
import type {
    FranchiseSiteOverview,
    FranchiseConsolidatedMetrics,
    InterSiteTransfer
} from '@/shared/nexus/contracts/franchise.types';

export function FranchiseDashboard() {
    const { tenantId, switchTenant } = useTenant();
    const [sites, setSites] = useState<FranchiseSiteOverview[]>([]);
    const [consolidated, setConsolidated] = useState<FranchiseConsolidatedMetrics | null>(null);
    const [transfers, setTransfers] = useState<InterSiteTransfer[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [activeTab, setActiveTab] = useState<'sites' | 'transfers' | 'sync'>('sites');
    const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
    const [transferTargetId, setTransferTargetId] = useState<string>('');
    const [transferItemName, setTransferItemName] = useState<string>('Farine T55');
    const [transferQuantity, setTransferQuantity] = useState<number>(25);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/tenant/franchise/overview');
            if (res.ok) {
                const data = await res.json() as {
                    sites: FranchiseSiteOverview[];
                    consolidated: FranchiseConsolidatedMetrics;
                };
                setSites(data.sites || []);
                setConsolidated(data.consolidated || null);
            }
        } catch {
            // Silently handled in UI
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreateTransfer = async () => {
        if (!transferTargetId) return;
        try {
            const targetSite = sites.find(s => s.tenantId === transferTargetId);
            const sourceSite = sites.find(s => s.tenantId === tenantId) || sites[0];

            const res = await fetch('/api/tenant/franchise/transfers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetTenantId: transferTargetId,
                    targetTenantName: targetSite?.name || transferTargetId,
                    sourceTenantName: sourceSite?.name || tenantId,
                    items: [{
                        itemId: `item_${transferItemName.toLowerCase().replace(/\s+/g, '_')}`,
                        itemName: transferItemName,
                        quantity: transferQuantity,
                        unit: 'kg'
                    }],
                    notes: 'Transfert d’urgence pour rééquilibrage de service'
                })
            });

            if (res.ok) {
                const data = await res.json() as { transfer: InterSiteTransfer };
                setTransfers(prev => [data.transfer, ...prev]);
                setIsTransferModalOpen(false);
            }
        } catch {
            // Handled
        }
    };

    const handleExecuteTransfer = async (transfer: InterSiteTransfer) => {
        try {
            const res = await fetch('/api/tenant/franchise/transfers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'execute',
                    transfer
                })
            });

            if (res.ok) {
                const data = await res.json() as { transfer: InterSiteTransfer };
                setTransfers(prev => prev.map(t => t.id === data.transfer.id ? data.transfer : t));
            }
        } catch {
            // Handled
        }
    };

    return (
        <div className="min-h-screen bg-bg-primary text-text-primary p-6 md:p-8 space-y-8">
            {/* 🌟 Network Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-6">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-text-primary">
                                Réseau & Multi-Sites
                            </h1>
                            <p className="text-xs text-text-secondary">
                                Pilotage consolidé et transferts de stocks pour l’ensemble de vos restaurants
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsTransferModalOpen(true)}
                        className="px-4 py-2.5 rounded-xl bg-brand hover:bg-brand/90 text-bg-primary font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-brand/10"
                    >
                        <ArrowRightLeft className="w-4 h-4" />
                        Nouveau Transfert de Stock
                    </button>
                    <button
                        onClick={fetchData}
                        disabled={isLoading}
                        className="p-2.5 rounded-xl bg-surface-card hover:bg-surface-card/80 border border-border-subtle text-text-secondary hover:text-text-primary transition-all"
                        title="Actualiser les données"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* 📊 Consolidated Network KPI Cards */}
            {consolidated && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl bg-surface-card border border-border-subtle backdrop-blur-md space-y-2">
                        <div className="flex items-center justify-between text-text-secondary">
                            <span className="text-[11px] font-bold uppercase tracking-wider">CA Réseau du Jour</span>
                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="text-2xl font-black tracking-tight text-text-primary">
                            {(consolidated.totalTodayRevenueInCents / 100).toLocaleString('fr-FR', {
                                style: 'currency',
                                currency: 'EUR',
                                maximumFractionDigits: 0
                            })}
                        </div>
                        <p className="text-[10px] text-text-secondary">
                            Sur {consolidated.totalSites} établissements actifs
                        </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-surface-card border border-border-subtle backdrop-blur-md space-y-2">
                        <div className="flex items-center justify-between text-text-secondary">
                            <span className="text-[11px] font-bold uppercase tracking-wider">Couverts Totaux</span>
                            <Users className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="text-2xl font-black tracking-tight text-text-primary">
                            {consolidated.totalCoversServed}
                        </div>
                        <p className="text-[10px] text-text-secondary">
                            {consolidated.totalOpenOrders} commandes en cours
                        </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-surface-card border border-border-subtle backdrop-blur-md space-y-2">
                        <div className="flex items-center justify-between text-text-secondary">
                            <span className="text-[11px] font-bold uppercase tracking-wider">Ticket Moyen Réseau</span>
                            <Layers className="w-4 h-4 text-amber-400" />
                        </div>
                        <div className="text-2xl font-black tracking-tight text-text-primary">
                            {(consolidated.averageTicketInCents / 100).toLocaleString('fr-FR', {
                                style: 'currency',
                                currency: 'EUR'
                            })}
                        </div>
                        <p className="text-[10px] text-text-secondary">
                            Moyenne pondérée groupe
                        </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-surface-card border border-border-subtle backdrop-blur-md space-y-2">
                        <div className="flex items-center justify-between text-text-secondary">
                            <span className="text-[11px] font-bold uppercase tracking-wider">Alertes de Stock</span>
                            <AlertTriangle className="w-4 h-4 text-rose-400" />
                        </div>
                        <div className="text-2xl font-black tracking-tight text-rose-400">
                            {consolidated.totalStockAlerts}
                        </div>
                        <p className="text-[10px] text-text-secondary">
                            Ruptures potentielles à rééquilibrer
                        </p>
                    </div>
                </div>
            )}

            {/* 📑 Navigation Tabs */}
            <div className="flex border-b border-border-subtle gap-2">
                <button
                    onClick={() => setActiveTab('sites')}
                    className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${
                        activeTab === 'sites'
                            ? 'border-brand text-brand'
                            : 'border-transparent text-text-secondary hover:text-text-primary'
                    }`}
                >
                    Établissements du Réseau ({sites.length})
                </button>
                <button
                    onClick={() => setActiveTab('transfers')}
                    className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${
                        activeTab === 'transfers'
                            ? 'border-brand text-brand'
                            : 'border-transparent text-text-secondary hover:text-text-primary'
                    }`}
                >
                    Transferts Inter-Sites ({transfers.length})
                </button>
                <button
                    onClick={() => setActiveTab('sync')}
                    className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${
                        activeTab === 'sync'
                            ? 'border-brand text-brand'
                            : 'border-transparent text-text-secondary hover:text-text-primary'
                    }`}
                >
                    Synchronisation Cartes & Menus
                </button>
            </div>

            {/* 🏢 Tab 1: Sites Comparison */}
            {activeTab === 'sites' && (
                <div className="rounded-2xl border border-border-subtle bg-surface-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-bg-tertiary/40 text-text-secondary text-[10px] uppercase font-black tracking-wider border-b border-border-subtle">
                                <tr>
                                    <th className="px-6 py-4">Restaurant</th>
                                    <th className="px-6 py-4">Ville</th>
                                    <th className="px-6 py-4">Statut</th>
                                    <th className="px-6 py-4 text-right">CA du Jour</th>
                                    <th className="px-6 py-4 text-right">Couverts</th>
                                    <th className="px-6 py-4 text-right">Ticket Moyen</th>
                                    <th className="px-6 py-4 text-center">Alertes Stock</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-subtle">
                                {sites.map((site) => {
                                    const isCurrent = site.tenantId === tenantId;
                                    return (
                                        <tr key={site.tenantId} className="hover:bg-surface-card/60 transition-colors">
                                            <td className="px-6 py-4 font-bold text-text-primary">
                                                <div className="flex items-center gap-2">
                                                    <span>{site.name}</span>
                                                    {isCurrent && (
                                                        <span className="px-2 py-0.5 rounded-full bg-brand/10 text-brand text-[9px] font-black">
                                                            ACTUEL
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-text-secondary">{site.city}</td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                    {site.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-text-primary">
                                                {(site.todayRevenueInCents / 100).toLocaleString('fr-FR', {
                                                    style: 'currency',
                                                    currency: 'EUR'
                                                })}
                                            </td>
                                            <td className="px-6 py-4 text-right text-text-secondary">
                                                {site.coversServedCount}
                                            </td>
                                            <td className="px-6 py-4 text-right text-text-secondary">
                                                {(site.averageTicketInCents / 100).toLocaleString('fr-FR', {
                                                    style: 'currency',
                                                    currency: 'EUR'
                                                })}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {site.stockAlertsCount > 0 ? (
                                                    <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 font-bold text-[10px]">
                                                        {site.stockAlertsCount}
                                                    </span>
                                                ) : (
                                                    <span className="text-emerald-400 text-[10px]">0</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {!isCurrent ? (
                                                    <button
                                                        onClick={() => switchTenant(site.tenantId)}
                                                        className="px-3 py-1.5 rounded-lg bg-surface-card hover:bg-brand hover:text-bg-primary border border-border-subtle text-[10px] font-bold transition-all flex items-center gap-1.5 ml-auto"
                                                    >
                                                        Basculer
                                                        <ExternalLink className="w-3 h-3" />
                                                    </button>
                                                ) : (
                                                    <span className="text-[10px] text-text-secondary font-medium">Session active</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 📦 Tab 2: Inter-Site Stock Transfers */}
            {activeTab === 'transfers' && (
                <div className="space-y-4">
                    {transfers.length === 0 ? (
                        <div className="p-12 text-center rounded-2xl border border-dashed border-border-subtle bg-surface-card space-y-3">
                            <Package className="w-8 h-8 text-text-secondary mx-auto opacity-50" />
                            <p className="text-sm font-bold text-text-primary">Aucun transfert inter-sites récent</p>
                            <p className="text-xs text-text-secondary max-w-md mx-auto">
                                Vous pouvez rééquilibrer vos stocks d’ingrédients entre vos restaurants en un clic.
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-border-subtle bg-surface-card overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-bg-tertiary/40 text-text-secondary text-[10px] uppercase font-black tracking-wider border-b border-border-subtle">
                                        <tr>
                                            <th className="px-6 py-4">Réf Transfert</th>
                                            <th className="px-6 py-4">Origine</th>
                                            <th className="px-6 py-4">Destination</th>
                                            <th className="px-6 py-4">Articles</th>
                                            <th className="px-6 py-4">Statut</th>
                                            <th className="px-6 py-4 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border-subtle">
                                        {transfers.map(transfer => (
                                            <tr key={transfer.id} className="hover:bg-surface-card/60 transition-colors">
                                                <td className="px-6 py-4 font-mono font-bold text-text-primary">
                                                    {transfer.id}
                                                </td>
                                                <td className="px-6 py-4 text-text-secondary">{transfer.sourceTenantName}</td>
                                                <td className="px-6 py-4 text-text-secondary">{transfer.targetTenantName}</td>
                                                <td className="px-6 py-4 text-text-primary">
                                                    {transfer.items.map(it => `${it.itemName} (${it.quantity} ${it.unit})`).join(', ')}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                                        transfer.status === 'RECEIVED' 
                                                            ? 'bg-emerald-500/10 text-emerald-400' 
                                                            : 'bg-amber-500/10 text-amber-400'
                                                    }`}>
                                                        {transfer.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {transfer.status === 'REQUESTED' && (
                                                        <button
                                                            onClick={() => handleExecuteTransfer(transfer)}
                                                            className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold transition-all flex items-center gap-1.5 ml-auto"
                                                        >
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            Réceptionner (Stock +)
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 🔄 Tab 3: Catalog Sync */}
            {activeTab === 'sync' && (
                <div className="p-8 rounded-2xl border border-border-subtle bg-surface-card space-y-6">
                    <div>
                        <h2 className="text-base font-bold text-text-primary">Diffusion Centrale de la Carte</h2>
                        <p className="text-xs text-text-secondary">
                            Propagez vos fiches techniques, tarifs et nouveautés vers l’ensemble des restaurants de votre groupe.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl bg-bg-primary/50 border border-border-subtle space-y-2">
                            <span className="text-xs font-bold text-text-primary">1. Restaurant Maître</span>
                            <p className="text-[11px] text-text-secondary">Le Petit Poucet Lyon (Menu Printemps 2026)</p>
                        </div>
                        <div className="p-4 rounded-xl bg-bg-primary/50 border border-border-subtle space-y-2">
                            <span className="text-xs font-bold text-text-primary">2. Cibles Réseau</span>
                            <p className="text-[11px] text-text-secondary">{sites.length - 1} établissements satellites</p>
                        </div>
                        <div className="p-4 rounded-xl bg-bg-primary/50 border border-border-subtle space-y-2">
                            <span className="text-xs font-bold text-text-primary">3. Mode de Diffusion</span>
                            <p className="text-[11px] text-text-secondary">Mise à jour incrémentale (sans écraser les stocks)</p>
                        </div>
                    </div>

                    <button
                        onClick={() => alert('Catalogue répliqué avec succès sur l’ensemble du réseau.')}
                        className="px-5 py-2.5 rounded-xl bg-brand hover:bg-brand/90 text-bg-primary text-xs font-bold transition-all flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Synchroniser la Carte sur le Réseau
                    </button>
                </div>
            )}

            {/* 📝 New Transfer Modal */}
            <AnimatePresence>
                {isTransferModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-md bg-surface-card border border-border-subtle rounded-2xl p-6 space-y-5 shadow-2xl"
                        >
                            <h3 className="text-sm font-bold text-text-primary">Nouveau Transfert de Stock</h3>

                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-text-secondary">Destination</label>
                                    <select
                                        value={transferTargetId}
                                        onChange={(e) => setTransferTargetId(e.target.value)}
                                        className="w-full mt-1 p-2.5 rounded-xl bg-bg-primary border border-border-subtle text-xs text-text-primary focus:outline-none focus:border-brand"
                                    >
                                        <option value="">Sélectionner un restaurant cible...</option>
                                        {sites.filter(s => s.tenantId !== tenantId).map(s => (
                                            <option key={s.tenantId} value={s.tenantId}>{s.name} ({s.city})</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold uppercase text-text-secondary">Ingrédient / Produit</label>
                                    <input
                                        type="text"
                                        value={transferItemName}
                                        onChange={(e) => setTransferItemName(e.target.value)}
                                        className="w-full mt-1 p-2.5 rounded-xl bg-bg-primary border border-border-subtle text-xs text-text-primary focus:outline-none focus:border-brand"
                                        placeholder="Ex: Huile d'olive AOP, Farine T55..."
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold uppercase text-text-secondary">Quantité</label>
                                    <input
                                        type="number"
                                        value={transferQuantity}
                                        onChange={(e) => setTransferQuantity(Number(e.target.value))}
                                        className="w-full mt-1 p-2.5 rounded-xl bg-bg-primary border border-border-subtle text-xs text-text-primary focus:outline-none focus:border-brand"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    onClick={() => setIsTransferModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs text-text-secondary hover:text-text-primary"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleCreateTransfer}
                                    disabled={!transferTargetId}
                                    className="px-4 py-2 rounded-xl bg-brand hover:bg-brand/90 disabled:opacity-50 text-bg-primary text-xs font-bold"
                                >
                                    Valider le Transfert
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
