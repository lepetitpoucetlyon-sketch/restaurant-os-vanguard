/* eslint-disable no-restricted-imports -- tolerated structural inversion */
"use client";

import { useState } from "react";
import { Coins, Clock, Users, Award, FileSpreadsheet, ShieldCheck, Check } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/ui.foundations";
import {
  TipsDistributionSettings,
  TipDistributionMethod,
  DEFAULT_TIPS_SETTINGS,
} from "@/modules/human/remuneration/services/TipsDistributionEngine";

interface Props {
  settings?: TipsDistributionSettings;
  onSave?: (updated: TipsDistributionSettings) => void;
  userRole?: string; // 'proprietaire' | 'directeur' | 'manager' (rôles tenant qui peuvent éditer)
}

const METHOD_OPTIONS: Array<{ value: TipDistributionMethod; label: string; description: string }> = [
  {
    value: "hours_by_role_weight",
    label: "Pro-Rata Heures + Pondération par Rôle (Recommandé HCR)",
    description: "Répartition selon le temps présent ajusté par le coefficient de chaque poste (salle, cuisine, bar).",
  },
  {
    value: "equal_per_shift_staff",
    label: "Part Égale par Salarié du Shift",
    description: "Division stricte à parts égales entre tous les membres ayant participé au service.",
  },
  {
    value: "hours_strict",
    label: "Pro-Rata Strict des Heures Travaillées",
    description: "Calcul uniquement basé sur les heures pointées sur la caisse, sans distinction de rôle.",
  },
  {
    value: "points_system",
    label: "Système de Points par Qualification",
    description: "Attribution selon une grille de points fixe par niveau d'ancienneté ou qualification.",
  },
];

export function TipsDistributionSettingsSection({ settings = DEFAULT_TIPS_SETTINGS, onSave, userRole = "manager" }: Props) {
  const [config, setConfig] = useState<TipsDistributionSettings>(settings);
  const [isSaved, setIsSaved] = useState(false);

  const canEdit = ["proprietaire", "directeur", "manager"].includes(userRole);

  const handleUpdate = (updated: TipsDistributionSettings) => {
    setConfig(updated);
    if (onSave) {
      onSave(updated);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    }
  };

  const handleRoleWeightChange = (roleKey: string, weight: number) => {
    const updated = {
      ...config,
      roleWeights: {
        ...config.roleWeights,
        [roleKey]: weight,
      },
    };
    handleUpdate(updated);
  };

  return (
    <div className="space-y-8 p-8 bg-bg-secondary border border-border rounded-3xl backdrop-blur-xl shadow-lg">
      {/* En-tête de section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-serif italic text-text-primary">Répartition Automatique des Pourboires CB</h3>
            <p className="text-xs text-text-muted">Réglages gérables par Admin & Manager — Distribution équitable à la clôture de service</p>
          </div>
        </div>

        {/* Toggle Principal ON / OFF */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-text-muted">
            {config.autoTipsDistributionEnabled ? "Automatique Activé" : "Désactivé"}
          </span>
          <button
            disabled={!canEdit}
            onClick={() => handleUpdate({ ...config, autoTipsDistributionEnabled: !config.autoTipsDistributionEnabled })}
            className={cn(
              "w-14 h-8 rounded-full relative transition-all duration-300",
              config.autoTipsDistributionEnabled ? "bg-amber-500 shadow-lg shadow-amber-500/20" : "bg-bg-tertiary border border-border"
            )}
          >
            <motion.div
              animate={{ x: config.autoTipsDistributionEnabled ? 26 : 2 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="absolute top-1 left-1 w-6 h-6 bg-surface-card rounded-full shadow-md"
            />
          </button>
        </div>
      </div>

      {config.autoTipsDistributionEnabled && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          {/* Choix de la méthode de répartition */}
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" /> Méthode de Répartition des Pourboires
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {METHOD_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  disabled={!canEdit}
                  onClick={() => handleUpdate({ ...config, tipsDistributionMethod: opt.value })}
                  className={cn(
                    "p-5 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden",
                    config.tipsDistributionMethod === opt.value
                      ? "bg-amber-500/10 border-amber-500/40 text-text-primary shadow-md"
                      : "bg-bg-tertiary/40 border-border text-text-muted hover:border-amber-500/20"
                  )}
                >
                  <p className="font-semibold text-sm text-text-primary flex items-center justify-between">
                    {opt.label}
                    {config.tipsDistributionMethod === opt.value && <Check className="w-4 h-4 text-amber-500" />}
                  </p>
                  <p className="text-xs text-text-muted mt-2 leading-relaxed">{opt.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Configuration des coefficients par Rôle (Si méthode Pro-rata ou Points) */}
          {config.tipsDistributionMethod === "hours_by_role_weight" && (
            <div className="space-y-4 bg-bg-tertiary/30 p-6 rounded-2xl border border-border">
              <label className="text-xs font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-500" /> Coefficients de Pondération par Rôle (Poids Métier)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {Object.entries(config.roleWeights).map(([roleKey, weight]) => (
                  <div key={roleKey} className="space-y-2 p-3 bg-bg-secondary rounded-xl border border-border">
                    <span className="text-xs font-serif capitalize text-text-primary block">
                      {roleKey.replace("_", " ")}
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="3"
                        disabled={!canEdit}
                        value={weight}
                        onChange={e => handleRoleWeightChange(roleKey, parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-sm text-text-primary font-mono outline-none focus:border-amber-500"
                      />
                      <span className="text-xs text-text-muted font-bold">x</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Options secondaires */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
            {/* Condition d'heures minimales */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" /> Heures Minimales de Shift pour Éligibilité
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="12"
                  disabled={!canEdit}
                  value={config.minimumHoursForTipEligibility}
                  onChange={e => handleUpdate({ ...config, minimumHoursForTipEligibility: parseFloat(e.target.value) || 0 })}
                  className="w-32 px-4 py-3 bg-bg-primary border border-border rounded-xl text-sm font-mono text-text-primary outline-none focus:border-amber-500"
                />
                <span className="text-xs text-text-muted">heure(s) minimum pointée(s)</span>
              </div>
            </div>

            {/* Export Fiche de Paie HCR */}
            <div className="flex items-center justify-between p-4 bg-bg-tertiary/40 border border-border rounded-2xl">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="text-xs font-semibold text-text-primary">Ligne Exonérée sur Bulletins de Paie HCR</p>
                  <p className="text-[10px] text-text-muted">Intégration automatique dans les exports paie (Loi de Finance)</p>
                </div>
              </div>
              <button
                disabled={!canEdit}
                onClick={() => handleUpdate({ ...config, includeInPayrollExport: !config.includeInPayrollExport })}
                className={cn(
                  "w-12 h-6 rounded-full relative transition-all duration-300",
                  config.includeInPayrollExport ? "bg-amber-500" : "bg-bg-tertiary border border-border"
                )}
              >
                <motion.div
                  animate={{ x: config.includeInPayrollExport ? 24 : 2 }}
                  className="absolute top-1 left-1 w-4 h-4 bg-surface-card rounded-full shadow-sm"
                />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Confirmation Sauvegarde */}
      {isSaved && (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-xs font-bold text-emerald-500">
          <ShieldCheck className="w-4 h-4" /> Réglages de répartition des pourboires enregistrés avec succès.
        </motion.div>
      )}
    </div>
  );
}
