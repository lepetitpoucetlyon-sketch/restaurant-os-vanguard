'use client';

import React, { useState, useCallback } from 'react';
import { useAtomValue } from 'jotai';
import { tenantVariantAtom } from '@/store/pillars/sovereign';
import { VERTICAL_STYLE_PRESETS } from '@nexus/tokens/verticals/presets';
import { BrandImportWizard } from './BrandImportWizard';
import { cn } from '@/lib/ui.foundations';
import type { StylePreset } from '@nexus/tokens/verticals/presets';
import type { PlatformVariant } from '@nexus/contracts';
import { VerticalUIRegistry } from '@/shared/plugins/VerticalUIRegistry';

// ── Types ─────────────────────────────────────────────────────────────────────

type DensityMode = 'compact' | 'premium' | 'spacieux';
type LayoutOption = 'sidebar' | 'topbar' | 'default' | 'kiosk' | 'fullscreen';

// ── Helpers ───────────────────────────────────────────────────────────────────

function applyPresetEphemeral(preset: StylePreset) {
  const root = document.documentElement;
  root.style.setProperty('--action-primary', preset.primaryColor);
  if (preset.accentColor) root.style.setProperty('--action-accent', preset.accentColor);
  if (preset.appearance !== 'light') {
    root.setAttribute('data-theme', preset.appearance);
  } else {
    root.setAttribute('data-theme', 'light');
  }
}

function applyDensity(density: DensityMode) {
  const root = document.documentElement;
  const map: Record<DensityMode, { space: string; radius: string }> = {
    compact:  { space: '0.75rem', radius: '0.5rem' },
    premium:  { space: '1.5rem',  radius: '1rem'   },
    spacieux: { space: '2rem',    radius: '1.5rem' },
  };
  root.style.setProperty('--spacing-card', map[density].space);
  root.style.setProperty('--radius-card',  map[density].radius);
}

function resolveAvailableLayouts(variant: PlatformVariant): LayoutOption[] {
  const plugin = VerticalUIRegistry.resolve(variant);
  const preferred = plugin?.preferredLayout;
  // Layouts disponibles selon le vertical
  if (preferred === 'topbar')     return ['topbar', 'sidebar'];
  if (preferred === 'kiosk')      return ['kiosk', 'sidebar'];
  if (preferred === 'fullscreen') return ['fullscreen', 'default'];
  return ['sidebar', 'topbar', 'default'];
}

// ── Composant ─────────────────────────────────────────────────────────────────

interface PlusBrandSectionProps {
  /** Callback déclenché quand le tenant confirme une modification → persistance Firestore */
  onApply?: (patch: Record<string, unknown>) => void | Promise<void>;
}

