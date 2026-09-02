'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Split, CreditCard, Check, X, Banknote, Loader2 } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';
import { formatMu } from '@/lib/formatters';

export interface BillItem {
  id: string;
  name: string;
  priceInMicrounits: number;
  quantity: number;
}

type SettlementMethod = 'card' | 'counter';

interface TableSplitBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  orderId: string;
  tableNumber?: string | null;
  items: BillItem[];
  totalInMicrounits: number;
  onSplitRegistered?: (dueInMicrounits: number, method: SettlementMethod) => void;
}

const UI_STRINGS = {
  title: "Partage d'addition",
  tablePrefix: "Table",
  tableFallback: "Règlement à table",
  totalLabel: "Total :",
  equalSplit: "Parts égales",
  byItemSplit: "Par article",
  guestCount: "Nombre de convives",
  yourShare: "Votre part :",
  selectItemsPrompt: "Sélectionnez les articles que vous prenez en charge :",
  tipLabel: "Pourboire pour le service",
  amountToPay: "Votre part à régler",
  payByCard: "Je règle par carte à table",
  payAtCounter: "Je règle au comptoir",
  successTitle: "Partage transmis au service",
  successBody: "Un serveur vous apporte le terminal ou vous encaisse au comptoir. Rien n'est débité pour l'instant.",
  errorRetry: "Envoi impossible. Réessayez ou appelez un serveur.",
} as const;

