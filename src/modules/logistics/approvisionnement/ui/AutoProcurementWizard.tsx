'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, X, CheckCircle2, Send, Loader2 } from 'lucide-react';
import { useAutoProcurement, type UseAutoProcurementProps } from '../procurement/hooks/useAutoProcurement';
import { Button } from '@ui/Button';

import { ProcurementMetricsCards } from './auto-procurement/ProcurementMetricsCards';
import { ProcurementSupplierList } from './auto-procurement/ProcurementSupplierList';
import { ProcurementBasketDetail } from './auto-procurement/ProcurementBasketDetail';

interface AutoProcurementWizardProps extends UseAutoProcurementProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AutoProcurementWizard({
  isOpen,
  onClose,
  tenantId,
  stockItems,
  mercurialeItems,
  suppliers,
  currentUserId,
  businessName,
}: AutoProcurementWizardProps) {
  const {
    analysis,
    selectedBasket,
    activeSupplierId,
    setActiveSupplierId,
    targetDeliveryDate,
    setTargetDeliveryDate,
    dispatchAllBaskets,
    dispatchedOrders,
    isProcessing,
  } = useAutoProcurement({
    tenantId,
    stockItems,
    mercurialeItems,
    suppliers,
    currentUserId,
    businessName,
  });

  const [isSuccessStep, setIsSuccessStep] = useState(false);

  if (!isOpen) return null;

  const handleConfirmAndSendAll = async () => {
    await dispatchAllBaskets();
    setIsSuccessStep(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative w-full max-w-5xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-text-primary"
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800/80 bg-slate-950/60">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-lg shadow-amber-500/5">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                AUTO-APPROVISIONNEMENT INTELLIGENT
                <span className="text-nano px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold uppercase tracking-wider">
                  OPTIMISATION FRANCO
                </span>
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Scan automatique des seuils de sécurité, arrondi aux colis grossistes et regroupement multi-fournisseurs.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-muted hover:text-white rounded-xl bg-slate-800/50 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps Principal */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isSuccessStep ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-12 flex flex-col items-center justify-center text-center space-y-4"
            >
              <div className="p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-xl shadow-emerald-500/10">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight">
                {dispatchedOrders.length} Bon{dispatchedOrders.length > 1 ? 's' : ''} de Commande Généré{dispatchedOrders.length > 1 ? 's' : ''} avec Succès !
              </h3>
              <p className="text-sm text-text-muted max-w-md">
                Les pré-commandes sont formatées et prêtes pour transmission WhatsApp / EDI auprès des commerciaux de chaque grossiste.
              </p>
              <div className="pt-4">
                <Button onClick={onClose} className="px-8 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl">
                  Terminer et Revenir au Hub
                </Button>
              </div>
            </motion.div>
          ) : (
            <>
              <ProcurementMetricsCards analysis={analysis} />

              <div className="flex flex-col md:flex-row gap-6">
                <ProcurementSupplierList
                  analysis={analysis}
                  activeSupplierId={activeSupplierId}
                  setActiveSupplierId={setActiveSupplierId}
                />

                <ProcurementBasketDetail
                  selectedBasket={selectedBasket}
                  targetDeliveryDate={targetDeliveryDate}
                  setTargetDeliveryDate={setTargetDeliveryDate}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!isSuccessStep && (
          <div className="p-6 border-t border-slate-800/80 bg-slate-950/80 flex items-center justify-between">
            <div className="text-xs text-text-muted">
              Total Global Estimé :{' '}
              <span className="text-base font-black text-white ml-1">
                {(analysis.grandTotalHtCts / 100).toFixed(2)} € HT
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={onClose} className="rounded-xl border-slate-700 text-text-secondary">
                Annuler
              </Button>
              <Button
                disabled={analysis.supplierBaskets.length === 0 || isProcessing}
                onClick={handleConfirmAndSendAll}
                className="rounded-xl bg-amber-500 hover:bg-amber-400 text-text-primary font-black px-6 shadow-lg shadow-amber-500/20 flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Générer et Engager Toutes les Commandes
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
