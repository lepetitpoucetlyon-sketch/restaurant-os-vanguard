'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Plus,
  Wrench,
  FileText,
  ShieldCheck,
  Building,
  DollarSign,
} from 'lucide-react';
import {
  EquipmentCategory,
} from '../../assets/domain/schemas/equipment';

interface AddEquipmentModalProps {
  onClose: () => void;
  onEquipmentCreated: () => void;
}

interface EquipmentFormFields {
  name: string; category: EquipmentCategory; brand: string; model: string;
  serialNumber: string; location: string; supplierName: string; invoiceNumber: string;
  invoiceUrl: string; purchasePriceEuros: string; purchaseDate: string;
  warrantyMonths: number; depreciationYears: number; supportPhone: string; supportCompany: string;
}

function buildEquipmentPayload(f: EquipmentFormFields) {
  const pDate = new Date(f.purchaseDate);
  const warrantyExpDate = new Date(pDate);
  warrantyExpDate.setMonth(warrantyExpDate.getMonth() + f.warrantyMonths);
  const nextMaint = new Date();
  nextMaint.setDate(nextMaint.getDate() + 90);
  return {
    name: f.name.trim(), category: f.category, brand: f.brand.trim(), model: f.model.trim(),
    serialNumber: f.serialNumber.trim(), location: f.location.trim(), status: 'OPERATIONAL',
    purchase: {
      supplierName: f.supplierName.trim() || f.brand.trim(),
      invoiceNumber: f.invoiceNumber.trim() || undefined,
      invoiceUrl: f.invoiceUrl.trim() || undefined,
      purchaseDate: pDate.toISOString(),
      purchasePriceInMicrounits: Math.round(parseFloat(f.purchasePriceEuros || '0') * 1_000_000),
      taxRatePercent: 20, warrantyDurationMonths: f.warrantyMonths,
      warrantyExpiresAt: warrantyExpDate.toISOString(), depreciationPeriodYears: f.depreciationYears, pcgAccount: '2183',
    },
    maintenanceFrequencyDays: 90, nextMaintenanceDueAt: nextMaint.toISOString(),
    supportContact: {
      companyName: f.supportCompany.trim() || f.supplierName.trim() || f.brand.trim(),
      phone: f.supportPhone.trim() || undefined,
    },
  };
}

export function AddEquipmentModal({ onClose, onEquipmentCreated }: AddEquipmentModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<EquipmentCategory>('COOKING');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [location, setLocation] = useState('Cuisine Principale');
  
  // Financier & Facture
  const [supplierName, setSupplierName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceUrl, setInvoiceUrl] = useState('');
  const [purchasePriceEuros, setPurchasePriceEuros] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [warrantyMonths, setWarrantyMonths] = useState(24);
  const [depreciationYears, setDepreciationYears] = useState(5);

  // SAV Contact
  const [supportPhone, setSupportPhone] = useState('');
  const [supportCompany, setSupportCompany] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !brand.trim() || !model.trim() || !serialNumber.trim()) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }
    try {
      setIsSubmitting(true);
      const payload = buildEquipmentPayload({ name, category, brand, model, serialNumber, location, supplierName, invoiceNumber, invoiceUrl, purchasePriceEuros, purchaseDate, warrantyMonths, depreciationYears, supportPhone, supportCompany });
      const res = await fetch('/api/facility/equipment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? 'Erreur lors de la création');
      }
      onEquipmentCreated();
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-indigo-400 tracking-wide uppercase">
                Inventaire & Parc Matériel
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Ajouter un Équipement & Facture
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="overflow-y-auto py-5 space-y-5 flex-1 pr-1 custom-scrollbar">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Section 1 : Informations Machine */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Building className="w-3.5 h-3.5 text-indigo-400" />
              <span>Identité de la Machine</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1">
                  Nom d usage de l équipement *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Four Mixte Rational iCombi Pro 10 GN, Lave-verre Hobart..."
                  className="w-full px-3.5 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1">
                  Catégorie Métier
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as EquipmentCategory)}
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500/50 text-sm"
                >
                  <option value="COOKING">🔥 Cuisson & Chaud (Fours, pianos...)</option>
                  <option value="COLD_STORAGE">❄️ Froid (Chambres froides, armoires...)</option>
                  <option value="WASHING">🧼 Lavage (Lave-vaisselle, plonge...)</option>
                  <option value="BEVERAGE_COFFEE">☕ Bar & Café (Machines espresso, tireuses...)</option>
                  <option value="FOOD_PREP">🔪 Préparation (Robots, trancheurs...)</option>
                  <option value="POS_HARDWARE">🖥️ Caisse & TPE (Imprimantes, écrans...)</option>
                  <option value="HVAC_EXTRACTION">💨 Extraction & Climatisation</option>
                  <option value="SECURITY_SAFETY">🛡️ Sécurité & ERP (Extincteurs...)</option>
                  <option value="OTHER">📦 Autre matériel</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1">
                  Emplacement
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ex: Cuisine Chaude, Bar Principal, Cave..."
                  className="w-full px-3.5 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1">
                  Marque *
                </label>
                <input
                  type="text"
                  required
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Ex: Rational, Hobart, La Marzocco..."
                  className="w-full px-3.5 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1">
                  Modèle & N° de Série *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Modèle"
                    className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 text-sm"
                  />
                  <input
                    type="text"
                    required
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="N° Série (S/N)"
                    className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2 : Facture d'Achat & Données Comptables */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Facture d Achat & Garantie</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1">
                  Fournisseur / Revendeur
                </label>
                <input
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="Ex: Matériel Resto Pro"
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1">
                  Prix d Achat (€ HT)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={purchasePriceEuros}
                  onChange={(e) => setPurchasePriceEuros(e.target.value)}
                  placeholder="Ex: 8500"
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1">
                  Date d Achat
                </label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500/50 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1">
                  Lien de la Facture Numérisée (PDF / Scan Drive)
                </label>
                <input
                  type="url"
                  value={invoiceUrl}
                  onChange={(e) => setInvoiceUrl(e.target.value)}
                  placeholder="https://drive.google.com/facture-four.pdf..."
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1">
                  Garantie Constructeur
                </label>
                <select
                  value={warrantyMonths}
                  onChange={(e) => setWarrantyMonths(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500/50 text-sm"
                >
                  <option value={12}>12 Mois (1 an)</option>
                  <option value={24}>24 Mois (2 ans)</option>
                  <option value={36}>36 Mois (3 ans)</option>
                  <option value={60}>60 Mois (5 ans)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3 : Contact SAV */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Assistance & Contact SAV</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1">
                  Prestataire SAV / Dépannage
                </label>
                <input
                  type="text"
                  value={supportCompany}
                  onChange={(e) => setSupportCompany(e.target.value)}
                  placeholder="Ex: Froid Froid Express SAV"
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1">
                  Téléphone d Urgence SAV
                </label>
                <input
                  type="tel"
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  placeholder="Ex: 01 44 00 00 00"
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Enregistrement...' : 'Ajouter au Parc Matériel'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
