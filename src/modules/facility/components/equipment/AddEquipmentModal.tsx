'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Wrench } from 'lucide-react';
import type { EquipmentCategory } from '../../assets/domain/schemas/equipment';

import { buildEquipmentPayload } from './add-modal/equipmentFormHelpers';
import { EquipmentIdentitySection } from './add-modal/EquipmentIdentitySection';
import { EquipmentFinanceSection } from './add-modal/EquipmentFinanceSection';
import { EquipmentSupportSection } from './add-modal/EquipmentSupportSection';

interface AddEquipmentModalProps {
  onClose: () => void;
  onEquipmentCreated: () => void;
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
      const payload = buildEquipmentPayload({
        name, category, brand, model, serialNumber, location,
        supplierName, invoiceNumber, invoiceUrl, purchasePriceEuros,
        purchaseDate, warrantyMonths, depreciationYears, supportPhone, supportCompany,
      });
      const res = await fetch('/api/facility/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
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

          <EquipmentIdentitySection
            name={name}
            setName={setName}
            category={category}
            setCategory={setCategory}
            location={location}
            setLocation={setLocation}
            brand={brand}
            setBrand={setBrand}
            model={model}
            setModel={setModel}
            serialNumber={serialNumber}
            setSerialNumber={setSerialNumber}
          />

          <EquipmentFinanceSection
            supplierName={supplierName}
            setSupplierName={setSupplierName}
            purchasePriceEuros={purchasePriceEuros}
            setPurchasePriceEuros={setPurchasePriceEuros}
            purchaseDate={purchaseDate}
            setPurchaseDate={setPurchaseDate}
            invoiceUrl={invoiceUrl}
            setInvoiceUrl={setInvoiceUrl}
            warrantyMonths={warrantyMonths}
            setWarrantyMonths={setWarrantyMonths}
          />

          <EquipmentSupportSection
            supportCompany={supportCompany}
            setSupportCompany={setSupportCompany}
            supportPhone={supportPhone}
            setSupportPhone={setSupportPhone}
          />

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
