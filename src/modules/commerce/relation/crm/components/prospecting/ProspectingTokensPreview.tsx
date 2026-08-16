"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Palette, RefreshCcw, Check, Loader2 } from 'lucide-react';
import { Button } from '@ui/button';
import { ExtractedTokens, deriveSwatches, textOn } from './prospectingConstants';

interface ProspectingTokensPreviewProps {
  tokens: ExtractedTokens;
  isSaving: boolean;
  isApplying: boolean;
  onReset: () => void;
  onApply: () => void;
}

export function ProspectingTokensPreview({
  tokens,
  isSaving,
  isApplying,
  onReset,
  onApply,
}: ProspectingTokensPreviewProps) {
  const swatches = deriveSwatches(tokens);

  return (
    <motion.div
      key="preview"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="bg-bg-secondary border border-border/40 rounded-[2rem] overflow-hidden"
    >
      {/* Header */}
      <div className="px-8 py-5 border-b border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Palette className="w-5 h-5 text-accent" />
          <div>
            <p className="text-sm font-bold text-text-primary">
              {tokens.brandName ?? 'Charte détectée'}
            </p>
            <p className="text-xs text-text-muted">
              {swatches.length} couleur{swatches.length > 1 ? 's' : ''} extraite{swatches.length > 1 ? 's' : ''}
              {tokens.fontBrand && ` · ${tokens.fontBrand}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onReset}
            className="h-9 px-4 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1.5"
          >
            <RefreshCcw className="w-3 h-3" /> Rescanner
          </Button>
          <Button
            onClick={onApply}
            disabled={isSaving || isApplying}
            className="h-9 px-5 rounded-full bg-status-success text-text-primary font-bold uppercase tracking-widest text-[10px] hover:opacity-90 flex items-center gap-2"
          >
            {isApplying ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <>
                <Check className="w-3 h-3" />
                <span>Appliquer</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Grande bande couleur principale */}
      {tokens.primaryColor && (
        <div
          className="w-full h-28 flex items-center justify-between px-8"
          style={{ backgroundColor: tokens.primaryColor }}
        >
          <div style={{ color: textOn(tokens.primaryColor) }}>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Couleur principale</p>
            <p className="text-2xl font-mono font-bold">{tokens.primaryColor}</p>
          </div>
          {tokens.brandName && (
            <p className="text-lg font-serif italic opacity-70" style={{ color: textOn(tokens.primaryColor) }}>
              {tokens.brandName}
            </p>
          )}
        </div>
      )}

      {/* Swatches palette */}
      {swatches.length > 0 && (
        <div className="px-8 py-6 space-y-3">
          <p className="text-xs font-black uppercase tracking-widest text-text-muted">Palette complète</p>
          <div className="flex flex-wrap gap-4">
            {swatches.map(s => (
              <div key={s.label} className="flex flex-col items-center gap-2">
                <div
                  className="w-14 h-14 rounded-2xl shadow-md border border-white/10 relative group cursor-pointer"
                  style={{ backgroundColor: s.value }}
                  title={s.value}
                >
                  <span
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl text-[9px] font-mono font-bold"
                    style={{ color: textOn(s.value), backgroundColor: s.value }}
                  >
                    {s.value}
                  </span>
                </div>
                <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Typo preview */}
      {tokens.fontBrand && (
        <div className="px-8 pb-6 border-t border-border/30 pt-5">
          <p className="text-xs font-black uppercase tracking-widest text-text-muted mb-3">Typographie</p>
          {tokens.fontBrandUrl && <link rel="stylesheet" href={tokens.fontBrandUrl} />}
          <div className="bg-bg-primary rounded-xl p-5 flex items-baseline gap-6">
            <span className="text-4xl text-text-primary" style={{ fontFamily: tokens.fontBrand }}>
              Bonsoir
            </span>
            <span className="text-sm text-text-muted font-mono">{tokens.fontBrand}</span>
          </div>
        </div>
      )}

      {/* Mini UI preview */}
      {tokens.primaryColor && (
        <div className="px-8 pb-8 border-t border-border/30 pt-5 space-y-3">
          <p className="text-xs font-black uppercase tracking-widest text-text-muted">Aperçu interface</p>
          <div
            className="rounded-2xl p-5 space-y-3"
            style={{ backgroundColor: tokens.surfaceBg ?? '#0A0A0A' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full" style={{ backgroundColor: tokens.primaryColor }} />
              <span
                className="text-sm font-bold"
                style={{ color: textOn(tokens.surfaceBg ?? '#0A0A0A'), fontFamily: tokens.fontBrand }}
              >
                {tokens.brandName ?? 'Mon Restaurant'}
              </span>
            </div>
            <div className="h-px w-full opacity-20" style={{ backgroundColor: tokens.primaryColor }} />
            <div className="flex gap-2">
              <div
                className="px-4 py-2 rounded-lg text-xs font-bold"
                style={{ backgroundColor: tokens.primaryColor, color: textOn(tokens.primaryColor) }}
              >
                Nouvelle commande
              </div>
              <div
                className="px-4 py-2 rounded-lg text-xs border opacity-50"
                style={{ borderColor: tokens.primaryColor, color: textOn(tokens.surfaceBg ?? '#0A0A0A') }}
              >
                Table 4
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
