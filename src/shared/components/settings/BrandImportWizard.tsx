'use client';

import { useState, useCallback } from 'react';
import { Loader2, Globe, Palette, CheckCircle2, ChevronRight, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';
import { useToast } from '@ui/Toast';
import { useBrandEditor } from '@/shared/hooks/useBrandEditor';
import { useAtomValue } from 'jotai';
import { tenantVariantAtom } from '@/store/pillars/sovereign';
import type { BrandInput } from '@/lib/BrandingService';
import type { PlatformVariant } from '@nexus/contracts';

// ── Types ────────────────────────────────────────────────────────────────────

type WizardStep = 'source' | 'preview' | 'confirm';

interface ExtractedBrand extends BrandInput {
  primaryColor: string;
}

// ── Step indicators ──────────────────────────────────────────────────────────

const STEPS: { id: WizardStep; label: string; icon: typeof Globe }[] = [
  { id: 'source',  label: 'Source',    icon: Globe },
  { id: 'preview', label: 'Aperçu',    icon: Palette },
  { id: 'confirm', label: 'Confirmer', icon: CheckCircle2 },
];

function StepIndicator({ current }: { current: WizardStep }) {
  const currentIdx = STEPS.findIndex(s => s.id === current);
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((step, idx) => {
        const Icon = step.icon;
        const done   = idx < currentIdx;
        const active = idx === currentIdx;
        return (
          <div key={step.id} className="flex items-center gap-2">
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors",
              done   && "bg-status-success border-status-success text-white",
              active && "border-action-primary text-action-primary bg-action-primary/10",
              !done && !active && "border-border-default text-text-muted"
            )}>
              <Icon className="w-4 h-4" />
            </div>
            <span className={cn(
              "text-xs font-semibold uppercase tracking-widest",
              active ? "text-action-primary" : done ? "text-status-success" : "text-text-muted"
            )}>
              {step.label}
            </span>
            {idx < STEPS.length - 1 && (
              <ChevronRight className="w-4 h-4 text-text-muted mx-1" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Color swatch preview ─────────────────────────────────────────────────────

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

// ── Step 1 : Source ──────────────────────────────────────────────────────────

interface SourceStepProps {
  onExtracted: (brand: ExtractedBrand) => void;
}

function SourceStep({ onExtracted }: SourceStepProps) {
  const [mode, setMode]     = useState<'url' | 'manual'>('url');
  const [url, setUrl]       = useState('');
  const [name, setName]     = useState('');
  const [color, setColor]   = useState('#6366f1');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleUrlExtract = useCallback(async () => {
    if (!url.trim()) { showToast('Entrez une URL valide', 'error'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/brand/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data: BrandInput = await res.json();
      onExtracted({
        name: data.name ?? 'Ma Marque',
        primaryColor: data.primaryColor ?? '#6366f1',
        atmosphere: data.atmosphere,
      });
    } catch (err) {
      showToast(`Extraction échouée : ${err instanceof Error ? err.message : 'erreur réseau'}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [url, onExtracted, showToast]);

  const handleManual = useCallback(() => {
    if (!name.trim()) { showToast('Donnez un nom à votre marque', 'error'); return; }
    onExtracted({ name, primaryColor: color });
  }, [name, color, onExtracted, showToast]);

  return (
    <div className="space-y-6">
      {/* Mode tabs */}
      <div className="flex rounded-xl border border-border-default overflow-hidden">
        {(['url', 'manual'] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "flex-1 py-2.5 text-sm font-semibold transition-colors",
              mode === m
                ? "bg-action-primary text-action-primary-fg"
                : "text-text-secondary hover:bg-surface-card"
            )}
          >
            {m === 'url' ? 'Depuis un site web' : 'Saisie manuelle'}
          </button>
        ))}
      </div>

      {mode === 'url' ? (
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Entrez l'URL de votre site ou de votre concurrent — l'IA extrait automatiquement l'identité visuelle.
          </p>
          <input
            type="url"
            placeholder="https://mon-restaurant.fr"
            value={url}
            onChange={e => setUrl(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-border-default bg-surface-card text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-action-primary/40 text-sm"
          />
          <button
            onClick={handleUrlExtract}
            disabled={loading}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-colors",
              "bg-action-primary text-action-primary-fg hover:bg-action-primary-hover",
              loading && "opacity-60 cursor-not-allowed"
            )}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
            {loading ? "Extraction en cours…" : "Analyser le site"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-text-muted mb-2 block">
              Nom de la marque
            </label>
            <input
              type="text"
              placeholder="Mon Restaurant"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border-default bg-surface-card text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-action-primary/40 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-text-muted mb-2 block">
              Couleur principale
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="w-12 h-12 rounded-xl border border-border-default cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={color}
                onChange={e => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) setColor(e.target.value); }}
                className="flex-1 px-4 py-3 rounded-xl border border-border-default bg-surface-card text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-action-primary/40"
              />
            </div>
          </div>
          <button
            onClick={handleManual}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm bg-action-primary text-action-primary-fg hover:bg-action-primary-hover transition-colors"
          >
            <Palette className="w-4 h-4" />
            Générer le thème
          </button>
        </div>
      )}
    </div>
  );
}

// ── Step 2 : Preview ─────────────────────────────────────────────────────────

interface PreviewStepProps {
  brand: ExtractedBrand;
  variant: PlatformVariant;
  onConfirm: () => void;
  onBack: () => void;
}

function PreviewStep({ brand, variant, onConfirm, onBack }: PreviewStepProps) {
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

// ── Step 3 : Confirm ──────────────────────────────────────────────────────────

interface ConfirmStepProps {
  brand: ExtractedBrand;
  onReset: () => void;
}

function ConfirmStep({ brand, onReset }: ConfirmStepProps) {
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

// ── Main Wizard ───────────────────────────────────────────────────────────────

interface BrandImportWizardProps {
  className?: string;
}

export function BrandImportWizard({ className }: BrandImportWizardProps) {
  const [step, setStep]   = useState<WizardStep>('source');
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
        brandName:    brand.name,
        primaryColor: brand.primaryColor,
        primaryHover: darkenHex(brand.primaryColor),
        accentColor:  brand.primaryColor,
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

// ── Utils ─────────────────────────────────────────────────────────────────────

function darkenHex(hex: string): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const darken = (c: number) => Math.max(0, c - 25).toString(16).padStart(2, '0');
  return `#${darken((n >> 16) & 0xff)}${darken((n >> 8) & 0xff)}${darken(n & 0xff)}`;
}
