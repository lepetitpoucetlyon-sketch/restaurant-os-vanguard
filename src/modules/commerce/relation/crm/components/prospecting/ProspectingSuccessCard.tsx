"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Check, RefreshCcw, ArrowRight } from 'lucide-react';
import { Button } from '@ui/Button';
import type { ExtractedTokens } from './prospectingConstants';

interface ProspectingSuccessCardProps {
  tokens: ExtractedTokens | null;
  onReset: () => void;
}

export function ProspectingSuccessCard({ tokens, onReset }: ProspectingSuccessCardProps) {
  return (
    <motion.div
      key="done"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-status-success/10 border border-status-success/20 rounded-[2rem] p-8 flex items-center justify-between"
    >
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-status-success flex items-center justify-center text-text-primary">
          <Check className="w-7 h-7" />
        </div>
        <div>
          <p className="text-base font-bold text-text-primary">
            {tokens?.brandName ?? 'Branding'} appliqué avec succès
          </p>
          <p className="text-sm text-text-muted">L'interface a été mise à jour instantanément.</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={onReset}
          className="h-10 px-5 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2"
        >
          <RefreshCcw className="w-3 h-3" /> Nouveau client
        </Button>
        <Button
          onClick={() => window.location.reload()}
          className="h-10 px-5 rounded-full bg-accent text-bg-primary text-xs font-bold uppercase tracking-widest flex items-center gap-2"
        >
          Voir le résultat <ArrowRight className="w-3 h-3" />
        </Button>
      </div>
    </motion.div>
  );
}
