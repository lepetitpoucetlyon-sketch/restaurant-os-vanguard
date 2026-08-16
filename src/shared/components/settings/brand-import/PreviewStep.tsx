import React from 'react';
import { RotateCcw, CheckCircle2 } from 'lucide-react';
import type { PlatformVariant } from '@/modules/system';
import type { ExtractedBrand } from './brandWizardTypes';

function ColorSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-xl border border-border-default shadow-sm flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-text-muted">{label}</p>
        <p className="text-sm font-mono text-text-primary">{color}</p>
      </div>
    </div>
  );
}

interface PreviewStepProps {
  brand: ExtractedBrand;
  variant: PlatformVariant;
  onConfirm: () => void;
  onBack: () => void;
}

export function PreviewStep({ brand, variant, onConfirm, onBack }: PreviewStepProps) {
  const primary = brand.primaryColor;

  const hoverColor = (hex: string): string => {
    const n = parseInt(hex.replace('#', ''), 16);
    const darken = (c: number) => Math.max(0, c - 25).toString(16).padStart(2, '0');
    const r = darken((n >> 16) & 0xff);
    const g = darken((n >> 8) & 0xff);
    const b = darken(n & 0xff);
    return `#${r}${g}${b}`;
  };

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-2xl border border-border-default bg-surface-card space-y-4">
        <p className="text-xs font-black uppercase tracking-widest text-text-muted">Identité extraite</p>
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg"
            style={{ backgroundColor: primary }}
          >
            {brand.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-semibold text-text-primary">{brand.name}</p>
            {brand.atmosphere && (
              <p className="text-xs text-text-muted capitalize">{brand.atmosphere} · {variant}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <ColorSwatch color={primary} label="Couleur principale" />
          <ColorSwatch color={hoverColor(primary)} label="Hover / Foncé" />
        </div>
      </div>

      {/* Miniature de composants avec la couleur */}
      <div className="p-4 rounded-2xl border border-border-default bg-surface-card">
        <p className="text-xs font-black uppercase tracking-widest text-text-muted mb-4">Aperçu live</p>
        <div className="space-y-3">
          <button
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-sm"
            style={{ backgroundColor: primary }}
          >
            Bouton principal
          </button>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: primary }} />
            <span className="text-sm" style={{ color: primary }}>Texte accent</span>
          </div>
          <div
            className="px-3 py-1.5 rounded-full text-xs font-semibold inline-flex text-white"
            style={{ backgroundColor: primary + '33', color: primary }}
          >
            Badge statut
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border-default text-text-secondary hover:bg-surface-card text-sm font-semibold transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Retour
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm text-white transition-colors"
          style={{ backgroundColor: primary }}
        >
          <CheckCircle2 className="w-4 h-4" />
          Appliquer ce thème
        </button>
      </div>
    </div>
  );
}

interface ConfirmStepProps {
  brand: ExtractedBrand;
  onReset: () => void;
}

export function ConfirmStep({ brand, onReset }: ConfirmStepProps) {
  return (
    <div className="text-center space-y-6 py-4">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white mx-auto shadow-xl"
        style={{ backgroundColor: brand.primaryColor }}
      >
        {brand.name.charAt(0).toUpperCase()}
      </div>
      <div>
        <p className="text-xl font-semibold text-text-primary mb-1">{brand.name}</p>
        <p className="text-sm text-text-secondary">
          Thème appliqué — les changements sont visibles en temps réel pour tous les utilisateurs du tenant.
        </p>
      </div>
      <div className="flex items-center justify-center gap-2 text-status-success">
        <CheckCircle2 className="w-5 h-5" />
        <span className="text-sm font-semibold">Sauvegardé dans Firestore</span>
      </div>
      <button
        onClick={onReset}
        className="text-sm text-text-muted hover:text-text-secondary underline transition-colors"
      >
        Importer une autre identité
      </button>
    </div>
  );
}