export function TableSplitBillModal({
  isOpen,
  onClose,
  tenantId,
  orderId,
  tableNumber,
  items,
  totalInMicrounits,
  onSplitRegistered,
}: TableSplitBillModalProps) {
  const [splitMode, setSplitMode] = useState<'equal' | 'by_item'>('equal');
  const [splitCount, setSplitCount] = useState(2);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [tipPercentage, setTipPercentage] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Division égale, reliquat indivisible sur la dernière part → somme(parts) === total (Invariant #5).
  const equalSharesInMicrounits = useMemo(() => {
    const count = Math.max(1, splitCount);
    const base = Math.floor(totalInMicrounits / count);
    const remainder = totalInMicrounits % count;
    return Array.from({ length: count }, (_, idx) => (idx === count - 1 ? base + remainder : base));
  }, [totalInMicrounits, splitCount]);

  const selectedItemsTotalInMicrounits = useMemo(
    () =>
      items
        .filter((it) => selectedItemIds.includes(it.id))
        .reduce((sum, it) => sum + it.priceInMicrounits * it.quantity, 0),
    [items, selectedItemIds],
  );

  const baseDueInMicrounits =
    splitMode === 'equal' ? equalSharesInMicrounits[0] : selectedItemsTotalInMicrounits;
  const tipInMicrounits = Math.round((baseDueInMicrounits * tipPercentage) / 100);
  const dueInMicrounits = baseDueInMicrounits + tipInMicrounits;

  const handleToggleItem = (id: string) => {
    setSelectedItemIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleRegisterSplit = async (method: SettlementMethod) => {
    if (dueInMicrounits <= 0 || !orderId) return;
    setIsProcessing(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/v1/orders/${encodeURIComponent(orderId)}/split-bill?tenantId=${encodeURIComponent(tenantId)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantId,
            tableNumber: tableNumber ?? undefined,
            splitType: splitMode === 'equal' ? 'equipartition' : 'by_item',
            partsCount: splitMode === 'equal' ? splitCount : Math.max(1, selectedItemIds.length),
            shareInMicrounits: baseDueInMicrounits,
            tipInMicrounits,
            totalInMicrounits,
            method,
          }),
        },
      );

      if (!res.ok) throw new Error(`split-bill ${res.status}`);

      onSplitRegistered?.(dueInMicrounits, method);
      setIsDone(true);
      window.setTimeout(() => {
        setIsDone(false);
        onClose();
      }, 2600);
    } catch {
      setError(UI_STRINGS.errorRetry);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <motion.button
          type="button"
          aria-label="Fermer la modal de partage"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[rgba(0,0,0,0.6)] backdrop-blur-sm cursor-default"
        />

        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="split-bill-modal-title"
          initial={{ y: '100%', opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-surface-card border border-border-default rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-action-primary/10 text-action-primary">
                <Split className="w-5 h-5" />
              </div>
              <div>
                <h3 id="split-bill-modal-title" className="text-base font-bold text-text-primary">{UI_STRINGS.title}</h3>
                <p className="text-xs text-text-muted">
                  {tableNumber ? `${UI_STRINGS.tablePrefix} ${tableNumber}` : UI_STRINGS.tableFallback} • {UI_STRINGS.totalLabel}{' '}
                  <span className="font-bold text-text-primary">{formatMu(totalInMicrounits)}</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Fermer la fenêtre"
              onClick={onClose}
              className="p-2 text-text-muted hover:text-text-primary rounded-full hover:bg-surface-subtle transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {isDone ? (
            <div className="py-10 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Check className="size-8" />
              </div>
              <h4 className="text-lg font-bold text-text-primary">{UI_STRINGS.successTitle}</h4>
              <p className="text-xs text-text-muted max-w-xs">{UI_STRINGS.successBody}</p>
              <p className="text-sm font-bold text-action-primary">{formatMu(dueInMicrounits)}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-5 py-4">
              <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-surface-subtle border border-border-subtle">
                <button
                  type="button"
                  aria-label={UI_STRINGS.equalSplit}
                  onClick={() => setSplitMode('equal')}
                  className={cn(
                    "py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5",
                    splitMode === 'equal'
                      ? "bg-surface-card text-text-primary shadow-sm"
                      : "text-text-muted hover:text-text-secondary",
                  )}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{UI_STRINGS.equalSplit}</span>
                </button>
                <button
                  type="button"
                  aria-label={UI_STRINGS.byItemSplit}
                  onClick={() => setSplitMode('by_item')}
                  className={cn(
                    "py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5",
                    splitMode === 'by_item'
                      ? "bg-surface-card text-text-primary shadow-sm"
                      : "text-text-muted hover:text-text-secondary",
                  )}
                >
                  <Split className="w-3.5 h-3.5" />
                  <span>{UI_STRINGS.byItemSplit}</span>
                </button>
              </div>

              {splitMode === 'equal' && (
                <div className="flex flex-col gap-3 p-4 rounded-2xl bg-surface-subtle border border-border-default">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-text-secondary">{UI_STRINGS.guestCount}</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        aria-label="Diminuer le nombre de convives"
                        onClick={() => setSplitCount((c) => Math.max(2, c - 1))}
                        className="w-11 h-11 rounded-lg bg-surface-card border border-border-default font-bold text-text-primary hover:bg-surface-subtle cursor-pointer flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="text-sm font-bold text-text-primary">{splitCount}</span>
                      <button
                        type="button"
                        aria-label="Augmenter le nombre de convives"
                        onClick={() => setSplitCount((c) => Math.min(10, c + 1))}
                        className="w-11 h-11 rounded-lg bg-surface-card border border-border-default font-bold text-text-primary hover:bg-surface-subtle cursor-pointer flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-xs">
                    <span className="text-text-muted">{UI_STRINGS.yourShare}</span>
                    <span className="text-base font-bold text-action-primary">
                      {formatMu(equalSharesInMicrounits[0])}
                    </span>
                  </div>
                </div>
              )}

              {splitMode === 'by_item' && (
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                  <span className="text-xs font-medium text-text-muted">{UI_STRINGS.selectItemsPrompt}</span>
                  {items.map((item) => {
                    const isSelected = selectedItemIds.includes(item.id);
                    return (
                      <button
                        type="button"
                        key={item.id}
                        aria-label={item.name}
                        onClick={() => handleToggleItem(item.id)}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer",
                          isSelected
                            ? "bg-action-primary/10 border-action-primary text-text-primary"
                            : "bg-surface-subtle border-border-default text-text-secondary hover:border-border-strong",
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={cn(
                              "w-4 h-4 rounded-md border flex items-center justify-center transition-colors",
                              isSelected ? "bg-action-primary border-action-primary text-white" : "border-border-strong",
                            )}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                          <span className="text-xs font-medium text-text-primary">
                            {item.quantity}x {item.name}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-text-primary">
                          {formatMu(item.priceInMicrounits * item.quantity)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-text-secondary">{UI_STRINGS.tipLabel}</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[0, 5, 10, 15].map((pct) => (
                    <button
                      type="button"
                      key={pct}
                      aria-label={pct === 0 ? '0%' : `+${pct}%`}
                      onClick={() => setTipPercentage(pct)}
                      className={cn(
                        "py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer",
                        tipPercentage === pct
                          ? "bg-action-primary text-text-on-primary border-action-primary shadow-sm"
                          : "bg-surface-subtle border-border-default text-text-muted hover:text-text-primary hover:border-border-strong",
                      )}
                    >
                      {pct === 0 ? '0%' : `+${pct}%`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-border-subtle flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-secondary">{UI_STRINGS.amountToPay}</span>
                  <span className="text-lg font-extrabold text-text-primary">{formatMu(dueInMicrounits)}</span>
                </div>

                {error && <p className="text-xs text-error font-medium">{error}</p>}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    aria-label={UI_STRINGS.payByCard}
                    disabled={dueInMicrounits <= 0 || isProcessing}
                    onClick={() => handleRegisterSplit('card')}
                    className="w-full py-3 px-4 rounded-2xl bg-action-primary text-text-on-primary font-bold text-xs flex items-center justify-center gap-2 hover:opacity-95 transition-opacity cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CreditCard className="w-4 h-4" /><span>{UI_STRINGS.payByCard}</span></>}
                  </button>

                  <button
                    type="button"
                    aria-label={UI_STRINGS.payAtCounter}
                    disabled={dueInMicrounits <= 0 || isProcessing}
                    onClick={() => handleRegisterSplit('counter')}
                    className="w-full py-3 px-4 rounded-2xl bg-surface-subtle border border-border-default text-text-primary font-bold text-xs flex items-center justify-center gap-2 hover:bg-surface-card transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Banknote className="w-4 h-4" /><span>{UI_STRINGS.payAtCounter}</span></>}
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
