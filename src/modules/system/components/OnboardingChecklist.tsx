'use client';
// ─────────────────────────────────────────────────────────────────
// OnboardingChecklist — 5-step guided onboarding in-app
// ─────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Button } from "@/shared/components/ui/Button";

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  href: string;
  completed: boolean;
}

interface Props {
  tenantId: string;
  variant?: string;
}

const DEFAULT_STEPS: OnboardingStep[] = [
  {
    id: 'branding',
    title: 'Confirmer nom & identité visuelle',
    description: 'Vérifiez le nom de votre établissement et vos couleurs de marque.',
    href: '/settings',
    completed: false,
  },
  {
    id: 'catalog',
    title: 'Ajouter vos premiers articles',
    description: 'Créez manuellement ou importez votre catalogue de produits.',
    href: '/pos',
    completed: false,
  },
  {
    id: 'space',
    title: 'Configurer votre espace de travail',
    description: 'Définissez votre plan de salle, postes ou rendez-vous.',
    href: '/admin',
    completed: false,
  },
  {
    id: 'tax',
    title: 'Vérifier la configuration TVA',
    description: 'Assurez-vous que les taux de TVA correspondent à vos produits.',
    href: '/accounting-portal',
    completed: false,
  },
  {
    id: 'first_sale',
    title: 'Effectuer votre première vente test',
    description: 'Enregistrez une vente pour valider le scellement fiscal NF525.',
    href: '/pos',
    completed: false,
  },
];

export function OnboardingChecklist({ tenantId, variant = 'restaurant' }: Props) {
  const [steps, setSteps] = useState<OnboardingStep[]>(DEFAULT_STEPS);
  const [isDismissed, setIsDismissed] = useState(false);

  const storageKey = `ros_onboarding_${tenantId}`;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.dismissed) setIsDismissed(true);
        if (parsed.completedStepIds && Array.isArray(parsed.completedStepIds)) {
          setSteps((prev) =>
            prev.map((s) => ({
              ...s,
              completed: parsed.completedStepIds.includes(s.id),
            }))
          );
        }
      }
    } catch {
      // Ignore local storage read errors
    }
  }, [storageKey]);

  const completedCount = steps.filter((s) => s.completed).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  const toggleStep = (id: string) => {
    const updated = steps.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s));
    setSteps(updated);
    const completedIds = updated.filter((s) => s.completed).map((s) => s.id);
    localStorage.setItem(
      storageKey,
      JSON.stringify({ dismissed: isDismissed, completedStepIds: completedIds })
    );
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    const completedIds = steps.filter((s) => s.completed).map((s) => s.id);
    localStorage.setItem(
      storageKey,
      JSON.stringify({ dismissed: true, completedStepIds: completedIds })
    );
  };

  if (isDismissed && completedCount === steps.length) return null;

  return (
    <AnimatePresence>
      {!isDismissed && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="rounded-2xl bg-surface-glass border border-amber-500/20 p-6 backdrop-blur-xl mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-sm">
                🚀
              </div>
              <div>
                <h3 className="font-semibold text-white/90 text-sm">
                  Démarrage rapide — {variant.toUpperCase()}
                </h3>
                <p className="text-xs text-white/50">
                  {completedCount} sur {steps.length} étapes complétées ({progressPercent}%)
                </p>
              </div>
            </div>

            <Button variant="ghost"
              onClick={handleDismiss}
              className="text-xs text-white/40 hover:text-white/70 px-2 py-1 rounded transition-colors"
            >
              Masquer
            </Button>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden mb-6">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Steps list */}
          <div className="space-y-3">
            {steps.map((step, idx) => (
              <div
                key={step.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  step.completed
                    ? 'bg-emerald-500/[0.04] border-emerald-500/20'
                    : 'bg-surface-glass border-white/[0.06] hover:border-white/[0.12]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Button variant="ghost"
                    onClick={() => toggleStep(step.id)}
                    className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                      step.completed
                        ? 'bg-emerald-500 border-emerald-400 text-black'
                        : 'border-white/30 hover:border-white/60'
                    }`}
                  >
                    {step.completed && <span className="text-xs font-bold">✓</span>}
                  </Button>
                  <div>
                    <span
                      className={`text-sm font-medium ${
                        step.completed ? 'text-white/40 line-through' : 'text-white/85'
                      }`}
                    >
                      {idx + 1}. {step.title}
                    </span>
                    <p className="text-xs text-white/40">{step.description}</p>
                  </div>
                </div>

                {!step.completed && (
                  <Link
                    href={step.href}
                    className="text-xs font-medium text-amber-400 hover:text-amber-300 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 transition-all flex-shrink-0"
                  >
                    Configurer →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
