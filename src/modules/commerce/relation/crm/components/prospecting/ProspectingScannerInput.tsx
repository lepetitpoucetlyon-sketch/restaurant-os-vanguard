"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Wand2, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@ui/button';
import type { BrandInput } from '@/lib/BrandingService';
import { PRESETS } from './prospectingConstants';

interface ProspectingScannerInputProps {
  url: string;
  phase: string;
  error: string | null;
  onChangeUrl: (val: string) => void;
  onScan: () => void;
  onSelectPreset: (input: BrandInput) => void;
}

export function ProspectingScannerInput({
  url,
  phase,
  error,
  onChangeUrl,
  onScan,
  onSelectPreset,
}: ProspectingScannerInputProps) {
  return (
    <motion.div
      layout
      className="bg-bg-secondary border border-border/40 rounded-[2rem] p-8 space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
          <Globe className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Magic Scan</h2>
          <p className="text-xs text-text-muted">Site web ou page Instagram</p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="https://le-bistrot.fr  ou  instagram.com/lebistrot"
            value={url}
            onChange={e => onChangeUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onScan()}
            disabled={phase === 'scanning'}
            className="w-full pl-10 pr-4 h-12 rounded-xl border border-border bg-bg-primary text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent text-sm disabled:opacity-50 transition-all"
          />
        </div>
        <Button
          onClick={onScan}
          disabled={phase === 'scanning' || !url.trim()}
          className="h-12 px-6 rounded-xl bg-accent text-bg-primary font-bold flex items-center gap-2 disabled:opacity-40"
        >
          {phase === 'scanning' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Wand2 className="w-4 h-4" />
              <span>Analyser</span>
            </>
          )}
        </Button>
      </div>

      {phase === 'scanning' && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-sm text-text-muted"
        >
          <Loader2 className="w-4 h-4 animate-spin text-accent" />
          Capture du site en cours… Playwright + Vision IA
        </motion.p>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 rounded-xl bg-status-danger/10 border border-status-danger/20"
        >
          <AlertTriangle className="w-4 h-4 text-status-danger mt-0.5 shrink-0" />
          <p className="text-sm text-status-danger">{error}</p>
        </motion.div>
      )}

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-border/40" />
        <span className="text-xs text-text-muted uppercase tracking-widest">ou preset rapide</span>
        <div className="flex-1 h-px bg-border/40" />
      </div>

      {/* Presets */}
      <div className="grid grid-cols-4 gap-3">
        {PRESETS.map(preset => (
          <button
            key={preset.label}
            onClick={() => onSelectPreset(preset.input)}
            className="group p-4 rounded-xl border border-border hover:border-accent transition-all text-left space-y-3"
          >
            <div
              className="w-8 h-8 rounded-full shadow-sm transition-transform group-hover:scale-110"
              style={{ backgroundColor: preset.color }}
            />
            <span className="text-xs font-bold block text-text-primary">{preset.label}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
