"use client";

/**
 * OnboardingProgress — mig-19
 *
 * Affiche la séquence d'onboarding migration et vérifie via Nexus
 * si chaque collection a des données (count > 0 → Done).
 */

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Clock, ChevronRight, RefreshCw } from "lucide-react";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import { ONBOARDING_SEQUENCE, type OnboardingStep } from "@/modules/onboarding/migration/onboardingSteps";

type StepStatus = "done" | "pending" | "loading";

interface StepState {
  step: OnboardingStep;
  status: StepStatus;
}

export function OnboardingProgress() {
  const router = useRouter();
  const [steps, setSteps] = useState<StepState[]>(
    ONBOARDING_SEQUENCE.map(step => ({ step, status: "loading" }))
  );
  const [checking, setChecking] = useState(true);

  const checkSteps = useCallback(async () => {
    setChecking(true);
    const results = await Promise.all(
      ONBOARDING_SEQUENCE.map(async (step): Promise<StepState> => {
        try {
          const records = await Nexus.adapter.query<{ id: string }>(step.nexusCollection);
          return { step, status: records.length > 0 ? "done" : "pending" };
        } catch {
          return { step, status: "pending" };
        }
      })
    );
    setSteps(results);
    setChecking(false);
  }, []);

  useEffect(() => {
    checkSteps();
  }, [checkSteps]);

  const doneCount = steps.filter(s => s.status === "done").length;
  const total = ONBOARDING_SEQUENCE.length;
  const progressPct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Header + progress bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium text-text-primary">
              {doneCount}/{total} étapes complètes
            </span>
            <span className="text-sm text-text-muted">{progressPct} %</span>
          </div>
          <div className="h-2 w-full rounded-full bg-bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
        <button
          onClick={checkSteps}
          disabled={checking}
          title="Actualiser"
          className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-secondary transition-colors disabled:opacity-40"
        >
          <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Steps list */}
      <ol className="space-y-2">
        {steps.map(({ step, status }) => {
          const isDone = status === "done";
          const isLoading = status === "loading";

          return (
            <li
              key={step.id}
              className={[
                "flex items-center gap-3 rounded-xl border px-4 py-3 transition-all",
                isDone
                  ? "border-accent/30 bg-accent/5"
                  : "border-border bg-bg-card",
              ].join(" ")}
            >
              {/* Status icon */}
              <span className="shrink-0">
                {isLoading ? (
                  <Circle className="w-5 h-5 text-text-muted animate-pulse" />
                ) : isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-accent" />
                ) : (
                  <Circle className="w-5 h-5 text-text-muted" />
                )}
              </span>

              {/* Order badge */}
              <span
                className={[
                  "shrink-0 w-5 h-5 rounded-full text-xs font-semibold flex items-center justify-center",
                  isDone
                    ? "bg-accent/20 text-accent"
                    : "bg-bg-secondary text-text-muted",
                ].join(" ")}
              >
                {step.order}
              </span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p
                  className={[
                    "text-sm font-medium leading-tight",
                    isDone ? "text-text-primary line-through opacity-60" : "text-text-primary",
                  ].join(" ")}
                >
                  {step.title}
                </p>
                <p className="text-xs text-text-muted mt-0.5 truncate">
                  {step.description}
                </p>
              </div>

              {/* Estimated time */}
              <span className="shrink-0 flex items-center gap-1 text-xs text-text-muted">
                <Clock className="w-3.5 h-3.5" />
                {step.estimatedMinutes} min
              </span>

              {/* CTA */}
              {!isDone && step.route && (
                <button
                  onClick={() => router.push(step.route!)}
                  className="shrink-0 flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
                >
                  Démarrer
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
