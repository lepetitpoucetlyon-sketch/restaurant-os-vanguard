'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  BookOpen,
  FileText,
  Wrench,
  Building,
} from 'lucide-react';
import type {
  EquipmentAsset,
  EquipmentGuide,
} from '../../assets/domain/schemas/equipment';
import { EquipmentAssetService, DepreciationYear } from '../../services/EquipmentAssetService';
import { DetailMachineTab } from './detail-modal/DetailMachineTab';
import { DetailInvoiceTab } from './detail-modal/DetailInvoiceTab';
import { DetailGuidesTab } from './detail-modal/DetailGuidesTab';
import { DetailMaintenanceTab } from './detail-modal/DetailMaintenanceTab';

interface EquipmentDetailModalProps {
  asset: EquipmentAsset;
  onClose: () => void;
  onOpenAddGuide: () => void;
  onOpenTroubleshoot: () => void;
}

export function EquipmentDetailModal({
  asset,
  onClose,
  onOpenAddGuide,
  onOpenTroubleshoot,
}: EquipmentDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'INVOICE' | 'GUIDES' | 'MAINTENANCE'>('DETAILS');
  const [guides, setGuides] = useState<EquipmentGuide[]>([]);
  const [loadingGuides, setLoadingGuides] = useState(false);
  const [depreciationSchedule, setDepreciationSchedule] = useState<DepreciationYear[]>([]);

  useEffect(() => {
    const fetchGuides = async () => {
      try {
        setLoadingGuides(true);
        const res = await fetch(`/api/facility/equipment/${asset.id}/guides`);
        if (res.ok) {
          const json = await res.json();
          setGuides(json.data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingGuides(false);
      }
    };

    fetchGuides();

    if (asset.purchase) {
      const schedule = EquipmentAssetService.calculateDepreciationSchedule(asset.purchase);
      setDepreciationSchedule(schedule);
    }
  }, [asset]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Fiche 360° Équipement & GMAO
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {asset.name}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>{asset.brand} - {asset.model}</span>
              <span>•</span>
              <span>S/N: {asset.serialNumber}</span>
              <span>•</span>
              <span className="text-emerald-400">{asset.location}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barre d'onglets */}
        <div className="flex items-center gap-2 pt-4 pb-2 border-b border-slate-800/80">
          <button
            onClick={() => setActiveTab('DETAILS')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'DETAILS'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Fiche Machine & SAV</span>
          </button>

          <button
            onClick={() => setActiveTab('INVOICE')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'INVOICE'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>🧾 Facture & Garantie</span>
          </button>

          <button
            onClick={() => setActiveTab('GUIDES')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'GUIDES'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>📚 Tutos & Notices ({guides.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('MAINTENANCE')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'MAINTENANCE'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>🔧 Pannes & Diagnostic</span>
          </button>
        </div>

        {/* Corps des onglets */}
        <div className="overflow-y-auto py-5 flex-1 pr-1 custom-scrollbar">
          {activeTab === 'DETAILS' && <DetailMachineTab asset={asset} />}
          {activeTab === 'INVOICE' && <DetailInvoiceTab asset={asset} depreciationSchedule={depreciationSchedule} />}
          {activeTab === 'GUIDES' && (
            <DetailGuidesTab
              guides={guides}
              loadingGuides={loadingGuides}
              onOpenAddGuide={onOpenAddGuide}
            />
          )}
          {activeTab === 'MAINTENANCE' && (
            <DetailMaintenanceTab
              asset={asset}
              onOpenTroubleshoot={onOpenTroubleshoot}
            />
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors"
          >
            Fermer la fiche
          </button>
        </div>
      </motion.div>
    </div>
  );
}
