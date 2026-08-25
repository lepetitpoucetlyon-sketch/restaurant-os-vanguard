'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X } from 'lucide-react';
import type { VerticalType } from '../../services/LegalContractGenerator';

interface MCCCreateContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  tenantId: string;
  setTenantId: (v: string) => void;
  vertical: VerticalType;
  setVertical: (v: VerticalType) => void;
  companyName: string;
  setCompanyName: (v: string) => void;
  legalForm: string;
  setLegalForm: (v: string) => void;
  siren: string;
  setSiren: (v: string) => void;
  representativeName: string;
  setRepresentativeName: (v: string) => void;
  representativeRole: string;
  setRepresentativeRole: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  monthlyPrice: number;
  setMonthlyPrice: (v: number) => void;
  setupFee: number;
  setSetupFee: (v: number) => void;
  commitmentMonths: number;
  setCommitmentMonths: (v: number) => void;
}

export function MCCCreateContractModal({
  isOpen,
  onClose,
  onSubmit,
  tenantId,
  setTenantId,
  vertical,
  setVertical,
  companyName,
  setCompanyName,
  legalForm,
  setLegalForm,
  siren,
  setSiren,
  representativeName,
  setRepresentativeName,
  representativeRole,
  setRepresentativeRole,
  email,
  setEmail,
  monthlyPrice,
  setMonthlyPrice,
  setupFee,
  setSetupFee,
  commitmentMonths,
  setCommitmentMonths,
}: MCCCreateContractModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-400" />
                Émettre un Contrat B2B & DPA RGPD
              </h3>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-zinc-800 text-text-muted hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="p-6 overflow-y-auto space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">Tenant ID</label>
                  <input
                    type="text"
                    value={tenantId}
                    onChange={(e) => setTenantId(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">Verticale Métier</label>
                  <select
                    value={vertical}
                    onChange={(e) => setVertical(e.target.value as VerticalType)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm"
                  >
                    <option value="RESTAURANT">Restaurant / Bar / Café</option>
                    <option value="FAST_FOOD">Restauration Rapide / Dark Kitchen</option>
                    <option value="BAKERY">Boulangerie / Pâtisserie</option>
                    <option value="HOTEL">Hôtellerie / Hébergement</option>
                    <option value="SALON">Salon Coiffure / Esthétique</option>
                    <option value="GARAGE">Garage / Atelier Auto</option>
                    <option value="FITNESS">Club Fitness / Gym</option>
                    <option value="COWORKING">Coworking / Tiers-Lieu</option>
                    <option value="RETAIL">Boutique / Retail</option>
                    <option value="FLORIST">Fleuriste / Végétal</option>
                    <option value="CLINIC">Cabinet / Clinic (Pré-HDS)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-text-muted mb-1">Raison Sociale</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">Forme Juridique</label>
                  <input
                    type="text"
                    value={legalForm}
                    onChange={(e) => setLegalForm(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">SIREN</label>
                  <input
                    type="text"
                    value={siren}
                    onChange={(e) => setSiren(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">Email Signataire</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">Nom du Représentant</label>
                  <input
                    type="text"
                    value={representativeName}
                    onChange={(e) => setRepresentativeName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">Qualité / Rôle</label>
                  <input
                    type="text"
                    value={representativeRole}
                    onChange={(e) => setRepresentativeRole(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-zinc-800 pt-4">
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">Tarif Mensuel (€ HT)</label>
                  <input
                    type="number"
                    value={monthlyPrice}
                    onChange={(e) => setMonthlyPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">Setup Initial (€ HT)</label>
                  <input
                    type="number"
                    value={setupFee}
                    onChange={(e) => setSetupFee(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">Engagement</label>
                  <select
                    value={commitmentMonths}
                    onChange={(e) => setCommitmentMonths(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm"
                  >
                    <option value={0}>Sans engagement</option>
                    <option value={12}>12 mois</option>
                    <option value={24}>24 mois</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-xs font-semibold text-white hover:bg-zinc-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 hover:brightness-110"
                >
                  Émettre et Notifier le Client
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
