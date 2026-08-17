'use client';

import { FileText } from 'lucide-react';

interface EquipmentFinanceSectionProps {
  supplierName: string;
  setSupplierName: (v: string) => void;
  purchasePriceEuros: string;
  setPurchasePriceEuros: (v: string) => void;
  purchaseDate: string;
  setPurchaseDate: (v: string) => void;
  invoiceUrl: string;
  setInvoiceUrl: (v: string) => void;
  warrantyMonths: number;
  setWarrantyMonths: (v: number) => void;
}

export function EquipmentFinanceSection({
  supplierName,
  setSupplierName,
  purchasePriceEuros,
  setPurchasePriceEuros,
  purchaseDate,
  setPurchaseDate,
  invoiceUrl,
  setInvoiceUrl,
  warrantyMonths,
  setWarrantyMonths,
}: EquipmentFinanceSectionProps) {
  return (
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
  );
}
