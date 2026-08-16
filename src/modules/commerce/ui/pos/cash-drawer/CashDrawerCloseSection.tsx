"use client";

import React from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Unlock,
  ArrowRight,
} from 'lucide-react';
import { cn } from "@/lib/ui.foundations";
import { CashDrawerSession, microunitsToEuros, eurosToMicrounits, parseEuros } from './cashDrawerTypes';
import { cashDrawerService } from "@/modules/ops/service/pos/infrastructure/cash-drawer/CashDrawerService";
import { toast } from "sonner";

interface CashDrawerCloseSectionProps {
  session: CashDrawerSession;
  collectedInMicrounits: number;
  changeGivenInMicrounits: number;
  actualInput: string;
  isClosing: boolean;
  onChangeActualInput: (val: string) => void;
  onCloseSession: () => void;
}

export function CashDrawerCloseSection({
  session,
  collectedInMicrounits,
  changeGivenInMicrounits,
  actualInput,
  isClosing,
  onChangeActualInput,
  onCloseSession,
}: CashDrawerCloseSectionProps) {
  const theoreticalMu = session.openingInMicrounits + collectedInMicrounits - changeGivenInMicrounits;
  const actualMu = eurosToMicrounits(parseEuros(actualInput));
  const diffMu = actualInput.trim() ? actualMu - theoreticalMu : null;

  return (
    <div className="space-y-4">
      {/* Session info */}
      <div className="rounded-2xl bg-bg-tertiary/50 border border-border/50 p-4 space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-text-muted flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            Ouverture
          </span>
          <span className="font-mono text-text-primary">
            {new Date(session.openedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-text-muted">Fond initial</span>
          <span className="font-mono text-text-primary font-bold">
            {microunitsToEuros(session.openingInMicrounits)} €
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-text-muted flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3 text-status-success" />
            Espèces encaissées
          </span>
          <span className="font-mono text-status-success font-bold">
            +{microunitsToEuros(collectedInMicrounits)} €
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-text-muted flex items-center gap-1.5">
            <TrendingDown className="w-3 h-3 text-status-error" />
            Monnaie rendue
          </span>
          <span className="font-mono text-status-error font-bold">
            -{microunitsToEuros(changeGivenInMicrounits)} €
          </span>
        </div>
        <div className="h-px bg-border/50" />
        <div className="flex items-center justify-between text-[12px]">
          <span className="font-black text-text-primary uppercase tracking-wider">Fond théorique</span>
          <span className="font-mono font-black text-accent-gold">
            {microunitsToEuros(theoreticalMu)} €
          </span>
        </div>
      </div>

      {/* Actual amount input */}
      <div>
        <label className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-2">
          Fond réel compté (€)
        </label>
        <div className="flex items-center gap-3 border border-border rounded-2xl px-4 h-14 bg-bg-primary focus-within:border-accent-gold/50 transition-colors">
          <DollarSign className="w-4 h-4 text-text-muted shrink-0" />
          <input
            type="text"
            inputMode="decimal"
            value={actualInput}
            onChange={(e) => onChangeActualInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onCloseSession()}
            placeholder={`Attendu : ${microunitsToEuros(theoreticalMu)}`}
            className="flex-1 bg-transparent text-lg font-mono text-text-primary placeholder:text-text-muted/50 focus:outline-none"
          />
          <span className="text-sm text-text-muted font-mono">€</span>
        </div>
      </div>

      {/* Difference display */}
      {diffMu !== null && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className={cn(
            "flex items-center justify-between rounded-2xl px-4 py-3 text-[12px] font-black",
            Math.abs(diffMu) < 500_000
              ? "bg-status-success/10 text-status-success border border-status-success/20"
              : "bg-status-error/10 text-status-error border border-status-error/20"
          )}
        >
          <div className="flex items-center gap-2">
            {Math.abs(diffMu) < 500_000 ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span className="uppercase tracking-widest">Écart</span>
          </div>
          <span className="font-mono text-base">
            {diffMu >= 0 ? "+" : ""}{(diffMu / 1_000_000).toFixed(2)} €
          </span>
        </motion.div>
      )}

      {/* Manual drawer kick */}
      <button
        onClick={() => { void cashDrawerService.kick(); toast.info('Tiroir-caisse ouvert'); }}
        className="w-full h-10 rounded-2xl border border-border/50 text-[11px] font-black uppercase tracking-widest text-text-muted hover:text-text-primary hover:border-border transition-colors flex items-center justify-center gap-2"
      >
        <Unlock className="w-3.5 h-3.5" />
        Ouvrir le tiroir
      </button>

      {/* Close button */}
      <button
        onClick={onCloseSession}
        disabled={isClosing || !actualInput.trim()}
        className="w-full h-14 rounded-2xl bg-text-primary text-bg-primary text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 active:scale-98 transition-all disabled:opacity-40 dark:bg-accent-gold dark:text-text-primary"
      >
        {isClosing ? (
          <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
        ) : (
          <>
            Clôturer la caisse
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );
}