export function PlusBrandSection({ onApply }: PlusBrandSectionProps) {
  const variant  = useAtomValue(tenantVariantAtom);
  const presets  = VERTICAL_STYLE_PRESETS[variant] ?? [];
  const layouts  = resolveAvailableLayouts(variant);

  const [activePreset,  setActivePreset]  = useState<string | null>(null);
  const [activeDensity, setActiveDensity] = useState<DensityMode>('premium');
  const [activeLayout,  setActiveLayout]  = useState<LayoutOption>(layouts[0]);
  const [showWizard,    setShowWizard]    = useState(false);
  const [isApplying,    setIsApplying]    = useState(false);

  const handlePresetClick = useCallback((preset: StylePreset) => {
    setActivePreset(preset.id);
    applyPresetEphemeral(preset);   // preview live, pas encore persisté
  }, []);

  const handleDensityClick = useCallback((d: DensityMode) => {
    setActiveDensity(d);
    applyDensity(d);                // preview live
  }, []);

  const handleApply = useCallback(async () => {
    if (!onApply) return;
    setIsApplying(true);
    try {
      const selectedPreset = presets.find(p => p.id === activePreset);
      await onApply({
        ...(selectedPreset ? {
          primaryColor: selectedPreset.primaryColor,
          accentColor:  selectedPreset.accentColor,
          appearance:   selectedPreset.appearance,
          fontBrand:    selectedPreset.fontBrand,
          fontBrandUrl: selectedPreset.fontBrandUrl,
        } : {}),
        density:    activeDensity,
        layoutType: activeLayout,
      });
    } finally {
      setIsApplying(false);
    }
  }, [onApply, activePreset, activeDensity, activeLayout, presets]);

  const DENSITY_OPTIONS: { id: DensityMode; label: string; desc: string }[] = [
    { id: 'compact',  label: 'Compact',  desc: 'Interface dense, plus d\'infos par écran' },
    { id: 'premium',  label: 'Premium',  desc: 'Espacement généreux, lecture fluide' },
    { id: 'spacieux', label: 'Spacieux', desc: 'Maximum de respiration visuelle' },
  ];

  const LAYOUT_LABELS: Record<string, string> = {
    sidebar:    'Sidebar',
    topbar:     'Topbar',
    default:    'Standard',
    kiosk:      'Kiosk',
    fullscreen: 'Plein écran',
  };

  return (
    <div className="space-y-8">

      {/* ── Import charte ── */}
      <section>
        <h3 className="text-xs font-black uppercase tracking-widest text-text-muted mb-3">
          Import charte graphique
        </h3>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border-default bg-surface-card hover:bg-surface-tertiary text-sm font-semibold transition-all"
          >
            <span>🌐</span> Depuis mon site web
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border-default bg-surface-card hover:bg-surface-tertiary text-sm font-semibold transition-all"
          >
            <span>✏️</span> Couleurs manuelles
          </button>
        </div>
        {showWizard && (
          <div className="mt-4 relative">
            <BrandImportWizard />
            <button
              onClick={() => setShowWizard(false)}
              className="absolute top-2 right-2 text-text-muted hover:text-text-primary text-sm font-bold"
            >
              ✕
            </button>
          </div>
        )}
      </section>

      {/* ── Layout ── */}
      {layouts.length > 1 && (
        <section>
          <h3 className="text-xs font-black uppercase tracking-widest text-text-muted mb-3">
            Layout
          </h3>
          <div className="flex gap-2 flex-wrap">
            {layouts.map(l => (
              <button
                key={l}
                onClick={() => setActiveLayout(l)}
                className={cn(
                  "px-4 py-2 rounded-lg border text-sm font-semibold transition-all",
                  activeLayout === l
                    ? "bg-action-primary text-action-primary-fg border-action-primary"
                    : "bg-surface-card border-border-default hover:bg-surface-tertiary text-text-primary"
                )}
              >
                {LAYOUT_LABELS[l] ?? l}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Densité ── */}
      <section>
        <h3 className="text-xs font-black uppercase tracking-widest text-text-muted mb-3">
          Densité UI
        </h3>
        <div className="flex gap-2 flex-wrap">
          {DENSITY_OPTIONS.map(d => (
            <button
              key={d.id}
              onClick={() => handleDensityClick(d.id)}
              title={d.desc}
              className={cn(
                "px-4 py-2 rounded-lg border text-sm font-semibold transition-all",
                activeDensity === d.id
                  ? "bg-action-primary text-action-primary-fg border-action-primary"
                  : "bg-surface-card border-border-default hover:bg-surface-tertiary text-text-primary"
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── Presets de style ── */}
      {presets.length > 0 && (
        <section>
          <h3 className="text-xs font-black uppercase tracking-widest text-text-muted mb-3">
            Preset de style
          </h3>
          <div className="flex gap-3 flex-wrap">
            {presets.map(preset => (
              <button
                key={preset.id}
                onClick={() => handlePresetClick(preset)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all",
                  activePreset === preset.id
                    ? "border-action-primary ring-2 ring-action-primary/30"
                    : "bg-surface-card border-border-default hover:bg-surface-tertiary"
                )}
              >
                {/* Pastille couleur */}
                <span
                  className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/20"
                  style={{ backgroundColor: preset.primaryColor }}
                />
                {preset.label}
              </button>
            ))}
            <button
              onClick={() => setActivePreset(null)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all",
                !activePreset
                  ? "border-action-primary ring-2 ring-action-primary/30"
                  : "bg-surface-card border-border-default hover:bg-surface-tertiary"
              )}
            >
              Sur mesure
            </button>
          </div>
        </section>
      )}

      {/* ── Actions ── */}
      <div className="flex items-center gap-3 pt-2 border-t border-border-default">
        <button
          onClick={handleApply}
          disabled={isApplying || !onApply}
          className={cn(
            "px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
            "bg-action-primary text-action-primary-fg hover:opacity-90 disabled:opacity-50"
          )}
        >
          {isApplying ? 'Application…' : 'Appliquer'}
        </button>
        <p className="text-xs text-text-muted">
          L&apos;aperçu est live — &quot;Appliquer&quot; enregistre définitivement.
        </p>
      </div>

    </div>
  );
}
