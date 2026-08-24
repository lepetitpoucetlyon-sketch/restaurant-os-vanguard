'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Wrench,
  BookOpen,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  Flame,
  Snowflake,
  Coffee,
  Monitor,
  Fan,
  Shield,
  HelpCircle,
} from 'lucide-react';
import type { EquipmentAsset, EquipmentCategory, EquipmentStatus } from '../../assets/domain/schemas/equipment';

interface EquipmentAssetCardProps {
  asset: EquipmentAsset;
  onOpenDetails: (asset: EquipmentAsset) => void;
  onOpenTroubleshoot: (asset: EquipmentAsset) => void;
  onOpenAddGuide: (asset: EquipmentAsset) => void;
}

const CATEGORY_ICONS: Record<EquipmentCategory, React.ReactNode> = {
  COOKING: <Flame className="w-5 h-5 text-amber-400" />,
  COLD_STORAGE: <Snowflake className="w-5 h-5 text-cyan-400" />,
  WASHING: <Wrench className="w-5 h-5 text-blue-400" />,
  BEVERAGE_COFFEE: <Coffee className="w-5 h-5 text-emerald-400" />,
  FOOD_PREP: <Wrench className="w-5 h-5 text-purple-400" />,
  POS_HARDWARE: <Monitor className="w-5 h-5 text-indigo-400" />,
  HVAC_EXTRACTION: <Fan className="w-5 h-5 text-sky-400" />,
  SECURITY_SAFETY: <Shield className="w-5 h-5 text-rose-400" />,
  OTHER: <HelpCircle className="w-5 h-5 text-text-muted" />,
};

const CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  COOKING: 'Cuisson & Chaud',
  COLD_STORAGE: 'Froid & Réfrigération',
  WASHING: 'Lavage & Hygiène',
  BEVERAGE_COFFEE: 'Bar & Café',
  FOOD_PREP: 'Préparation Culinaire',
  POS_HARDWARE: 'Matériel Caisse & TPE',
  HVAC_EXTRACTION: 'Extraction & CVC',
  SECURITY_SAFETY: 'Sécurité & ERP',
  OTHER: 'Autre Équipement',
};

const STATUS_CONFIG: Record<
  EquipmentStatus,
  { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
> = {
  OPERATIONAL: {
    label: 'Opérationnel',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  DEGRADED: {
    label: 'Mode Dégradé',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  },
  OUT_OF_ORDER: {
    label: 'Hors Service',
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    icon: <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />,
  },
  MAINTENANCE_DUE: {
    label: 'Révision Requise',
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    border: 'border-indigo-500/30',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  DECOMMISSIONED: {
    label: 'Mis au Rebut',
    bg: 'bg-slate-500/10',
    text: 'text-text-muted',
    border: 'border-slate-500/30',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
};

export function EquipmentAssetCard({
  asset,
  onOpenDetails,
  onOpenTroubleshoot,
  onOpenAddGuide,
}: EquipmentAssetCardProps) {
  const statusCfg = STATUS_CONFIG[asset.status] || STATUS_CONFIG.OPERATIONAL;

  // Calcul du statut de la garantie
  let warrantyLabel = 'Garantie non spécifiée';
  let isWarrantyActive = false;
  let isWarrantyExpiringSoon = false;

  if (asset.purchase?.warrantyExpiresAt) {
    const expiresMs = new Date(asset.purchase.warrantyExpiresAt).getTime();
    const nowMs = Date.now();
    const daysLeft = Math.ceil((expiresMs - nowMs) / (1000 * 60 * 60 * 24));

    if (daysLeft > 30) {
      warrantyLabel = `Garantie active (${daysLeft}j)`;
      isWarrantyActive = true;
    } else if (daysLeft > 0) {
      warrantyLabel = `Garantie expire dans ${daysLeft}j !`;
      isWarrantyActive = true;
      isWarrantyExpiringSoon = true;
    } else {
      warrantyLabel = 'Garantie expirée';
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 backdrop-blur-xl p-5 shadow-xl transition-all duration-300 hover:shadow-2xl flex flex-col justify-between"
    >
      <div>
        {/* Header : Catégorie & Statut */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-inner">
              {CATEGORY_ICONS[asset.category]}
            </div>
            <div>
              <span className="text-[11px] font-medium tracking-wide uppercase text-text-muted">
                {CATEGORY_LABELS[asset.category]}
              </span>
              <h3 className="text-base font-bold text-white tracking-tight group-hover:text-emerald-400 transition-colors">
                {asset.name}
              </h3>
            </div>
          </div>

          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
          >
            {statusCfg.icon}
            <span>{statusCfg.label}</span>
          </div>
        </div>

        {/* Détails techniques */}
        <div className="grid grid-cols-2 gap-2 text-xs text-text-muted mb-4 bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
          <div>
            <span className="text-text-muted/80 block text-[10px] uppercase font-semibold">Marque / Modèle</span>
            <span className="text-text-primary font-medium truncate block">
              {asset.brand} - {asset.model}
            </span>
          </div>
          <div>
            <span className="text-text-muted/80 block text-[10px] uppercase font-semibold">Emplacement</span>
            <span className="text-text-primary font-medium truncate block">{asset.location}</span>
          </div>
          <div className="col-span-2 flex items-center justify-between pt-1 border-t border-slate-800/60">
            <span className="text-text-muted/80 text-[10px]">S/N: {asset.serialNumber}</span>
            {asset.purchase?.invoiceUrl && (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                <FileText className="w-3 h-3" /> Facture liée
              </span>
            )}
          </div>
        </div>

        {/* Badge Garantie */}
        {asset.purchase?.warrantyExpiresAt && (
          <div
            className={`mb-4 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
              isWarrantyExpiringSoon
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : isWarrantyActive
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-slate-800/50 border-slate-700 text-text-muted'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{warrantyLabel}</span>
          </div>
        )}
      </div>

      {/* Barre d'actions */}
      <div className="grid grid-cols-3 gap-1.5 pt-3 border-t border-slate-800/80">
        <button
          onClick={() => onOpenDetails(asset)}
          className="flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-text-primary text-xs font-medium transition-colors"
          title="Fiche technique, factures & notices"
        >
          <BookOpen className="w-3.5 h-3.5 text-blue-400" />
          <span>Fiche</span>
        </button>

        <button
          onClick={() => onOpenTroubleshoot(asset)}
          className="flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-text-primary hover:text-rose-300 border border-transparent hover:border-rose-500/30 text-xs font-medium transition-colors"
          title="Diagnostic de panne pas-à-pas"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          <span>Dépannage</span>
        </button>

        <button
          onClick={() => onOpenAddGuide(asset)}
          className="flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-text-primary text-xs font-medium transition-colors"
          title="Ajouter un guide ou une vidéo YouTube"
        >
          <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
          <span>+ Tuto</span>
        </button>
      </div>
    </motion.div>
  );
}
