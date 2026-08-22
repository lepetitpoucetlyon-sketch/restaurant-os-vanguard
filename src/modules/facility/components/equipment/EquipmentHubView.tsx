'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AnimatePresence } from 'framer-motion';
import {
  Wrench,
  Plus,
  Search,
  FileText,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import type {
  EquipmentAsset,
} from '../../assets/domain/schemas/equipment';
import { EquipmentAssetCard } from './EquipmentAssetCard';
import { AddEquipmentModal } from './AddEquipmentModal';
import { EquipmentDetailModal } from './EquipmentDetailModal';
import { FaultDiagnosticWizard } from './FaultDiagnosticWizard';
import { AddGuideModal } from './AddGuideModal';

interface EquipmentHubViewProps {
  tenantId: string;
}

export function EquipmentHubView({ tenantId }: EquipmentHubViewProps) {
  const [assets, setAssets] = useState<EquipmentAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [detailAsset, setDetailAsset] = useState<EquipmentAsset | null>(null);
  const [troubleshootAsset, setTroubleshootAsset] = useState<EquipmentAsset | null>(null);
  const [guideAsset, setGuideAsset] = useState<EquipmentAsset | null>(null);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/facility/equipment');
      if (res.ok) {
        const json = await res.json();
        setAssets(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching equipment assets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [tenantId]);

  // Filtrage
  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'ALL' || asset.category === selectedCategory;
    const matchesStatus = selectedStatus === 'ALL' || asset.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Calculs KPI
  const totalCount = assets.length;
  const operationalCount = assets.filter((a) => a.status === 'OPERATIONAL').length;
  const breakdownCount = assets.filter((a) => a.status === 'OUT_OF_ORDER' || a.status === 'DEGRADED').length;
  
  const totalValueEuros = assets.reduce((sum, a) => {
    return sum + (a.purchase?.purchasePriceInMicrounits ? a.purchase.purchasePriceInMicrounits / 1_000_000 : 0);
  }, 0);

  const expiringWarrantiesCount = assets.filter((a) => {
    if (!a.purchase?.warrantyExpiresAt) return false;
    const expiresMs = new Date(a.purchase.warrantyExpiresAt).getTime();
    const diffDays = (expiresMs - Date.now()) / (1000 * 60 * 60 * 24);
    return diffDays > 0 && diffDays <= 30;
  }).length;

  return (
    <div className="space-y-6">
      {/* ── Header & Titre ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              Pilier 8 • Facility & GMAO
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Gestion du Matériel, Factures & Tutos
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Inventaire 360° des machines, pièces comptables, guides de maintenance et dépannage interactif.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={fetchAssets}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <Link
            href="/settings?tab=maintenance"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors"
          >
            <Wrench className="w-4 h-4 text-amber-400" />
            <span>Alertes & Zones</span>
          </Link>

          <Link
            href="/settings?tab=onboarding-checklist"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Audit J-0</span>
          </Link>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter une machine</span>
          </button>
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Parc Matériel
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{totalCount}</span>
            <span className="text-xs text-slate-400">machines</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{totalCount > 0 ? Math.round((operationalCount / totalCount) * 100) : 100}% opérationnel</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Incidents / Pannes
          </span>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black ${breakdownCount > 0 ? 'text-rose-400' : 'text-white'}`}>
              {breakdownCount}
            </span>
            <span className="text-xs text-slate-400">en cours</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
            <AlertTriangle className={`w-3.5 h-3.5 ${breakdownCount > 0 ? 'text-rose-400' : 'text-slate-500'}`} />
            <span>{breakdownCount === 0 ? 'Aucune panne active' : 'Action immédiate requise'}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Valeur Parc HT
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400">
              {totalValueEuros.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>Factures enregistrées</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Garanties J-30
          </span>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black ${expiringWarrantiesCount > 0 ? 'text-amber-400' : 'text-white'}`}>
              {expiringWarrantiesCount}
            </span>
            <span className="text-xs text-slate-400">à renouveler</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Protection constructeur</span>
          </div>
        </div>
      </div>

      {/* ── Barre de Filtres & Recherche ───────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher nom, marque, S/N, lieu..."
            className="w-full pl-9.5 pr-4 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 text-xs"
          />
        </div>

        {/* Pilules Catégories */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 custom-scrollbar">
          {[
            { id: 'ALL', label: 'Toutes' },
            { id: 'COOKING', label: '🔥 Cuisson' },
            { id: 'COLD_STORAGE', label: '❄️ Froid' },
            { id: 'WASHING', label: '🧼 Lavage' },
            { id: 'BEVERAGE_COFFEE', label: '☕ Café/Bar' },
            { id: 'POS_HARDWARE', label: '🖥️ Caisse/TPE' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-950/50 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grille des Équipements ─────────────────────────────────────────── */}
      {loading ? (
        <div className="p-16 text-center text-slate-500 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
          <span>Chargement du parc matériel...</span>
        </div>
      ) : filteredAssets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map((asset) => (
            <EquipmentAssetCard
              key={asset.id}
              asset={asset}
              onOpenDetails={(a) => setDetailAsset(a)}
              onOpenTroubleshoot={(a) => setTroubleshootAsset(a)}
              onOpenAddGuide={(a) => setGuideAsset(a)}
            />
          ))}
        </div>
      ) : (
        <div className="p-16 text-center bg-slate-900/40 rounded-3xl border border-slate-800 text-slate-400 text-xs space-y-3">
          <Wrench className="w-10 h-10 mx-auto text-slate-600" />
          <p className="text-sm font-semibold text-slate-300">Aucun équipement ne correspond à votre filtre.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Enregistrer une première machine</span>
          </button>
        </div>
      )}

      {/* ── Modales ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showAddModal && (
          <AddEquipmentModal
            onClose={() => setShowAddModal(false)}
            onEquipmentCreated={fetchAssets}
          />
        )}

        {detailAsset && (
          <EquipmentDetailModal
            asset={detailAsset}
            onClose={() => setDetailAsset(null)}
            onOpenAddGuide={() => {
              const a = detailAsset;
              setDetailAsset(null);
              setGuideAsset(a);
            }}
            onOpenTroubleshoot={() => {
              const a = detailAsset;
              setDetailAsset(null);
              setTroubleshootAsset(a);
            }}
          />
        )}

        {troubleshootAsset && (
          <FaultDiagnosticWizard
            asset={troubleshootAsset}
            onClose={() => setTroubleshootAsset(null)}
            onFaultReported={fetchAssets}
          />
        )}

        {guideAsset && (
          <AddGuideModal
            asset={guideAsset}
            onClose={() => setGuideAsset(null)}
            onGuideAdded={fetchAssets}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
