'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Wrench,
  CheckCircle2,
  PhoneCall,
  Zap,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import type {
  EquipmentAsset,
  FaultSeverity,
} from '../../assets/domain/schemas/equipment';
import {
  EquipmentDiagnosticService,
  DiagnosticEvaluationResult,
} from '../../services/EquipmentDiagnosticService';

interface FaultDiagnosticWizardProps {
  asset: EquipmentAsset;
  onClose: () => void;
  onFaultReported?: () => void;
}

export function FaultDiagnosticWizard({
  asset,
  onClose,
  onFaultReported,
}: FaultDiagnosticWizardProps) {
  const [errorCode, setErrorCode] = useState('');
  const [symptom, setSymptom] = useState('');
  const [evaluation, setEvaluation] = useState<DiagnosticEvaluationResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [selectedSeverity, setSelectedSeverity] = useState<FaultSeverity>('degraded');

  const handleEvaluate = () => {
    const res = EquipmentDiagnosticService.diagnoseFault(
      asset.category,
      errorCode || undefined,
      symptom || undefined
    );
    setEvaluation(res);
    setSelectedSeverity(res.severity);
  };

  const handleReportBreakdown = async () => {
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/facility/equipment/${asset.id}/troubleshoot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          errorCode: errorCode || undefined,
          symptom: symptom || (evaluation ? evaluation.message : 'Panne signalée sans détail'),
          createBreakdownTicket: true,
        }),
      });

      if (res.ok) {
        setReportSuccess(true);
        if (onFaultReported) onFaultReported();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-rose-400 tracking-wide uppercase">
                Diagnostic & Assistance Dépannage
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {asset.name} ({asset.brand} - {asset.model})
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-muted hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps du wizard */}
        <div className="overflow-y-auto py-5 space-y-6 flex-1 pr-1 custom-scrollbar">
          {reportSuccess ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-3"
            >
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Incident Enregistré & Transmis</h3>
              <p className="text-sm text-text-secondary">
                L appareil a été placé en statut dégradé / hors-service. Une notification d incident a été émise à la
                direction et transmise au journal de maintenance.
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-text-primary font-bold text-sm transition-all"
              >
                Fermer l assistant
              </button>
            </motion.div>
          ) : (
            <>
              {/* Formulaire de diagnostic */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5">
                    Code Erreur Écran (ex: E12, Err03, 0x82)
                  </label>
                  <input
                    type="text"
                    value={errorCode}
                    onChange={(e) => setErrorCode(e.target.value)}
                    placeholder="Ex: E12, Err03..."
                    className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/50 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5">
                    Symptôme observé
                  </label>
                  <input
                    type="text"
                    value={symptom}
                    onChange={(e) => setSymptom(e.target.value)}
                    placeholder="Ex: Ne vidange pas, odeur, bip..."
                    className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/50 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleEvaluate}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors"
                >
                  <Zap className="w-4 h-4" />
                  <span>Analyser le problème</span>
                </button>
              </div>

              {/* Résultat de l'analyse */}
              {evaluation && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 bg-slate-950/60 p-5 rounded-2xl border border-slate-800"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-micro font-bold text-indigo-400 uppercase tracking-wider">
                        Diagnostic IA & Base Constructeur
                      </span>
                      <h4 className="text-base font-bold text-white">{evaluation.message}</h4>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        evaluation.severity === 'critical'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {evaluation.severity === 'critical' ? '🚨 Critique' : '⚠️ Dégradé'}
                    </span>
                  </div>

                  {/* Actions immédiates recommandées */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide block">
                      Étapes de Dépannage Immédiat :
                    </span>
                    <div className="space-y-1.5">
                      {evaluation.recommendedActions.map((action, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-text-secondary"
                        >
                          <ArrowRight className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                          <span>{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Contact SAV si technicien requis */}
                  {asset.supportContact?.phone && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs">
                      <div className="flex items-center gap-2">
                        <PhoneCall className="w-4 h-4" />
                        <span>
                          SAV Constructeur : <strong>{asset.supportContact.companyName || asset.brand}</strong>
                        </span>
                      </div>
                      <a
                        href={`tel:${asset.supportContact.phone}`}
                        className="px-3 py-1 rounded-lg bg-blue-500 hover:bg-blue-600 text-text-primary font-bold transition-colors"
                      >
                        Appeler {asset.supportContact.phone}
                      </a>
                    </div>
                  )}
                </motion.div>
              )}
            </>
          )}
        </div>

        {/* Footer actions */}
        {!reportSuccess && (
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-text-secondary text-xs font-medium transition-colors"
            >
              Annuler
            </button>

            <button
              onClick={handleReportBreakdown}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-lg shadow-rose-600/30"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>{isSubmitting ? 'Transmission...' : '🚨 Déclarer la panne en direct'}</span>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
