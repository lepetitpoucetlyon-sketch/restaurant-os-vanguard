"use client";

import React from 'react';
import { DollarSign, Wallet } from 'lucide-react';

interface CashDrawerOpenSectionProps {
  openingInput: string;
  isOpening: boolean;
  onChangeOpeningInput: (val: string) => void;
  onOpen: () => void;
}

export function CashDrawerOpenSection({
  openingInput,
  isOpening,
  onChangeOpeningInput,
  onOpen,
}: CashDrawerOpenSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-chip-label-sm text-text-muted block mb-2">
          Fond d'ouverture (€)
        </label>
        <div className="flex items-center gap-3 border border-border rounded-2xl px-4 h-14 bg-bg-primary focus-within:border-accent-gold/50 transition-colors">
          <DollarSign className="w-4 h-4 text-text-muted shrink-0" />
          <input
            type="text"
            inputMode="decimal"
            value={openingInput}
            onChange={(e) => onChangeOpeningInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onOpen()}
            placeholder="Ex: 200,00"
            className="flex-1 bg-transparent text-lg font-mono text-text-primary placeholder:text-text-muted/50 focus:outline-none"
          />
          <span className="text-sm text-text-muted font-mono">€</span>
        </div>
      </div>

      <button
        onClick={onOpen}
        disabled={isOpening || !openingInput.trim()}
        className="w-full h-14 rounded-2xl bg-accent-gold text-text-primary text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-accent-gold/90 active:scale-98 transition-all disabled:opacity-40"
      >
        {isOpening ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <Wallet className="w-4 h-4" />
            Ouvrir la caisse
          </>
        )}
      </button>
    </div>
  );
}
