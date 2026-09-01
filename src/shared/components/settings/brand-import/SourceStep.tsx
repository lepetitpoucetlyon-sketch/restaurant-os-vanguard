import React, { useState, useCallback } from 'react';
import { Loader2, Globe, Palette } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';
import { useToast } from '@ui/Toast';
import type { BrandInput } from '@/modules/intelligence';
import type { ExtractedBrand } from './brandWizardTypes';

interface SourceStepProps {
  onExtracted: (brand: ExtractedBrand) => void;
}

export function SourceStep({ onExtracted }: SourceStepProps) {
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
