'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  BookOpen,
  FileText,
  Wrench,
  ShieldCheck,
  ExternalLink,
  Plus,
  Video,
  PhoneCall,
  Calendar,
  Building,
  Tag,
  DollarSign,
  TrendingDown,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  EquipmentAsset,
  EquipmentGuide,
} from '../../assets/domain/schemas/equipment';
import { EquipmentAssetService, DepreciationYear } from '../../services/EquipmentAssetService';

interface EquipmentDetailModalProps {
  asset: EquipmentAsset;
  onClose: () => void;
  onOpenAddGuide: () => void;
  onOpenTroubleshoot: () => void;
}

export function EquipmentDetailModal({
  asset,
  onClose,
  onOpenAddGuide,
  onOpenTroubleshoot,
}: EquipmentDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'INVOICE' | 'GUIDES' | 'MAINTENANCE'>('DETAILS');
  const [guides, setGuides] = useState<EquipmentGuide[]>([]);
  const [loadingGuides, setLoadingGuides] = useState(false);
  const [depreciationSchedule, setDepreciationSchedule] = useState<DepreciationYear[]>([]);

  useEffect(() => {
    // Charger les guides associés
    const fetchGuides = async () => {
      try {
        setLoadingGuides(true);
        const res = await fetch(`/api/facility/equipment/${asset.id}/guides`);
        if (res.ok) {
          const json = await res.json();
          setGuides(json.data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingGuides(false);
      }
    };

    fetchGuides();

    // Calcul amortissement comptable
    if (asset.purchase) {
      const schedule = EquipmentAssetService.calculateDepreciationSchedule(asset.purchase);
      setDepreciationSchedule(schedule);
    }
  }, [asset]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Fiche 360° Équipement & GMAO
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {asset.name}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>{asset.brand} - {asset.model}</span>
              <span>•</span>
              <span>S/N: {asset.serialNumber}</span>
              <span>•</span>
              <span className="text-emerald-400">{asset.location}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barre d'onglets */}
        <div className="flex items-center gap-2 pt-4 pb-2 border-b border-slate-800/80">
          <button
            onClick={() => setActiveTab('DETAILS')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'DETAILS'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Fiche Machine & SAV</span>
          </button>

          <button
            onClick={() => setActiveTab('INVOICE')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'INVOICE'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>🧾 Facture & Garantie</span>
          </button>

          <button
            onClick={() => setActiveTab('GUIDES')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'GUIDES'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>📚 Tutos & Notices ({guides.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('MAINTENANCE')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'MAINTENANCE'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>🔧 Pannes & Diagnostic</span>
          </button>
        </div>

        {/* Corps des onglets */}
        <div className="overflow-y-auto py-5 flex-1 pr-1 custom-scrollbar">
          {/* Onglet 1 : Fiche Machine & SAV */}
          {activeTab === 'DETAILS' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <div>
                  <span className="text-slate-500 text-xs block font-semibold">Nom Machine</span>
                  <span className="text-white font-medium text-sm">{asset.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block font-semibold">Catégorie</span>
                  <span className="text-white font-medium text-sm">{asset.category}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block font-semibold">Marque & Modèle</span>
                  <span className="text-white font-medium text-sm">{asset.brand} - {asset.model}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block font-semibold">Numéro de Série</span>
                  <span className="text-white font-mono font-medium text-sm">{asset.serialNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block font-semibold">Zone / Emplacement</span>
                  <span className="text-white font-medium text-sm">{asset.location}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block font-semibold">Fréquence de Révision</span>
                  <span className="text-white font-medium text-sm">Tous les {asset.maintenanceFrequencyDays} jours</span>
                </div>
              </div>

              {/* SAV & Dépannage Contact */}
              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-blue-400" />
                  <span>Support Constructeur & Prestataire SAV Dédié</span>
                </h4>
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-white font-semibold text-sm block">
                      {asset.supportContact?.companyName || asset.brand + ' Service Après-Vente'}
                    </span>
                    <span className="text-xs text-slate-300">
                      {asset.supportContact?.phone || 'Numéro direct non renseigné'}
                    </span>
                  </div>
                  {asset.supportContact?.phone && (
                    <a
                      href={`tel:${asset.supportContact.phone}`}
                      className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-slate-950 font-bold text-xs transition-colors"
                    >
                      Appeler le SAV
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Onglet 2 : Facture & Garantie & Amortissement */}
          {activeTab === 'INVOICE' && (
            <div className="space-y-4">
              {asset.purchase ? (
                <>
                  <div className="grid grid-cols-3 gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                    <div>
                      <span className="text-slate-500 text-xs block font-semibold">Fournisseur</span>
                      <span className="text-white font-medium text-sm">{asset.purchase.supplierName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs block font-semibold">Date d Achat</span>
                      <span className="text-white font-medium text-sm">
                        {new Date(asset.purchase.purchaseDate).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs block font-semibold">Prix d Achat HT</span>
                      <span className="text-emerald-400 font-bold text-sm">
                        {(asset.purchase.purchasePriceInCents / 100).toLocaleString('fr-FR', {
                          style: 'currency',
                          currency: 'EUR',
                        })}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 text-xs block font-semibold">Garantie Constructeur</span>
                      <span className="text-white font-medium text-sm">
                        {asset.purchase.warrantyDurationMonths} mois (Échéance :{' '}
                        {new Date(asset.purchase.warrantyExpiresAt).toLocaleDateString('fr-FR')})
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 text-xs block font-semibold">Amortissement Fiscal</span>
                      <span className="text-white font-medium text-sm">
                        {asset.purchase.depreciationPeriodYears} ans (PCG {asset.purchase.pcgAccount})
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 text-xs block font-semibold">Pièce Justificative</span>
                      {asset.purchase.invoiceUrl ? (
                        <a
                          href={asset.purchase.invoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-bold underline mt-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Voir la Facture PDF</span>
                        </a>
                      ) : (
                        <span className="text-slate-500 text-xs mt-1 block">Non téléversée</span>
                      )}
                    </div>
                  </div>

                  {/* Tableau d'Amortissement */}
                  <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-indigo-400" />
                      <span>Tableau d Amortissement Linéaire (Comptabilité PCG)</span>
                    </h4>
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-500">
                          <th className="py-2">Année</th>
                          <th className="py-2">Dotation Annuelle</th>
                          <th className="py-2">Amortissements Cumulés</th>
                          <th className="py-2 text-right">Valeur Nette Comptable (VNC)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {depreciationSchedule.map((row) => (
                          <tr key={row.yearIndex} className="text-slate-300">
                            <td className="py-2 font-medium">{row.year} (An {row.yearIndex})</td>
                            <td className="py-2">{(row.annualDepreciationInCents / 100).toFixed(2)} €</td>
                            <td className="py-2">{(row.accumulatedDepreciationInCents / 100).toFixed(2)} €</td>
                            <td className="py-2 text-right font-bold text-white">
                              {(row.bookValueInCents / 100).toFixed(2)} €
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                  Aucune facture ni garantie enregistrée pour cet équipement.
                </div>
              )}
            </div>
          )}

          {/* Onglet 3 : Tutos, Notices & Liens Web */}
          {activeTab === 'GUIDES' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Notices constructeurs, vidéos YouTube, tutoriels de nettoyage et pièces détachées.
                </span>
                <button
                  onClick={onOpenAddGuide}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter un tuto</span>
                </button>
              </div>

              {loadingGuides ? (
                <div className="p-8 text-center text-slate-500 text-xs">Chargement des fiches...</div>
              ) : guides.length > 0 ? (
                <div className="space-y-3">
                  {guides.map((guide) => (
                    <div
                      key={guide.id}
                      className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          {guide.type === 'VIDEO_TUTO' ? (
                            <Video className="w-4 h-4 text-red-400 shrink-0" />
                          ) : (
                            <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                          )}
                          <h4 className="text-sm font-bold text-white">{guide.title}</h4>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                          {guide.authorName}
                        </span>
                      </div>

                      {guide.contentMarkdown && (
                        <p className="text-xs text-slate-300 whitespace-pre-line bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                          {guide.contentMarkdown}
                        </p>
                      )}

                      {guide.url && (
                        <div className="pt-1">
                          <a
                            href={guide.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium underline"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Ouvrir la notice / regarder la vidéo ({guide.url})</span>
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800 text-slate-400 text-xs space-y-3">
                  <p>Aucun guide ou tuto rattaché pour l instant.</p>
                  <button
                    onClick={onOpenAddGuide}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Créer la première fiche</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Onglet 4 : GMAO & Diagnostics */}
          {activeTab === 'MAINTENANCE' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">Un dysfonctionnement sur cet appareil ?</h4>
                  <p className="text-xs text-slate-300">
                    Lancez l assistant de diagnostic pas-à-pas ou déclarez une panne d urgence.
                  </p>
                </div>
                <button
                  onClick={onOpenTroubleshoot}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors shrink-0 flex items-center gap-1.5"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Dépanner / Déclarer</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Prochaine Échéance de Maintenance
                </h4>
                <div className="flex items-center gap-2 text-sm text-white font-medium">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span>
                    Prévue le {new Date(asset.nextMaintenanceDueAt).toLocaleDateString('fr-FR')} (Révision {asset.maintenanceFrequencyDays}j)
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors"
          >
            Fermer la fiche
          </button>
        </div>
      </motion.div>
    </div>
  );
}
