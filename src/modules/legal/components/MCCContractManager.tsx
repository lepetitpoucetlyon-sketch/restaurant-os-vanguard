'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  ShieldCheck,
  Send,
  CheckCircle2,
  Clock,
  ExternalLink,
  Plus,
  X,
  Search,
  Building,
  Key,
} from 'lucide-react';
import type { ContractRecord } from '@/modules/legal/services/SovereignSignatureEngine';
import type { VerticalType } from '@/modules/legal/services/LegalContractGenerator';

export function MCCContractManager() {
  const [contracts, setContracts] = useState<ContractRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<ContractRecord | null>(null);

  // Form State
  const [tenantId, setTenantId] = useState('bistro-paris-01');
  const [vertical, setVertical] = useState<VerticalType>('RESTAURANT');
  const [companyName, setCompanyName] = useState('Le Petit Bistrot SAS');
  const [legalForm, setLegalForm] = useState('SAS');
  const [siren, setSiren] = useState('883 992 110');
  const [representativeName, setRepresentativeName] = useState('Jean Dupont');
  const [representativeRole, setRepresentativeRole] = useState('Gérant');
  const [email, setEmail] = useState('contact@lepetitbistrot.fr');
  const [address, setAddress] = useState('14 Rue de la Paix');
  const [postalCode, setPostalCode] = useState('75002');
  const [city, setCity] = useState('Paris');
  const [planName, setPlanName] = useState('Empire Pro');
  const [monthlyPrice, setMonthlyPrice] = useState(149);
  const [setupFee, setSetupFee] = useState(290);
  const [commitmentMonths, setCommitmentMonths] = useState(12);

  const fetchContracts = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/mcc/contracts');
      if (res.ok) {
        const data = await res.json();
        setContracts(data.contracts || []);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        tenantId,
        vertical,
        client: {
          companyName,
          legalForm,
          siren,
          representativeName,
          representativeRole,
          email,
          address,
          city,
          postalCode,
        },
        pricing: {
          planName,
          monthlyPriceInEuros: Number(monthlyPrice),
          setupFeeInEuros: Number(setupFee),
          commitmentMonths: Number(commitmentMonths),
          billingCycle: 'MONTHLY',
          includedRegistersCount: 2,
          includedModules: ['POS', 'KDS', 'INVENTORY', 'HACCP', 'DELIVERY_BRIDGE'],
        },
      };

      const res = await fetch('/api/mcc/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsCreateModalOpen(false);
        await fetchContracts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredContracts = contracts.filter(
    (c) =>
      c.client.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tenantId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const signedCount = contracts.filter((c) => c.status === 'SIGNED').length;
  const pendingCount = contracts.filter((c) => c.status === 'SENT' || c.status === 'VIEWED').length;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 backdrop-blur-xl">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">Total Contrats</span>
            <FileText className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-white">{contracts.length}</p>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 backdrop-blur-xl">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">Signés & Actifs</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-emerald-400">{signedCount}</p>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 backdrop-blur-xl">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">En Attente Signature</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-bold text-amber-400">{pendingCount}</p>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 backdrop-blur-xl flex flex-col justify-center">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-sm shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-[0.98] transition flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Émettre un Contrat SaaS
          </button>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 backdrop-blur-xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Rechercher par société, tenant ou réf contrat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-950/80 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-950/60 text-zinc-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Référence & Date</th>
                <th className="px-5 py-3">Client & Tenant</th>
                <th className="px-5 py-3">Verticale</th>
                <th className="px-5 py-3">Formule & Tarif</th>
                <th className="px-5 py-3">Statut Signature</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {filteredContracts.map((c) => (
                <tr key={c.id} className="hover:bg-zinc-800/30 transition">
                  <td className="px-5 py-4 font-mono text-xs text-zinc-400">
                    <div className="font-semibold text-white">{c.id}</div>
                    <div>{new Date(c.createdAt).toLocaleDateString('fr-FR')}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-medium text-white">{c.client.companyName}</div>
                    <div className="text-xs text-zinc-400">
                      {c.client.representativeName} ({c.tenantId})
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {c.vertical}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-medium text-white">{c.pricing.monthlyPriceInEuros} €/mois</div>
                    <div className="text-xs text-zinc-400">{c.pricing.planName}</div>
                  </td>
                  <td className="px-5 py-4">
                    {c.status === 'SIGNED' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Signé eIDAS
                      </span>
                    ) : c.status === 'VIEWED' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <Clock className="w-3.5 h-3.5" /> Lu par le client
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Send className="w-3.5 h-3.5" /> Envoyé
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => setSelectedContract(c)}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-white transition inline-flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" /> Consulter
                    </button>
                  </td>
                </tr>
              ))}
              {filteredContracts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-zinc-500">
                    Aucun contrat trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Consultation Contrat */}
      <AnimatePresence>
        {selectedContract && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-400" />
                    {selectedContract.document.title}
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono">
                    Réf : {selectedContract.id} — Statut : {selectedContract.status}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedContract(null)}
                  className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 text-sm text-zinc-300 font-sans">
                {selectedContract.proofCertificate && (
                  <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-4">
                    <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0 mt-1" />
                    <div className="space-y-1 text-xs">
                      <div className="font-bold text-emerald-300 text-sm">
                        Preuve de Signature Électronique eIDAS (Certifiée)
                      </div>
                      <div>
                        Signataire : <strong>{selectedContract.proofCertificate.signerName}</strong> (
                        {selectedContract.proofCertificate.signerRole}) — {selectedContract.proofCertificate.signerEmail}
                      </div>
                      <div>
                        Horodatage UTC : {selectedContract.proofCertificate.signedAtIso} (IP:{' '}
                        {selectedContract.proofCertificate.ipAddress})
                      </div>
                      <div className="font-mono text-[10px] text-emerald-400/80 break-all">
                        Master Seal SHA-256 : {selectedContract.proofCertificate.masterSealSha256}
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800/80 whitespace-pre-wrap font-mono text-xs leading-relaxed text-zinc-300 max-h-[50vh] overflow-y-auto">
                  {selectedContract.document.fullTextContent}
                </div>
              </div>

              <div className="p-4 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-end gap-3">
                <button
                  onClick={() => setSelectedContract(null)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-xs font-semibold text-white hover:bg-zinc-700 transition"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Création Contrat */}
      <AnimatePresence>
        {isCreateModalOpen && (
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
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateContract} className="p-6 overflow-y-auto space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Tenant ID</label>
                    <input
                      type="text"
                      value={tenantId}
                      onChange={(e) => setTenantId(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Verticale Métier</label>
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

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Raison Sociale</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Forme Juridique</label>
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
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">SIREN</label>
                    <input
                      type="text"
                      value={siren}
                      onChange={(e) => setSiren(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Email Signataire</label>
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
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Nom du Représentant</label>
                    <input
                      type="text"
                      value={representativeName}
                      onChange={(e) => setRepresentativeName(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Qualité / Rôle</label>
                    <input
                      type="text"
                      value={representativeRole}
                      onChange={(e) => setRepresentativeRole(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 border-t border-zinc-800 pt-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Tarif Mensuel (€ HT)</label>
                    <input
                      type="number"
                      value={monthlyPrice}
                      onChange={(e) => setMonthlyPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Setup Initial (€ HT)</label>
                    <input
                      type="number"
                      value={setupFee}
                      onChange={(e) => setSetupFee(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Engagement</label>
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
                    onClick={() => setIsCreateModalOpen(false)}
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
    </div>
  );
}
