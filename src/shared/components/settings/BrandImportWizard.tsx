// @wip owner:design-system-team échéance:2026-Q4 — primitive UI shared à adopter (audit orphelins 2026-08-30)
'use client';

import React, { useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';
import { useToast } from '@ui/Toast';
import { useBrandEditor } from '@/shared/hooks/useBrandEditor';
import { useAtomValue } from 'jotai';
import { tenantVariantAtom } from '@/store/pillars/sovereign';
import type { WizardStep, ExtractedBrand } from './brand-import/brandWizardTypes';
import { darkenHex } from './brand-import/brandWizardTypes';
import { StepIndicator } from './brand-import/StepIndicator';
import { SourceStep } from './brand-import/SourceStep';
import { PreviewStep, ConfirmStep } from './brand-import/PreviewStep';

interface BrandImportWizardProps {
  className?: string;
}

export function BrandImportWizard({ className }: BrandImportWizardProps) {
  const [step, setStep] = useState<WizardStep>('source');
  const [brand, setBrand] = useState<ExtractedBrand | null>(null);
  const [saving, setSaving] = useState(false);
  const { saveTokens } = useBrandEditor();
  const variant = useAtomValue(tenantVariantAtom);
  const { showToast } = useToast();

  const handleExtracted = useCallback((extracted: ExtractedBrand) => {
    setBrand(extracted);
    setStep('preview');
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!brand) return;
    setSaving(true);
    try {
      await saveTokens({
        brandName: brand.name,
        primaryColor: brand.primaryColor,
        primaryHover: darkenHex(brand.primaryColor),
        accentColor: brand.primaryColor,
        brandingMode: 'custom',
      });
      setStep('confirm');
    } catch (err) {
      showToast(`Erreur sauvegarde : ${err instanceof Error ? err.message : 'inconnue'}`, 'error');
    } finally {
      setSaving(false);
    }
  }, [brand, saveTokens, showToast]);

  const handleReset = useCallback(() => {
    setBrand(null);
    setStep('source');
  }, []);

  return (
    <div className={cn("bg-surface-card border border-border-default rounded-3xl p-6", className)}>
      <h2 className="text-base font-black uppercase tracking-widest text-text-primary mb-1">
        Import Charte Graphique
      </h2>
      <p className="text-sm text-text-muted mb-6">
        Importez votre identité visuelle en quelques secondes.
      </p>

      <StepIndicator current={step} />

      {step === 'source' && (
        <SourceStep onExtracted={handleExtracted} />
      )}

      {step === 'preview' && brand && (
        <PreviewStep
          brand={brand}
          variant={variant}
          onConfirm={handleConfirm}
          onBack={() => setStep('source')}
        />
      )}

      {saving && (
        <div className="flex items-center justify-center gap-2 py-4 text-text-muted">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Application en cours…</span>
        </div>
      )}

      {step === 'confirm' && brand && !saving && (
        <ConfirmStep brand={brand} onReset={handleReset} />
      )}
    </div>
  );
}
