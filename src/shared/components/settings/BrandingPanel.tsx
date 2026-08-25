'use client';

import React, { useState } from 'react';
import { useAtomValue } from 'jotai';
import { tenantBrandTokensAtom, activeTenantIdAtom } from '@/store/pillars/sovereign';
import { defaultBrandTokens, type BrandConfig } from '@/shared/nexus/tokens/brand';
import { useBrandEditor } from '@/shared/hooks/useBrandEditor';
import { useToast, Button, SectionCard, StatusBadge } from '@/shared/components/ui';
import { BrandScraper } from './BrandScraper';
import { PresetSelector } from './PresetSelector';
import {
  Palette,
  Type,
  Maximize2,
  Sparkles,
  Save,
  RotateCcw,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  Upload,
  Globe,
  Wand2,
} from 'lucide-react';

/**
 * Calcule le ratio de contraste WCAG 2.1 entre deux couleurs hex.
 * Retourne le ratio (ex: 4.5) et le niveau (AA, AAA, ou FAIL).
 */
function wcagContrastRatio(fg: string, bg: string): { ratio: number; level: 'AAA' | 'AA' | 'FAIL' } {
    const luminance = (hex: string) => {
        const c = hex.replace('#', '');
        if (c.length !== 6) return 0;
        const [r, g, b] = [0, 2, 4].map(i => {
            const v = parseInt(c.substring(i, i + 2), 16) / 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const l1 = luminance(fg);
    const l2 = luminance(bg);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    return { ratio: Math.round(ratio * 100) / 100, level: ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : 'FAIL' };
}

const GOOGLE_FONTS_PRESETS = [
  { label: 'Playfair Display (Élégant)', name: 'Playfair Display', url: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap' },
  { label: 'Cormorant Garamond (Luxe)', name: 'Cormorant Garamond', url: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,700;1,400&display=swap' },
  { label: 'Cinzel (Empire)', name: 'Cinzel', url: 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&display=swap' },
  { label: 'Inter (Moderne neutre)', name: 'Inter', url: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap' },
  { label: 'Outfit (Contemporain)', name: 'Outfit', url: 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap' },
  { label: 'Plus Jakarta Sans (Tech)', name: 'Plus Jakarta Sans', url: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap' },
  { label: 'JetBrains Mono (Précision)', name: 'JetBrains Mono', url: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap' },
];

export function BrandingPanel() {
  const activeTenantId = useAtomValue(activeTenantIdAtom);
  const rawTokens = useAtomValue(tenantBrandTokensAtom);
  const { saveTokens, isSaving, uploadAsset, isUploading } = useBrandEditor();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'radii' | 'glass' | 'splash' | 'presets' | 'import'>('colors');

  // Draft local pour live preview sans persistance immédiate
  const [draft, setDraft] = useState<Partial<BrandConfig>>(() => {
    return (rawTokens as Partial<BrandConfig>) ?? defaultBrandTokens;
  });

  const updateDraft = (key: keyof BrandConfig, value: unknown) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      await saveTokens(draft);
      showToast('Charte graphique enregistrée avec succès', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde', 'error');
    }
  };

  const handleReset = () => {
    setDraft((rawTokens as Partial<BrandConfig>) ?? defaultBrandTokens);
    showToast('Modifications réinitialisées', 'info');
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadAsset(file, 'logo');
      updateDraft('logoUrl', url);
      showToast('Logo importé avec succès', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Échec de l’upload', 'error');
    }
  };

  const handleJsonImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setDraft((prev) => ({ ...prev, ...json }));
        showToast('Tokens importés depuis le fichier JSON', 'success');
      } catch {
        showToast('Fichier JSON invalide', 'error');
      }
    };
    reader.readAsText(file);
  };

  const primary = draft.primaryColor ?? '#C5A059';

  return (
    <div className="space-y-8">
      {/* Top Controls & Persistence Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-surface-card border border-border-default">
        <div>
          <h2 className="font-serif text-lg font-bold text-text-primary">
            Personnalisation de la Charte Tenant
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Tenant actif : <code className="text-action-primary font-mono">{activeTenantId ?? 'default'}</code>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleReset} disabled={isSaving}>
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Réinitialiser
          </Button>
          <Button variant="default" size="sm" onClick={handleSave} disabled={isSaving}>
            <Save className="w-3.5 h-3.5 mr-1.5" />
            {isSaving ? 'Enregistrement...' : 'Enregistrer la Charte'}
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-border-default pb-3">
        {[
          { id: 'colors', label: 'Couleurs', icon: Palette },
          { id: 'typography', label: 'Typographie', icon: Type },
          { id: 'radii', label: 'Formes & Radius', icon: Maximize2 },
          { id: 'glass', label: 'Glassmorphism', icon: Sparkles },
          { id: 'splash', label: 'Splash Screen', icon: Sliders },
          { id: 'presets', label: 'Presets', icon: Wand2 },
          { id: 'import', label: 'Import & IA', icon: Globe },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-action-primary text-text-on-primary shadow-sm font-semibold'
                  : 'bg-surface-card hover:bg-surface-card/80 text-text-secondary hover:text-text-primary border border-border-default'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Grid: Controls + Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {activeTab === 'colors' && (
            <SectionCard title="Palette de Couleurs" subtitle="Couleurs sémantiques et d'action du restaurant" icon={Palette}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">
                      Couleur Primaire (Action / Focus)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={draft.primaryColor ?? '#C5A059'}
                        onChange={(e) => updateDraft('primaryColor', e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer border border-border-default"
                      />
                      <input
                        type="text"
                        value={draft.primaryColor ?? '#C5A059'}
                        onChange={(e) => updateDraft('primaryColor', e.target.value)}
                        className="flex-1 px-3 py-2 text-xs rounded-lg border border-border-default bg-surface-bg font-mono"
                      />
                    </div>
                  </div>

                  {/* WCAG Contrast Badge */}
                  {(() => {
                    const { ratio, level } = wcagContrastRatio('#FFFFFF', draft.primaryColor ?? '#C5A059');
                    return (
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                        level === 'AAA' ? 'bg-emerald-500/10 text-emerald-500' :
                        level === 'AA' ? 'bg-amber-500/10 text-amber-500' :
                        'bg-red-500/10 text-red-500'
                      }`}>
                        <ShieldCheck className="w-3 h-3" />
                        Contraste {level} ({ratio}:1)
                      </div>
                    );
                  })()}

                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">
                      Couleur Survol (Primary Hover)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={draft.primaryHover ?? '#B08D46'}
                        onChange={(e) => updateDraft('primaryHover', e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer border border-border-default"
                      />
                      <input
                        type="text"
                        value={draft.primaryHover ?? '#B08D46'}
                        onChange={(e) => updateDraft('primaryHover', e.target.value)}
                        className="flex-1 px-3 py-2 text-xs rounded-lg border border-border-default bg-surface-bg font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border-subtle">
                  <div>
                    <label className="block text-[11px] font-medium text-text-secondary mb-1">
                      Statut Succès
                    </label>
                    <input
                      type="color"
                      value={draft.statusSuccess ?? '#059669'}
                      onChange={(e) => updateDraft('statusSuccess', e.target.value)}
                      className="w-full h-8 rounded-lg cursor-pointer border border-border-default"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-text-secondary mb-1">
                      Statut Avertissement
                    </label>
                    <input
                      type="color"
                      value={draft.statusWarning ?? '#F59E0B'}
                      onChange={(e) => updateDraft('statusWarning', e.target.value)}
                      className="w-full h-8 rounded-lg cursor-pointer border border-border-default"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-text-secondary mb-1">
                      Statut Danger / Erreur
                    </label>
                    <input
                      type="color"
                      value={draft.statusDanger ?? '#DC2626'}
                      onChange={(e) => updateDraft('statusDanger', e.target.value)}
                      className="w-full h-8 rounded-lg cursor-pointer border border-border-default"
                    />
                  </div>
                </div>
              </div>
            </SectionCard>
          )}

          {activeTab === 'typography' && (
            <SectionCard title="Typographie & Polices" subtitle="Polices Google Fonts pour les titres et l'interface" icon={Type}>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-2">
                    Police de Titres & Identité (font-brand)
                  </label>
                  <select
                    value={draft.fontBrand ?? 'Playfair Display'}
                    onChange={(e) => {
                      const preset = GOOGLE_FONTS_PRESETS.find((p) => p.name === e.target.value);
                      updateDraft('fontBrand', preset?.name ?? e.target.value);
                      if (preset?.url) updateDraft('fontBrandUrl', preset.url);
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-default bg-surface-card"
                  >
                    {GOOGLE_FONTS_PRESETS.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-2">
                    Police d'Interface (font-ui)
                  </label>
                  <select
                    value={draft.fontUI ?? 'Inter'}
                    onChange={(e) => {
                      const preset = GOOGLE_FONTS_PRESETS.find((p) => p.name === e.target.value);
                      updateDraft('fontUI', preset?.name ?? e.target.value);
                      if (preset?.url) updateDraft('fontUIUrl', preset.url);
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-default bg-surface-card"
                  >
                    {GOOGLE_FONTS_PRESETS.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </SectionCard>
          )}

          {activeTab === 'radii' && (
            <SectionCard title="Formes & Rayons de Courbure" subtitle="Arrondeur des cartes et des boutons" icon={Maximize2}>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-2">
                    Rayon des Cartes (borderRadiusCard)
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {(['sm', 'md', 'lg', 'full'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => updateDraft('borderRadiusCard', r)}
                        className={`p-3 rounded-xl text-xs font-semibold border transition-all ${
                          draft.borderRadiusCard === r
                            ? 'border-action-primary bg-action-primary/10 text-action-primary'
                            : 'border-border-default bg-surface-card text-text-secondary'
                        }`}
                      >
                        {r.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-2">
                    Rayon des Boutons (borderRadiusBtn)
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {(['sm', 'md', 'lg', 'full'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => updateDraft('borderRadiusBtn', r)}
                        className={`p-3 rounded-xl text-xs font-semibold border transition-all ${
                          draft.borderRadiusBtn === r
                            ? 'border-action-primary bg-action-primary/10 text-action-primary'
                            : 'border-border-default bg-surface-card text-text-secondary'
                        }`}
                      >
                        {r.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>
          )}

          {activeTab === 'glass' && (
            <SectionCard title="Effet Glassmorphism" subtitle="Flou d'arrière-plan et opacité des surfaces" icon={Sparkles}>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-2">
                    Intensité du Flou (glassBlur)
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {(['none', 'sm', 'md', 'lg'] as const).map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => updateDraft('glassBlur', b)}
                        className={`p-3 rounded-xl text-xs font-semibold border transition-all ${
                          draft.glassBlur === b
                            ? 'border-action-primary bg-action-primary/10 text-action-primary'
                            : 'border-border-default bg-surface-card text-text-secondary'
                        }`}
                      >
                        {b.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-2">
                    Opacité de la Surface (glassOpacity)
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['low', 'medium', 'high'] as const).map((op) => (
                      <button
                        key={op}
                        type="button"
                        onClick={() => updateDraft('glassOpacity', op)}
                        className={`p-3 rounded-xl text-xs font-semibold border transition-all ${
                          draft.glassOpacity === op
                            ? 'border-action-primary bg-action-primary/10 text-action-primary'
                            : 'border-border-default bg-surface-card text-text-secondary'
                        }`}
                      >
                        {op.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>
          )}

          {activeTab === 'splash' && (
            <SectionCard title="Écran de Démarrage (Splash)" subtitle="Configuration du splash cinématique au lancement" icon={Sliders}>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-2">
                    Politique d'Affichage du Splash
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'always', label: 'À chaque ouverture', desc: 'Splash cinématique ~1.5s' },
                      { id: 'first-boot', label: 'Une fois / session', desc: 'Au premier chargement' },
                      { id: 'never', label: 'Désactivé', desc: 'Démarrage instantané' },
                    ].map((pol) => (
                      <button
                        key={pol.id}
                        type="button"
                        onClick={() => updateDraft('splashPolicy', pol.id)}
                        className={`p-3 rounded-xl text-left border transition-all ${
                          draft.splashPolicy === pol.id
                            ? 'border-action-primary bg-action-primary/10 text-text-primary'
                            : 'border-border-default bg-surface-card text-text-secondary'
                        }`}
                      >
                        <div className="text-xs font-bold">{pol.label}</div>
                        <div className="text-[10px] text-text-muted mt-1">{pol.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-2">
                    Upload de Logo Branded
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="px-4 py-2 rounded-xl bg-surface-card border border-border-default hover:bg-surface-card/80 text-xs font-medium cursor-pointer flex items-center gap-2">
                      <Upload className="w-4 h-4 text-action-primary" />
                      <span>{isUploading ? 'Import en cours...' : 'Choisir une image'}</span>
                      <input
                        type="file"
                        accept="image/png,image/svg+xml,image/jpeg"
                        onChange={handleLogoUpload}
                        className="hidden"
                        disabled={isUploading}
                      />
                    </label>
                    {draft.logoUrl && (
                      <span className="text-xs text-status-success flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Logo chargé
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </SectionCard>
          )}

          {activeTab === 'import' && (
            <SectionCard title="Import de Charte & IA" subtitle="Extraction automatique par IA ou import de tokens JSON" icon={Globe}>
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-text-primary mb-2">
                    Extraction par IA depuis l'URL de votre Restaurant
                  </h4>
                  <BrandScraper />
                </div>

                <div className="pt-6 border-t border-border-subtle">
                  <h4 className="text-xs font-bold text-text-primary mb-2">
                    Import de Fichier JSON (Design Tokens)
                  </h4>
                  <label className="px-4 py-2 rounded-xl bg-surface-card border border-border-default hover:bg-surface-card/80 text-xs font-medium cursor-pointer inline-flex items-center gap-2">
                    <Upload className="w-4 h-4 text-action-primary" />
                    <span>Sélectionner tokens.json</span>
                    <input type="file" accept=".json" onChange={handleJsonImport} className="hidden" />
                  </label>
                </div>
              </div>
            </SectionCard>
          )}

          {activeTab === 'presets' && (
            <PresetSelector
              draft={draft}
              onApplyPreset={(patch) => setDraft(prev => ({ ...prev, ...patch }))}
            />
          )}
        </div>

        {/* Right Column: Live Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="sticky top-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-text-muted mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-action-primary" />
              Aperçu en Direct (Live Preview)
            </h3>

            <div
              className="p-6 rounded-3xl border border-white/10 bg-[#0B0B0C] shadow-2xl space-y-6 overflow-hidden"
              style={{
                fontFamily: draft.fontUI ?? 'Inter, sans-serif',
              }}
            >
              {/* Header Preview */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {draft.logoUrl ? (
                    <img src={draft.logoUrl} alt="Logo" className="max-h-8 max-w-[120px] object-contain" />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-lg"
                      style={{ backgroundColor: primary, fontFamily: draft.fontBrand ?? 'serif' }}
                    >
                      R
                    </div>
                  )}
                  <div>
                    <div
                      className="text-sm font-bold text-white"
                      style={{ fontFamily: draft.fontBrand ?? 'serif' }}
                    >
                      {draft.brandName ?? 'Restaurant OS'}
                    </div>
                    <div className="text-[10px] text-white/50">{draft.tagline ?? 'Live Preview'}</div>
                  </div>
                </div>

                <StatusBadge status="success" label="En Ligne" />
              </div>

              {/* StatCard Preview */}
              <div className="grid grid-cols-2 gap-3">
                <div
                  className="p-4 rounded-2xl border border-white/10 bg-surface-glass-hover backdrop-blur-md"
                  style={{
                    borderRadius: draft.borderRadiusCard === 'sm' ? '8px' : draft.borderRadiusCard === 'lg' ? '20px' : '12px',
                  }}
                >
                  <div className="text-[9px] uppercase tracking-wider text-white/50">CA du Jour</div>
                  <div
                    className="text-xl font-bold text-white mt-1"
                    style={{ fontFamily: draft.fontBrand ?? 'serif', color: primary }}
                  >
                    1 480 €
                  </div>
                </div>

                <div
                  className="p-4 rounded-2xl border border-white/10 bg-surface-glass-hover backdrop-blur-md"
                  style={{
                    borderRadius: draft.borderRadiusCard === 'sm' ? '8px' : draft.borderRadiusCard === 'lg' ? '20px' : '12px',
                  }}
                >
                  <div className="text-[9px] uppercase tracking-wider text-white/50">Couverts</div>
                  <div
                    className="text-xl font-bold text-white mt-1"
                    style={{ fontFamily: draft.fontBrand ?? 'serif' }}
                  >
                    48
                  </div>
                </div>
              </div>

              {/* Action Button Preview */}
              <div className="space-y-2">
                <button
                  type="button"
                  className="w-full py-2.5 px-4 text-xs font-bold text-white shadow-lg transition-all"
                  style={{
                    backgroundColor: primary,
                    borderRadius: draft.borderRadiusBtn === 'sm' ? '6px' : draft.borderRadiusBtn === 'full' ? '9999px' : '10px',
                  }}
                >
                  Bouton d'Action Primaire
                </button>
                <button
                  type="button"
                  className="w-full py-2.5 px-4 text-xs font-semibold text-white/70 border border-white/15 bg-white/5"
                  style={{
                    borderRadius: draft.borderRadiusBtn === 'sm' ? '6px' : draft.borderRadiusBtn === 'full' ? '9999px' : '10px',
                  }}
                >
                  Action Secondaire
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
