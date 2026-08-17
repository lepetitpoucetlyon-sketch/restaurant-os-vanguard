'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  ClipboardCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  Shield,
  RefreshCw,
  Building,
  Utensils,
  Users,
  CreditCard,
  Wrench,
  Cpu,
  FileText,
  Package,
  Heart,
  Lock,
  Sparkles,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/infrastructure/auth/hooks/useAuth';
import {
  type OnboardingAuditSummary,
  type OnboardingPillarStep,
  RestaurantOnboardingMasterService,
} from '@/modules/commerce';

const PILLAR_ICONS: Record<string, React.ReactNode> = {
  LEGAL_IDENTITY: <Building className="w-5 h-5 text-blue-400" />,
  SPACES: <Building className="w-5 h-5 text-purple-400" />,
  COMMERCE: <Utensils className="w-5 h-5 text-amber-400" />,
  HR: <Users className="w-5 h-5 text-pink-400" />,
  FINANCE: <CreditCard className="w-5 h-5 text-emerald-400" />,
  FACILITY: <Wrench className="w-5 h-5 text-indigo-400" />,
  HARDWARE: <Cpu className="w-5 h-5 text-cyan-400" />,
  COMPLIANCE: <FileText className="w-5 h-5 text-rose-400" />,
  LOGISTICS: <Package className="w-5 h-5 text-orange-400" />,
  CRM: <Heart className="w-5 h-5 text-red-400" />,
};

export function OnboardingChecklistSettingsPanel() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [summary, setSummary] = useState<OnboardingAuditSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterMandatoryOnly, setFilterMandatoryOnly] = useState(false);

  const fetchAudit = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/onboarding/audit');
      if (res.ok) {
        const json = await res.json();
        setSummary(json.data);
      }
    } catch (err) {
      console.error('Error fetching onboarding audit', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit();
  }, []);

  const userRole = currentUser?.role || 'serveur';
  const isManagerOrAbove = ['manager', 'directeur', 'admin', 'super_admin'].includes(userRole);

  // Sécurité RBAC
  if (!isManagerOrAbove) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-900/60 rounded-3xl border border-slate-800 p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4 text-rose-400">
          <Lock className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white mb-1">Accès Réservé à la Direction</h3>
        <p className="text-sm text-slate-400 max-w-md">
          La checklist de mise en service et d audit opérationnel est réservée aux managers et administrateurs de
          l établissement.
        </p>
      </div>
    );
  }

  const steps = summary?.steps || [];
  const filteredSteps = filterMandatoryOnly ? steps.filter((s) => s.isMandatory) : steps;

  return (
    <div className="space-y-6">
      {/* Header & Statut de Mise en Service */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold uppercase tracking-wider">
                Checklist J-0 & Audit Opérationnel
              </span>
              {summary?.isLaunchReady && (
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-400" /> Prêt pour ouverture
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Mise en Service & Pré-Requis Restaurant
            </h2>
            <p className="text-xs text-slate-400">
              Vérifiez la conformité des 8 piliers opérationnels avant l ouverture officielle de votre établissement.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchAudit}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors disabled:opacity-50"
              title="Rafraîchir l'audit"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterMandatoryOnly(!filterMandatoryOnly)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  filterMandatoryOnly
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                {filterMandatoryOnly ? 'Obligatoires uniquement (actif)' : 'Toutes les étapes'}
              </button>
            </div>
          </div>
        </div>

        {/* Barre de progression globale */}
        {summary && (
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <span className="text-slate-300">
                Progression globale : {summary.completedStepsCount} / {summary.totalStepsCount} étapes validées
              </span>
              <span className="text-emerald-400">{summary.overallProgressPercent}%</span>
            </div>
            <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 transition-all duration-500 rounded-full"
                style={{ width: `${summary.overallProgressPercent}%` }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
              <span>
                Étapes obligatoires complétées :{' '}
                <strong className="text-white">
                  {summary.mandatoryCompletedCount}/{summary.mandatoryTotalCount}
                </strong>
              </span>
              <span>Dernier contrôle : {new Date(summary.auditedAt).toLocaleTimeString('fr-FR')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Liste des Étapes par Pilier */}
      <div className="space-y-3">
        {loading && !summary ? (
          <div className="p-16 text-center text-slate-500 text-xs space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400" />
            <span>Audit des modules en cours...</span>
          </div>
        ) : (
          filteredSteps.map((step) => {
            const isAuthorized = RestaurantOnboardingMasterService.isAuthorizedForStep(userRole, step.minRole);
            const isDone = step.status === 'DONE';
            const isInProgress = step.status === 'IN_PROGRESS';

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4.5 rounded-2xl border transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isDone
                    ? 'bg-slate-900/60 border-emerald-500/20 hover:border-emerald-500/40'
                    : isInProgress
                    ? 'bg-slate-900/80 border-amber-500/30'
                    : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
                    {PILLAR_ICONS[step.category]}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Pilier {step.pillarNumber} • {step.pillar}
                      </span>
                      {step.isMandatory ? (
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[10px] font-bold">
                          OBLIGATOIRE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px] font-medium">
                          Recommandé
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500">~{step.estimatedMinutes} min</span>
                    </div>

                    <h4 className="text-sm font-bold text-white tracking-tight">{step.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-xl">{step.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                  {/* Badge de Statut */}
                  <div className="flex items-center gap-2">
                    {isDone ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Validé</span>
                      </span>
                    ) : isInProgress ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>En cours</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-xs font-medium">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>À configurer</span>
                      </span>
                    )}
                  </div>

                  {/* Bouton d'Action */}
                  {isAuthorized ? (
                    <button
                      onClick={() => router.push(step.route)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                        isDone
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                      }`}
                    >
                      <span>{step.actionLabel}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-500 italic flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Requis : {step.minRole}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
