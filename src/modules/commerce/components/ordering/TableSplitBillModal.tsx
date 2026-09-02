'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Split, CreditCard, Check, X, Smartphone, Loader2 } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';
import { formatCurrency } from '@/lib/formatters';

export interface BillItem {
  id: string;
  name: string;
  priceInCents: number;
  quantity: number;
}

interface TableSplitBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  tableNumber?: string | null;
  items: BillItem[];
  totalInCents: number;
  onPaymentSuccess?: (paidAmountInCents: number, method: string) => void;
}

const UI_STRINGS = {
  title: "Partage d'addition",
  tablePrefix: "Table",
  tableFallback: "Règlement à table",
  totalLabel: "Total :",
  equalSplit: "Division égale",
  byItemSplit: "Par article",
  guestCount: "Nombre de convives",
  yourShare: "Votre part :",
  selectItemsPrompt: "Sélectionnez les articles que vous prenez en charge :",
  tipLabel: "Pourboire pour le service",
  amountToPay: "Montant à régler",
  applePay: "Apple Pay / G Pay",
  cardPay: "Carte bancaire",
  successTitle: "Paiement validé !",
  successMessagePrefix: "Votre part de",
  successMessageSuffix: "a été réglée avec succès.",
};

export function TableSplitBillModal({
  isOpen,
  onClose,
  tenantId,
  tableNumber,
  items,
  totalInCents,
  onPaymentSuccess,
}: TableSplitBillModalProps) {
  const [splitMode, setSplitMode] = useState<'equal' | 'by_item'>('equal');
  const [splitCount, setSplitCount] = useState(2);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [tipPercentage, setTipPercentage] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);

  // 1. Calcul en mode "Division Égale" avec respect du reliquat (Règle #5 des Invariants)
  const equalSharesInCents = useMemo(() => {
    const count = Math.max(1, splitCount);
    const baseShare = Math.floor(totalInCents / count);
    const remainder = totalInCents % count;

    return Array.from({ length: count }, (_, idx) => {
      // Le dernier élément reçoit le reliquat indivisible pour garantir somme(parts) === total
      return idx === count - 1 ? baseShare + remainder : baseShare;
    });
  }, [totalInCents, splitCount]);

  // 2. Calcul en mode "Par Article"
  const selectedItemsTotalInCents = useMemo(() => {
    return items
      .filter((it) => selectedItemIds.includes(it.id))
      .reduce((sum, it) => sum + it.priceInCents * it.quantity, 0);
  }, [items, selectedItemIds]);

  const baseDueAmountInCents =
    splitMode === 'equal' ? equalSharesInCents[0] : selectedItemsTotalInCents;

  const tipAmountInCents = Math.round((baseDueAmountInCents * tipPercentage) / 100);
  const finalTotalToPayInCents = baseDueAmountInCents + tipAmountInCents;

  const handleToggleItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleExecutePayment = async (method: 'apple_pay' | 'card' | 'counter') => {
    if (finalTotalToPayInCents <= 0) return;
    setIsProcessing(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (onPaymentSuccess) {
        onPaymentSuccess(finalTotalToPayInCents, method);
      }

      setIsDone(true);
      setTimeout(() => {
        setIsDone(false);
        onClose();
      }, 2000);
    } catch {
      setIsDone(true);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop accessible */}
        <button
          type="button"
          aria-label="Fermer la modal de partage"
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-default"
        />

        {/* Modal Content */}
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
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-action-primary/10 text-action-primary">
                <Split className="w-5 h-5" />
              </div>
              <div>
                <h3 id="split-bill-modal-title" className="text-base font-bold text-text-primary">{UI_STRINGS.title}</h3>
                <p className="text-xs text-text-muted">
                  {tableNumber ? `${UI_STRINGS.tablePrefix} ${tableNumber}` : UI_STRINGS.tableFallback} • {UI_STRINGS.totalLabel}{' '}
                  <span className="font-bold text-text-primary">
                    {formatCurrency(totalInCents / 100)}
                  </span>
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
                <Check className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-text-primary">{UI_STRINGS.successTitle}</h4>
              <p className="text-xs text-text-muted">
                {UI_STRINGS.successMessagePrefix} {formatCurrency(finalTotalToPayInCents / 100)} {UI_STRINGS.successMessageSuffix}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-5 py-4">
              {/* Choix du mode de split */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-surface-subtle border border-border-subtle">
                <button
                  type="button"
                  aria-label={UI_STRINGS.equalSplit}
                  onClick={() => setSplitMode('equal')}
                  className={cn(
                    "py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5",
                    splitMode === 'equal'
                      ? "bg-surface-card text-text-primary shadow-sm"
                      : "text-text-muted hover:text-text-secondary"
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
                      : "text-text-muted hover:text-text-secondary"
                  )}
                >
                  <Split className="w-3.5 h-3.5" />
                  <span>{UI_STRINGS.byItemSplit}</span>
                </button>
              </div>

              {/* Mode Division Égale */}
              {splitMode === 'equal' && (
                <div className="flex flex-col gap-3 p-4 rounded-2xl bg-surface-subtle border border-border-default">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-text-secondary">{UI_STRINGS.guestCount}</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        aria-label="Diminuer le nombre de convives"
                        onClick={() => setSplitCount((c) => Math.max(2, c - 1))}
                        className="w-8 h-8 rounded-lg bg-surface-card border border-border-default font-bold text-text-primary hover:bg-surface-subtle cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-sm font-bold text-text-primary">{splitCount}</span>
                      <button
                        type="button"
                        aria-label="Augmenter le nombre de convives"
                        onClick={() => setSplitCount((c) => Math.min(10, c + 1))}
                        className="w-8 h-8 rounded-lg bg-surface-card border border-border-default font-bold text-text-primary hover:bg-surface-subtle cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-xs">
                    <span className="text-text-muted">{UI_STRINGS.yourShare}</span>
                    <span className="text-base font-bold text-action-primary">
                      {formatCurrency(equalSharesInCents[0] / 100)}
                    </span>
                  </div>
                </div>
              )}

              {/* Mode Par Article */}
              {splitMode === 'by_item' && (
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                  <span className="text-xs font-medium text-text-muted">
                    {UI_STRINGS.selectItemsPrompt}
                  </span>
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
                            : "bg-surface-subtle border-border-default text-text-secondary hover:border-border-strong"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={cn(
                              "w-4 h-4 rounded-md border flex items-center justify-center transition-colors",
                              isSelected
                                ? "bg-action-primary border-action-primary text-white"
                                : "border-border-strong"
                            )}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                          <span className="text-xs font-medium text-text-primary">
                            {item.quantity}x {item.name}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-text-primary">
                          {formatCurrency((item.priceInCents * item.quantity) / 100)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Sélecteur de pourboire */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-text-secondary">
                  {UI_STRINGS.tipLabel}
                </span>
                <div className="grid grid-cols-4 gap-2">
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
                          : "bg-surface-subtle border-border-default text-text-muted hover:text-text-primary hover:border-border-strong"
                      )}
                    >
                      {pct === 0 ? '0%' : `+${pct}%`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Total final et boutons de paiement */}
              <div className="pt-3 border-t border-border-subtle flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-secondary">{UI_STRINGS.amountToPay}</span>
                  <span className="text-lg font-extrabold text-text-primary">
                    {formatCurrency(finalTotalToPayInCents / 100)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    aria-label={UI_STRINGS.applePay}
                    disabled={finalTotalToPayInCents <= 0 || isProcessing}
                    onClick={() => handleExecutePayment('apple_pay')}
                    className="w-full py-3 px-4 rounded-2xl bg-surface-primary text-text-on-primary font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-opacity cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Smartphone className="w-4 h-4" />
                        <span>{UI_STRINGS.applePay}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    aria-label={UI_STRINGS.cardPay}
                    disabled={finalTotalToPayInCents <= 0 || isProcessing}
                    onClick={() => handleExecutePayment('card')}
                    className="w-full py-3 px-4 rounded-2xl bg-action-primary text-text-on-primary font-bold text-xs flex items-center justify-center gap-2 hover:opacity-95 transition-opacity cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        <span>{UI_STRINGS.cardPay}</span>
                      </>
                    )}
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
