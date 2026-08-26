'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  ShieldCheck,
  Printer,
  CreditCard,
  Wifi,
  Thermometer,
  Cpu,
  FileCheck,
  Activity,
} from 'lucide-react';
import {
  HARDWARE_CHECKLIST_SPECS,
  type HardwareCommissioningReport,
} from '../services/HardwareProvisioningService';

interface HardwareOnboardingWizardProps {
  tenantId: string;
  siteName: string;
}

export function HardwareOnboardingWizard({ tenantId, siteName }: HardwareOnboardingWizardProps) {
  const [technicianName, setTechnicianName] = useState('Éric Martin (Technicien Réseau)');
  const [managerName, setManagerName] = useState('Julien Bernard (Directeur d Établissement)');
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<HardwareCommissioningReport | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  const handleRunDiagnostic = async () => {
    try {
      setIsRunning(true);
      const res = await fetch('/api/facility/hardware/diagnostics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          siteName,
          technicianName,
          managerName,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setReport(data.report);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'PAYMENT':
        return <CreditCard className="w-4 h-4 text-emerald-400" />;
      case 'PRINTING':
        return <Printer className="w-4 h-4 text-blue-400" />;
      case 'IOT':
        return <Thermometer className="w-4 h-4 text-amber-400" />;
      case 'NETWORK':
        return <Wifi className="w-4 h-4 text-purple-400" />;
      case 'FISCAL':
        return <ShieldCheck className="w-4 h-4 text-teal-400" />;
      default:
        return <Cpu className="w-4 h-4 text-text-muted" />;
    }
  };

  const filteredSpecs = report
    ? report.checklistResults.filter(
        (r) => activeCategory === 'ALL' || r.category === activeCategory
      )
    : HARDWARE_CHECKLIST_SPECS.filter(
        (s) => activeCategory === 'ALL' || s.category === activeCategory
      );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-surface-card border border-border-default backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <Activity className="w-3.5 h-3.5" /> Protocole d Installation J-0
            </div>
            <h2 className="text-xl font-bold text-text-primary">
              Wizard d Onboarding & Recette Matérielle — {siteName}
            </h2>
            <p className="text-xs text-text-muted">
              Autodiagnostic en 12 points : TPE Stripe, Imprimantes ESC/POS, Tiroir RJ11, Sondes IoT & Secours 4G.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunDiagnostic}
              disabled={isRunning}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-95 disabled:opacity-50 transition flex items-center gap-2"
            >
              {isRunning ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  Diagnostic en cours...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  Lancer le Test Global (12 Points)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Inputs Signataires */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-4 border-t border-border-default">
          <div>
            <label className="block text-micro font-semibold text-text-muted mb-1">Technicien Déploiement</label>
            <input
              type="text"
              value={technicianName}
              onChange={(e) => setTechnicianName(e.target.value)}
              className="w-full px-3 py-2 bg-surface-glass border border-border-default rounded-xl text-text-primary text-xs"
            />
          </div>
          <div>
            <label className="block text-micro font-semibold text-text-muted mb-1">Directeur / Gérant Signataire</label>
            <input
              type="text"
              value={managerName}
              onChange={(e) => setManagerName(e.target.value)}
              className="w-full px-3 py-2 bg-surface-glass border border-border-default rounded-xl text-text-primary text-xs"
            />
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['ALL', 'PAYMENT', 'PRINTING', 'HARDWARE', 'IOT', 'NETWORK', 'FISCAL'].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              activeCategory === cat
                ? 'bg-action-primary text-text-on-primary shadow-md'
                : 'bg-surface-glass border border-border-default text-text-muted hover:text-text-primary'
            }`}
          >
            {cat === 'ALL' ? 'Tous les Périphériques (12)' : cat}
          </button>
        ))}
      </div>

      {/* Checklist Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSpecs.map((item) => {
          const checkResult = report?.checklistResults.find((r) => r.id === item.id);
          const isPassed = checkResult?.status === 'PASSED';

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-2xl border backdrop-blur-xl transition ${
                isPassed
                  ? 'bg-emerald-950/20 border-emerald-500/30'
                  : checkResult?.status === 'FAILED'
                  ? 'bg-rose-950/20 border-rose-500/30'
                  : 'bg-surface-card border-border-default'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-surface-glass mt-0.5">
                    {getCategoryIcon(item.category)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
                      {item.name}
                    </h4>
                    <p className="text-xs text-text-muted mt-0.5">
                      {checkResult ? checkResult.details : (item as { description?: string }).description}
                    </p>
                  </div>
                </div>

                <div>
                  {checkResult ? (
                    isPassed ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-micro font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> OK ({checkResult.latencyMs}ms)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-micro font-bold">
                        <AlertCircle className="w-3.5 h-3.5" /> Échec
                      </span>
                    )
                  ) : (
                    <span className="text-micro font-mono text-text-muted/80">En attente</span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* PV de Recette Scellé */}
      {report && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-3xl bg-surface-card border border-emerald-500/30 shadow-2xl space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">
                  Procès-Verbal de Recette d Installation Matérielle (Validé)
                </h3>
                <p className="text-xs text-text-muted font-mono">
                  Réf : {report.reportId} — Horodatage : {new Date(report.createdAt).toLocaleString('fr-FR')}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30">
                12/12 Points Validés (100%)
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-surface-glass border border-border-default text-xs text-text-secondary space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-text-muted/80">Installé & Certifié par :</span>{' '}
                <strong className="text-text-primary">{report.technicianName}</strong>
              </div>
              <div>
                <span className="text-text-muted/80">Contresigné par le Gérant :</span>{' '}
                <strong className="text-text-primary">{report.managerName}</strong>
              </div>
            </div>
            <div className="font-mono text-micro text-emerald-400/90 break-all pt-2 border-t border-border-default">
              Master Seal SHA-256 : {report.masterSealSha256}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
