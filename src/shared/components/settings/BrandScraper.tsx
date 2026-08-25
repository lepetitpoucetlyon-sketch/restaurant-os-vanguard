'use client';

import { useState } from 'react';
import { Globe, Wand2, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@ui/Button';
import { useToast } from '@ui/Toast';
import { useBrandEditor } from '@/shared/hooks/useBrandEditor';
import { authedFetch } from '@/lib/client/authedFetch';
import type { BrandConfig } from '@/shared/nexus/tokens/brand';

type ExtractedTokens = Partial<BrandConfig>

/**
 * Saisir l'URL du restaurant → Gemini Vision analyse la charte → preview → appliquer.
 * Le tenant est résolu côté serveur depuis le JWT (authedFetch).
 */
export function BrandScraper() {
  const { saveTokens, isSaving } = useBrandEditor();
  const { showToast } = useToast();

  const [url, setUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedTokens | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExtract = async () => {
    if (!url.trim()) return;
    setIsExtracting(true);
    setExtracted(null);
    setError(null);

    try {
      const res = await authedFetch('/api/admin/brand/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erreur extraction');

      setExtracted(data.tokens);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleApply = async () => {
    if (!extracted) return;
    await saveTokens(extracted);
    showToast('Charte graphique appliquée — interface mise à jour', 'success');
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-bold uppercase tracking-widest text-text-primary block mb-3">
          Extraction automatique depuis votre site
        </label>
        <p className="text-sm text-text-muted mb-4">
          Entrez l'URL de votre site ou de votre page Instagram.
          Notre IA capture la charte graphique et pré-remplit vos couleurs, polices et ambiance.
        </p>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleExtract()}
              placeholder="https://mon-restaurant.fr"
              className="w-full pl-10 pr-4 h-12 rounded-xl border border-border bg-bg-secondary text-text-primary placeholder:text-text-muted focus:outline-none focus:border-action-primary text-sm"
            />
          </div>
          <Button
            onClick={handleExtract}
            disabled={isExtracting || !url.trim()}
            className="h-12 px-6 rounded-xl bg-action-primary text-text-primary font-bold uppercase tracking-widest text-xs hover:bg-action-primaryHover disabled:opacity-40 transition-all"
          >
            {isExtracting
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <><Wand2 className="w-4 h-4 mr-2" /> Analyser</>
            }
          </Button>
        </div>
      </div>

      {/* Preview résultat */}
      {extracted && (
        <div className="border border-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 bg-bg-secondary border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-text-primary">
              <CheckCircle2 className="w-4 h-4 text-status-success" />
              Charte détectée
            </div>
            <Button
              onClick={handleApply}
              disabled={isSaving}
              className="h-9 px-5 rounded-full bg-status-success text-text-primary font-bold uppercase tracking-widest text-[10px] hover:opacity-90 transition-all"
            >
              {isSaving
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : 'Appliquer'
              }
            </Button>
          </div>

          <div className="p-6 grid grid-cols-2 gap-4">
            {extracted.brandName && (
              <div>
                <span className="text-xs text-text-muted uppercase tracking-widest font-bold block mb-1">Nom</span>
                <span className="text-sm font-semibold text-text-primary">{extracted.brandName}</span>
              </div>
            )}
            {extracted.primaryColor && (
              <div>
                <span className="text-xs text-text-muted uppercase tracking-widest font-bold block mb-1">Couleur principale</span>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full border border-border shadow-sm"
                    style={{ backgroundColor: extracted.primaryColor }}
                  />
                  <span className="text-sm font-mono text-text-primary">{extracted.primaryColor}</span>
                </div>
              </div>
            )}
            {extracted.fontBrand && (
              <div>
                <span className="text-xs text-text-muted uppercase tracking-widest font-bold block mb-1">Police</span>
                <span className="text-sm font-semibold text-text-primary" style={{ fontFamily: extracted.fontBrand }}>
                  {extracted.fontBrand}
                </span>
              </div>
            )}
            {extracted.surfaceBg && (
              <div>
                <span className="text-xs text-text-muted uppercase tracking-widest font-bold block mb-1">Ambiance</span>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full border border-border shadow-sm"
                    style={{ backgroundColor: extracted.surfaceBg }}
                  />
                  <span className="text-sm font-semibold text-text-primary">{extracted.surfaceBg}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-status-danger/10 border border-status-danger/20">
          <AlertTriangle className="w-4 h-4 text-status-danger mt-0.5 shrink-0" />
          <p className="text-sm text-status-danger">{error}</p>
        </div>
      )}
    </div>
  );
}
