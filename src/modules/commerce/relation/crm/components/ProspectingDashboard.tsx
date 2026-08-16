"use client";

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useToast } from '@ui/Toast';
import { useBrandEditor } from '@/shared/hooks/useBrandEditor';
import { authedFetch } from '@/lib/client/authedFetch';
import { BrandingUI } from '@/lib/BrandingUI';
import { useSettings } from '@/shared/contexts/SettingsContext';
import type { BrandInput } from '@/lib/BrandingService';
import type { ExtractedTokens, Phase } from './prospecting/prospectingConstants';
import { ProspectingScannerInput } from './prospecting/ProspectingScannerInput';
import { ProspectingTokensPreview } from './prospecting/ProspectingTokensPreview';
import { ProspectingSuccessCard } from './prospecting/ProspectingSuccessCard';

export function ProspectingDashboard() {
  const { saveTokens, isSaving } = useBrandEditor();
  const { updateIdentity, updateConfig } = useSettings();
  const { showToast } = useToast();

  const [url, setUrl] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [tokens, setTokens] = useState<ExtractedTokens | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    if (!url.trim()) return;
    setPhase('scanning');
    setTokens(null);
    setError(null);
    try {
      const res = await authedFetch('/api/admin/brand/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erreur extraction');
      setTokens(data.tokens);
      setPhase('preview_ready');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setPhase('idle');
    }
  };

  const handlePreset = (input: BrandInput) => {
    const theme = BrandingUI.generateThemeFromBrand(input);
    setTokens({
      brandName: input.name,
      primaryColor: input.primaryColor ?? undefined,
      surfaceBg: (theme as { backgroundColor?: string }).backgroundColor as string ?? '#0A0A0A',
    });
    setPhase('preview_ready');
  };

  const handleApply = async () => {
    if (!tokens) return;
    setPhase('applying');
    try {
      await saveTokens(tokens);
      const theme = BrandingUI.generateThemeFromBrand({
        name: tokens.brandName ?? 'Demo',
        primaryColor: tokens.primaryColor,
        atmosphere: 'luxury',
      });
      await updateConfig('theme', theme as unknown as import('@nexus/contracts').ThemeSettings);
      if (tokens.brandName && updateIdentity) {
        await updateIdentity({
          name: tokens.brandName,
          id: 'identity_suture',
          updatedAt: new Date().toISOString(),
        } as unknown as import('@nexus/contracts').BusinessIdentity);
      }
      setPhase('done');
      showToast('Charte appliquée — interface mise à jour', 'success');
    } catch {
      showToast('Erreur lors de l\'application', 'error');
      setPhase('preview_ready');
    }
  };

  const handleReset = () => {
    setPhase('idle');
    setTokens(null);
    setError(null);
    setUrl('');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-accent">
          <Sparkles className="w-6 h-6" />
          <span className="text-xs font-black uppercase tracking-[0.4em]">Propulsion Commerciale</span>
        </div>
        <h1 className="text-5xl font-serif italic">Mettre à sa sauce.</h1>
        <p className="text-text-muted max-w-xl">
          Entre l'URL du site ou l'Instagram du prospect. L'IA capture la charte graphique
          et transforme l'app en sa propre interface en moins de 60 secondes.
        </p>
      </div>

      {/* Input zone */}
      {phase !== 'done' && (
        <ProspectingScannerInput
          url={url}
          phase={phase}
          error={error}
          onChangeUrl={setUrl}
          onScan={handleScan}
          onSelectPreset={handlePreset}
        />
      )}

      {/* Palette preview */}
      <AnimatePresence>
        {(phase === 'preview_ready' || phase === 'applying') && tokens && (
          <ProspectingTokensPreview
            tokens={tokens}
            isSaving={isSaving}
            isApplying={phase === 'applying'}
            onReset={handleReset}
            onApply={handleApply}
          />
        )}
      </AnimatePresence>

      {/* Done */}
      <AnimatePresence>
        {phase === 'done' && (
          <ProspectingSuccessCard tokens={tokens} onReset={handleReset} />
        )}
      </AnimatePresence>
    </div>
  );
}
