'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Droplets, UtensilsCrossed, Receipt, MessageSquare, Check, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';
import { authedFetch } from '@/lib/client/authedFetch';

export type ServiceRequestType = 'waiter' | 'water' | 'bread' | 'bill' | 'other';

interface WaiterCallDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  tableNumber?: string | null;
}

const UI_STRINGS = {
  headerTitle: "Service à table",
  tablePrefix: "Table",
  tableFallback: "Demande en salle",
  closeAria: "Fermer la fenêtre",
  backdropAria: "Fermer le tiroir de service",
  successTitle: "Demande transmise",
  successSubtitle: "Votre serveur a été alerté et arrive à votre table.",
  customLabel: "Précision :",
  customPlaceholder: "Ex: glaçons supplémentaires, couverts...",
  sendingState: "Envoi en cours...",
  sendButton: "Envoyer la demande",
};

const SERVICE_ACTIONS: Array<{
  id: ServiceRequestType;
  title: string;
  description: string;
  icon: React.ElementType;
}> = [
  { id: 'water', title: "Carafe d'eau", description: 'Eau fraîche pour la table', icon: Droplets },
  { id: 'bread', title: 'Corbeille de pain', description: 'Pain frais', icon: UtensilsCrossed },
  { id: 'bill', title: "Demander l'addition", description: 'Préparez votre règlement', icon: Receipt },
  { id: 'waiter', title: 'Appeler un serveur', description: 'Une question ou commande', icon: Bell },
  { id: 'other', title: 'Autre demande', description: 'Demande particulière', icon: MessageSquare },
];

export function WaiterCallDrawer({ isOpen, onClose, tenantId, tableNumber }: WaiterCallDrawerProps) {
  const [selectedType, setSelectedType] = useState<ServiceRequestType | null>(null);
  const [customNote, setCustomNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmitRequest = async () => {
    if (!selectedType) return;
    setIsSubmitting(true);

    try {
      await authedFetch(`/api/v1/orders/service-request?tenantId=${encodeURIComponent(tenantId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          table: tableNumber || 'Libre',
          type: selectedType,
          note: customNote.trim() || undefined,
          requestedAt: new Date().toISOString(),
        }),
      }).catch(() => null);

      try {
        const { NexusEventBus } = await import('@/shared/eventBus/NexusEventBus');
        await NexusEventBus.emit('ops.waiter_call_requested', {
          v: 1,
          tenantId,
          tableId: tableNumber || 'table-0',
          tableName: tableNumber ? `Table ${tableNumber}` : 'Table',
          reason: selectedType,
          note: customNote.trim() || undefined,
          requestedAt: new Date().toISOString(),
        });
      } catch {
        // Mode dégradé sans bus local
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setSelectedType(null);
        setCustomNote('');
        onClose();
      }, 2000);
    } catch {
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2000);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop accessible */}
        <button
          type="button"
          aria-label={UI_STRINGS.backdropAria}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-default"
        />

        {/* Modal / Drawer content */}
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="waiter-call-modal-title"
          initial={{ y: '100%', opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-surface-card border border-border-default rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-action-primary/10 text-action-primary">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 id="waiter-call-modal-title" className="text-base font-bold text-text-primary">{UI_STRINGS.headerTitle}</h3>
                <p className="text-xs text-text-muted">
                  {tableNumber ? `${UI_STRINGS.tablePrefix} ${tableNumber}` : UI_STRINGS.tableFallback}
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label={UI_STRINGS.closeAria}
              onClick={onClose}
              className="p-2 text-text-muted hover:text-text-primary rounded-full hover:bg-surface-subtle transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {isSuccess ? (
            <div className="py-8 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-text-primary">{UI_STRINGS.successTitle}</h4>
              <p className="text-xs text-text-muted max-w-xs">
                {UI_STRINGS.successSubtitle}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SERVICE_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  const isSelected = selectedType === action.id;
                  return (
                    <button
                      type="button"
                      key={action.id}
                      aria-label={action.title}
                      onClick={() => setSelectedType(action.id)}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer",
                        isSelected
                          ? "bg-action-primary/10 border-action-primary text-text-primary shadow-sm ring-1 ring-action-primary"
                          : "bg-surface-subtle border-border-default text-text-secondary hover:border-border-strong hover:bg-surface-card"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-xl",
                        isSelected ? "bg-action-primary text-text-on-primary" : "bg-surface-card text-text-muted"
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-text-primary">{action.title}</div>
                        <div className="text-[11px] text-text-muted">{action.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedType === 'other' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-text-secondary">{UI_STRINGS.customLabel}</label>
                  <input
                    type="text"
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    placeholder={UI_STRINGS.customPlaceholder}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-default bg-surface-bg text-text-primary focus:outline-none focus:ring-2 focus:ring-action-primary"
                  />
                </div>
              )}

              <button
                type="button"
                aria-label={UI_STRINGS.sendButton}
                disabled={!selectedType || isSubmitting}
                onClick={handleSubmitRequest}
                className={cn(
                  "w-full py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer",
                  selectedType && !isSubmitting
                    ? "bg-action-primary text-text-on-primary shadow-md hover:opacity-95"
                    : "bg-surface-subtle border border-border-default text-text-muted cursor-not-allowed"
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{UI_STRINGS.sendingState}</span>
                  </>
                ) : (
                  <span>{UI_STRINGS.sendButton}</span>
                )}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
