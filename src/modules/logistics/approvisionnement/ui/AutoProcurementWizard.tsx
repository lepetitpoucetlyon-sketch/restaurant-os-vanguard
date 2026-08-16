'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  X,
  Truck,
  AlertTriangle,
  CheckCircle2,
  Package,
  ArrowRight,
  TrendingDown,
  Calendar,
  Layers,
  Send,
  Loader2,
  Building2,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/ui.foundations';
import { useAutoProcurement, type UseAutoProcurementProps } from '../procurement/hooks/useAutoProcurement';
import { Button } from '@ui/button';

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
  restaurantName,
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
    restaurantName,
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
        className="relative w-full max-w-5xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
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
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold uppercase tracking-wider">
                  OPTIMISATION FRANCO
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Scan automatique des seuils de sécurité, arrondi aux colis grossistes et regroupement multi-fournisseurs.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/50 hover:bg-slate-800 transition"
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
              <p className="text-sm text-slate-400 max-w-md">
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
              {/* Synthèse Scan Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Articles Scannés</div>
                  <div className="text-2xl font-black text-white mt-1">{analysis.totalItemsScanned}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Sur tout le stock restaurant</div>
                </div>

                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                  <div className="text-[11px] font-bold text-rose-400 uppercase flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> Stock Critique
                  </div>
                  <div className="text-2xl font-black text-rose-400 mt-1">{analysis.criticalItemsCount}</div>
                  <div className="text-[11px] text-rose-400/70 mt-0.5">Rupture immédiate sous 24h</div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                  <div className="text-[11px] font-bold text-amber-400 uppercase flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" /> Stock Bas
                  </div>
                  <div className="text-2xl font-black text-amber-400 mt-1">{analysis.lowStockItemsCount}</div>
                  <div className="text-[11px] text-amber-400/70 mt-0.5">Sous le seuil d'alerte</div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="text-[11px] font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                    <TrendingDown className="w-3.5 h-3.5" /> Économies Franco
                  </div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">
                    {(analysis.estimatedShippingSavingsCts / 100).toFixed(2)} €
                  </div>
                  <div className="text-[11px] text-emerald-400/70 mt-0.5">Frais de port neutralisés</div>
                </div>
              </div>

              {/* Sélection du Fournisseur & Onglets Paniers */}
              <div className="flex flex-col md:flex-row gap-6">
                {/* Liste des Fournisseurs */}
                <div className="w-full md:w-1/3 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                    Paniers par Grossiste ({analysis.supplierBaskets.length})
                  </div>
                  <div className="space-y-2">
                    {analysis.supplierBaskets.map((basket) => {
                      const isSelected = basket.supplierId === activeSupplierId;
                      const progressPct = Math.min(100, Math.round((basket.basketTotalHtCts / basket.francoCts) * 100));

                      return (
                        <div
                          key={basket.supplierId}
                          onClick={() => setActiveSupplierId(basket.supplierId)}
                          className={cn(
                            'p-4 rounded-2xl border transition cursor-pointer',
                            isSelected
                              ? 'bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/5'
                              : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-bold text-sm text-white flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-amber-400" />
                              {basket.supplierName}
                            </div>
                            <span className="text-xs font-bold text-slate-300">
                              {(basket.basketTotalHtCts / 100).toFixed(2)} €
                            </span>
                          </div>

                          {/* Barre de Progression Franco */}
                          <div className="mt-3 space-y-1">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-slate-400">Franco : {(basket.francoCts / 100).toFixed(2)} €</span>
                              <span className={basket.isFrancoReached ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                                {basket.isFrancoReached ? 'Franco Atteint ✨' : `Manque ${(basket.amountToFrancoCts / 100).toFixed(2)} €`}
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all duration-500',
                                  basket.isFrancoReached ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-amber-500'
                                )}
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Détail du Panier Sélectionné */}
                <div className="flex-1 bg-slate-950/50 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                  {selectedBasket ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                        <div>
                          <h4 className="font-black text-base text-white">{selectedBasket.supplierName}</h4>
                          <p className="text-xs text-slate-400">
                            {selectedBasket.items.length} article{selectedBasket.items.length > 1 ? 's' : ''} à commander
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">Date souhaitée :</span>
                          <input
                            type="date"
                            value={targetDeliveryDate}
                            onChange={(e) => setTargetDeliveryDate(e.target.value)}
                            className="bg-slate-900 border border-slate-700 text-xs px-2.5 py-1 rounded-lg text-white font-medium"
                          />
                        </div>
                      </div>

                      {/* Lignes de commande */}
                      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                        {selectedBasket.items.map((item) => (
                          <div
                            key={item.stockItemId}
                            className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs"
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={cn(
                                  'px-2 py-0.5 rounded-full text-[10px] font-black uppercase',
                                  item.urgency === 'CRITICAL'
                                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                )}
                              >
                                {item.urgency}
                              </span>
                              <div>
                                <div className="font-bold text-white">{item.name}</div>
                                <div className="text-[10px] text-slate-400">
                                  Stock actuel: {item.currentQuantity} {item.unit} | Cible: {item.targetQuantity} {item.unit}
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="font-black text-amber-400">
                                {item.recommendedPackagesCount}x {item.packagingLabel}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {(item.totalHtCts / 100).toFixed(2)} € HT
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Suggestions de comblement Franco */}
                      {selectedBasket.suggestedFrancoFillers.length > 0 && (
                        <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-2">
                          <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" /> Suggestion de Comblement Franco
                          </div>
                          <div className="space-y-1.5">
                            {selectedBasket.suggestedFrancoFillers.map((filler) => (
                              <div key={filler.mercurialeItemId} className="flex items-center justify-between text-xs text-slate-300">
                                <span>{filler.name} ({filler.packagingLabel})</span>
                                <span className="text-[11px] text-emerald-400 font-medium">{filler.reason}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-500 text-sm">
                      Aucun réassort nécessaire pour le moment. Tous les stocks sont au-dessus des seuils de sécurité.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!isSuccessStep && (
          <div className="p-6 border-t border-slate-800/80 bg-slate-950/80 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              Total Global Estimé :{' '}
              <span className="text-base font-black text-white ml-1">
                {(analysis.grandTotalHtCts / 100).toFixed(2)} € HT
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={onClose} className="rounded-xl border-slate-700 text-slate-300">
                Annuler
              </Button>
              <Button
                disabled={analysis.supplierBaskets.length === 0 || isProcessing}
                onClick={handleConfirmAndSendAll}
                className="rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-6 shadow-lg shadow-amber-500/20 flex items-center gap-2"
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
