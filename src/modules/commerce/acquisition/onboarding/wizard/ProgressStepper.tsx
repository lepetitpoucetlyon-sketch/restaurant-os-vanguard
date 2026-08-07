'use client';
import React from 'react';

export interface WizardStep {
  id: string;
  label: string;
  icon?: string;
}

interface ProgressStepperProps {
  steps: WizardStep[];
  currentStep: string;
  completedSteps: string[];
  onStepClick?: (id: string) => void;
}

export function ProgressStepper({ steps, currentStep, completedSteps, onStepClick }: ProgressStepperProps) {
  return (
    <nav className="flex items-center gap-0" aria-label="Progression onboarding">
      {steps.map((step, i) => {
        const isDone = completedSteps.includes(step.id);
        const isCurrent = step.id === currentStep;
        const isLast = i === steps.length - 1;

        return (
          <React.Fragment key={step.id}>
            <button
              onClick={() => onStepClick?.(step.id)}
              className={[
                'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all text-xs font-medium min-w-[72px]',
                isDone ? 'text-emerald-600 cursor-pointer' : '',
                isCurrent ? 'text-indigo-600 bg-indigo-50' : '',
                !isDone && !isCurrent ? 'text-gray-400 cursor-default' : '',
              ].join(' ')}
              disabled={!isDone && !isCurrent}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <span className={[
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors',
                isDone ? 'bg-emerald-500 border-emerald-500 text-white' : '',
                isCurrent ? 'bg-white border-indigo-600 text-indigo-600' : '',
                !isDone && !isCurrent ? 'bg-gray-100 border-gray-300 text-gray-400' : '',
              ].join(' ')}>
                {isDone ? '✓' : (step.icon ?? String(i + 1))}
              </span>
              <span className="hidden sm:block leading-tight text-center">{step.label}</span>
            </button>
            {!isLast && (
              <div className={[
                'flex-1 h-0.5 mx-1',
                isDone ? 'bg-emerald-400' : 'bg-gray-200',
              ].join(' ')} />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
