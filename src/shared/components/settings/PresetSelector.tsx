'use client';

import React from 'react';
import { useAtomValue } from 'jotai';
import { tenantVariantAtom } from '@/store/pillars/sovereign';
import { VERTICAL_STYLE_PRESETS, type StylePreset } from '@/shared/nexus/tokens/verticals/presets';
import type { BrandConfig } from '@/shared/nexus/tokens/brand';
import { Wand2, CheckCircle2 } from 'lucide-react';
import { SectionCard } from '@/shared/components/ui/SectionCard';

/**
 * 🎨 PresetSelector — Sélection 1-clic d'un preset d'ambiance verticale.
 *
 * Affiche les presets stylistiques du vertical courant (ex. Luxe, Bistro, Moderne
 * pour restaurant ; Palace, Boutique, Resort pour hôtel) et applique les tokens
 * correspondants au draft du BrandingPanel.
 *
 * Les 32 presets sont définis dans `verticals/presets.ts` et indexés par variant.
 *
 * Extrait du BrandingPanel pour respecter ADR-015 (max 400 lignes par composant).
 */

interface PresetSelectorProps {
    draft: Partial<BrandConfig>;
    onApplyPreset: (patch: Partial<BrandConfig>) => void;
}

export function PresetSelector({ draft, onApplyPreset }: PresetSelectorProps) {
    const variant = useAtomValue(tenantVariantAtom);
    const presets: StylePreset[] = VERTICAL_STYLE_PRESETS[variant] ?? VERTICAL_STYLE_PRESETS.custom;

    const isActive = (preset: StylePreset) =>
        draft.primaryColor === preset.primaryColor && draft.fontBrand === (preset.fontBrand ?? draft.fontBrand);

    const handleSelect = (preset: StylePreset) => {
        const patch: Partial<BrandConfig> = {
            primaryColor: preset.primaryColor,
            accentColor: preset.accentColor ?? preset.primaryColor,
            brandingMode: 'custom',
        };

        if (preset.fontBrand) {
            patch.fontBrand = preset.fontBrand;
            if (preset.fontBrandUrl) patch.fontBrandUrl = preset.fontBrandUrl;
        }

        onApplyPreset(patch);
    };

    return (
        <SectionCard
            title="Presets d'Ambiance"
            subtitle={`${presets.length} ambiances prédéfinies pour la verticale ${variant}`}
            icon={Wand2}
        >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {presets.map((preset) => {
                    const active = isActive(preset);
                    return (
                        <button
                            key={preset.id}
                            type="button"
                            onClick={() => handleSelect(preset)}
                            className={`group relative p-3 rounded-2xl border-2 transition-all duration-200 text-left ${
                                active
                                    ? 'border-action-primary shadow-lg shadow-action-primary/20 scale-[1.02]'
                                    : 'border-border-default hover:border-action-primary/40 hover:shadow-md'
                            }`}
                        >
                            {/* Color Swatch */}
                            <div className="flex items-center gap-1.5 mb-2">
                                <div
                                    className="w-6 h-6 rounded-lg shadow-inner ring-1 ring-black/10"
                                    style={{ backgroundColor: preset.primaryColor }}
                                />
                                {preset.accentColor && (
                                    <div
                                        className="w-4 h-4 rounded-md shadow-inner ring-1 ring-black/10"
                                        style={{ backgroundColor: preset.accentColor }}
                                    />
                                )}
                                {active && (
                                    <CheckCircle2 className="w-4 h-4 text-action-primary ml-auto" />
                                )}
                            </div>

                            {/* Label */}
                            <div className="text-xs font-bold text-text-primary">
                                {preset.label}
                            </div>
                            <div className="text-[10px] text-text-muted mt-0.5">
                                {preset.appearance === 'dark' ? '🌙 Sombre' : '☀️ Clair'}
                                {preset.fontBrand && ` • ${preset.fontBrand}`}
                            </div>

                            {/* Preview bar */}
                            <div
                                className="mt-2 h-1 rounded-full opacity-80"
                                style={{
                                    background: `linear-gradient(90deg, ${preset.primaryColor} 0%, ${preset.accentColor ?? preset.primaryColor} 100%)`,
                                }}
                            />
                        </button>
                    );
                })}
            </div>
        </SectionCard>
    );
}
