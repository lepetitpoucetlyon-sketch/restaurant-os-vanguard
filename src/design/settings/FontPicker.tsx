'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/ui.foundations';
import { useAtomValue } from 'jotai';
import { tenantVariantAtom } from '@/store/pillars/sovereign';
import { useBrandEditor } from '@/shared/hooks/useBrandEditor';
import { useToast } from '@ui/Toast';
import type { PlatformVariant } from '@nexus/contracts';

// ── Catalogue de fonts par rôle et par vertical ───────────────────────────────

interface FontOption {
  name: string;
  url?: string;     // undefined = police système, pas de chargement
  preview: string;  // texte de prévisualisation
  weight: string;   // classe Tailwind pour le rendu de prévisualisation
}

/** Polices disponibles pour --font-brand (titres, KPI) */
const BRAND_FONT_OPTIONS: Record<PlatformVariant, FontOption[]> = {
  restaurant: [
    { name: 'Playfair Display', url: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap', preview: 'La Maison Dorée', weight: 'font-semibold' },
    { name: 'Cormorant Garamond', url: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap', preview: 'La Table du Chef', weight: 'font-semibold' },
    { name: 'Libre Baskerville', url: 'https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital@0;1&display=swap', preview: 'Le Bistrot Parisien', weight: 'font-bold' },
    { name: 'Lora', url: 'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&display=swap', preview: 'Brasserie du Port', weight: 'font-medium' },
    { name: 'Inter', preview: 'Restaurant Moderne', weight: 'font-semibold' },
  ],
  hotel: [
    { name: 'Cormorant Garamond', url: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap', preview: 'Grand Hôtel Palace', weight: 'font-semibold' },
    { name: 'Playfair Display', url: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap', preview: 'Château Prestige', weight: 'font-semibold' },
    { name: 'Cinzel', url: 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&display=swap', preview: 'Hotel Victoria', weight: 'font-semibold' },
    { name: 'EB Garamond', url: 'https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;1,400&display=swap', preview: 'Maison Luxe', weight: 'font-medium' },
  ],
  bakery: [
    { name: 'Lora', url: 'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&display=swap', preview: 'Boulangerie Artisan', weight: 'font-medium' },
    { name: 'Merriweather', url: 'https://fonts.googleapis.com/css2?family=Merriweather:ital@0;1&display=swap', preview: 'Au Bon Pain', weight: 'font-bold' },
    { name: 'Playfair Display', url: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap', preview: 'La Viennoiserie', weight: 'font-semibold' },
    { name: 'Nunito', url: 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap', preview: 'Pâtisserie Douce', weight: 'font-bold' },
  ],
  salon: [
    { name: 'Cormorant Garamond', url: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap', preview: 'Studio Élégance', weight: 'font-semibold' },
    { name: 'Libre Baskerville', url: 'https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital@0;1&display=swap', preview: 'Beauté & Soin', weight: 'font-medium' },
    { name: 'Playfair Display', url: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap', preview: 'Salon Prestige', weight: 'font-semibold' },
    { name: 'DM Sans', url: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap', preview: 'Beauty Studio', weight: 'font-semibold' },
  ],
  clinic: [
    { name: 'Inter', preview: 'Cabinet Médical', weight: 'font-semibold' },
    { name: 'DM Sans', url: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap', preview: 'Centre de Santé', weight: 'font-semibold' },
    { name: 'Source Serif 4', url: 'https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,wght@0,400;0,600;1,400&display=swap', preview: 'Clinique Sérénité', weight: 'font-semibold' },
    { name: 'Lato', url: 'https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,400;0,700;1,400&display=swap', preview: 'Médecine Moderne', weight: 'font-bold' },
  ],
  garage: [
    { name: 'Rajdhani', url: 'https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&display=swap', preview: 'Garage Auto Pro', weight: 'font-bold' },
    { name: 'Barlow', url: 'https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&display=swap', preview: 'Mécanique Express', weight: 'font-semibold' },
    { name: 'Bebas Neue', url: 'https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap', preview: 'SPEED AUTO', weight: 'font-normal' },
    { name: 'Exo 2', url: 'https://fonts.googleapis.com/css2?family=Exo+2:wght@400;600;700&display=swap', preview: 'TechMoto Service', weight: 'font-semibold' },
  ],
  retail: [
    { name: 'Poppins', url: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap', preview: 'Ma Boutique', weight: 'font-semibold' },
    { name: 'Nunito', url: 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap', preview: 'Shop & More', weight: 'font-bold' },
    { name: 'Raleway', url: 'https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700&display=swap', preview: 'Boutique Chic', weight: 'font-semibold' },
    { name: 'Inter', preview: 'Commerce Direct', weight: 'font-semibold' },
  ],
  custom: [
    { name: 'Inter', preview: 'Mon Interface', weight: 'font-semibold' },
    { name: 'Poppins', url: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap', preview: 'Ma Marque', weight: 'font-semibold' },
    { name: 'Nunito', url: 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap', preview: 'Mon Projet', weight: 'font-bold' },
    { name: 'Lato', url: 'https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap', preview: 'Studio Custom', weight: 'font-semibold' },
  ],
};

/** Polices disponibles pour --font-ui (corps, labels, boutons) */
const UI_FONT_OPTIONS: FontOption[] = [
  { name: 'Inter',   preview: 'Corps et labels', weight: 'font-normal' },
  { name: 'DM Sans', url: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap', preview: 'Corps et labels', weight: 'font-normal' },
  { name: 'Nunito',  url: 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700&display=swap', preview: 'Corps et labels', weight: 'font-normal' },
  { name: 'Barlow',  url: 'https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&display=swap', preview: 'Corps et labels', weight: 'font-normal' },
  { name: 'Lato',    url: 'https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap', preview: 'Corps et labels', weight: 'font-normal' },
  { name: 'Poppins', url: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap', preview: 'Corps et labels', weight: 'font-normal' },
];

/** Polices disponibles pour --font-mono (tickets, codes, données) */
const MONO_FONT_OPTIONS: FontOption[] = [
  { name: 'JetBrains Mono', url: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap', preview: 'TKT-00042  12.50€', weight: 'font-normal' },
  { name: 'IBM Plex Mono',  url: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap', preview: 'PAT-00042  ID: A3X', weight: 'font-normal' },
  { name: 'Roboto Mono',    url: 'https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500&display=swap', preview: 'VIN: 4Y1SL65848Z', weight: 'font-normal' },
  { name: 'Space Mono',     url: 'https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap', preview: 'LOT-2024-00312', weight: 'font-normal' },
  { name: 'DM Mono',        url: 'https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap', preview: 'RDV-20240915-01', weight: 'font-normal' },
];

// ── Font card ─────────────────────────────────────────────────────────────────

function FontCard({
  option,
  selected,
  cssVar,
  onSelect,
}: {
  option: FontOption;
  selected: boolean;
  cssVar: string;
  onSelect: () => void;
}) {
  useEffect(() => {
    if (!option.url) return;
    const existing = document.querySelector(`link[data-picker-font="${option.name}"]`);
    if (!existing) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = option.url;
      link.setAttribute('data-picker-font', option.name);
      document.head.appendChild(link);
    }
  }, [option.name, option.url]);

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left p-3 rounded-xl border-2 transition-all",
        selected
          ? "border-action-primary bg-action-primary/5"
          : "border-border-default hover:border-border-default/80 hover:bg-surface-card"
      )}
    >
      <p
        className={cn("text-sm text-text-primary leading-tight truncate", option.weight)}
        style={{ fontFamily: `'${option.name}', system-ui` }}
      >
        {option.preview}
      </p>
      <p className="text-[10px] font-mono text-text-muted mt-1 tracking-wide">{option.name}</p>
    </button>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────

function FontSection({
  label,
  role,
  options,
  selected,
  onSelect,
}: {
  label: string;
  role: string;
  options: FontOption[];
  selected: string | undefined;
  onSelect: (opt: FontOption) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-xs font-black uppercase tracking-widest text-text-muted">{label}</p>
        <code className="text-[10px] text-text-muted font-mono">{role}</code>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {options.map(opt => (
          <FontCard
            key={opt.name}
            option={opt}
            selected={selected === opt.name}
            cssVar={role}
            onSelect={() => onSelect(opt)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface FontPickerProps {
  className?: string;
  currentFontBrand?: string;
  currentFontUI?: string;
  currentFontMono?: string;
}

export function FontPicker({ className, currentFontBrand, currentFontUI, currentFontMono }: FontPickerProps) {
  const variant = useAtomValue(tenantVariantAtom);
  const { saveTokens } = useBrandEditor();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  const [brandFont, setBrandFont]   = useState<FontOption | null>(null);
  const [uiFont, setUiFont]         = useState<FontOption | null>(null);
  const [monoFont, setMonoFont]     = useState<FontOption | null>(null);

  const brandOptions = BRAND_FONT_OPTIONS[variant] ?? BRAND_FONT_OPTIONS.custom;

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveTokens({
        ...(brandFont ? { fontBrand: brandFont.name, fontBrandUrl: brandFont.url } : {}),
        ...(uiFont    ? { fontUI:    uiFont.name,    fontUIUrl:    uiFont.url    } : {}),
        ...(monoFont  ? { fontMono:  monoFont.name,  fontMonoUrl:  monoFont.url  } : {}),
      });
      showToast('Polices appliquées en temps réel', 'success');
    } catch {
      showToast('Erreur lors de la sauvegarde', 'error');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = brandFont || uiFont || monoFont;

  return (
    <div className={cn("space-y-6", className)}>
      <FontSection
        label="Police de titre (brand)"
        role="--font-brand"
        options={brandOptions}
        selected={brandFont?.name ?? currentFontBrand}
        onSelect={setBrandFont}
      />

      <div className="h-px bg-border-default" />

      <FontSection
        label="Police d'interface (ui)"
        role="--font-ui"
        options={UI_FONT_OPTIONS}
        selected={uiFont?.name ?? currentFontUI}
        onSelect={setUiFont}
      />

      <div className="h-px bg-border-default" />

      <FontSection
        label="Police mono (tickets / codes)"
        role="--font-mono"
        options={MONO_FONT_OPTIONS}
        selected={monoFont?.name ?? currentFontMono}
        onSelect={setMonoFont}
      />

      {hasChanges && (
        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            "w-full py-3 rounded-xl font-semibold text-sm transition-colors",
            "bg-action-primary text-action-primary-fg hover:bg-action-primary-hover",
            saving && "opacity-60 cursor-not-allowed"
          )}
        >
          {saving ? "Application…" : "Appliquer les polices"}
        </button>
      )}

      <p className="text-[10px] text-text-muted text-center">
        Les polices sont chargées via Google Fonts — une seule requête si brand = ui.
      </p>
    </div>
  );
}
