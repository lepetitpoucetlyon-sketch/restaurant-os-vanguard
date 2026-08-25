"use client";

import { Wallet, Loader2, Download } from "lucide-react";
import { microToEur, type SupplierInvoice } from "./treasuryTypes";

interface TreasurySepaExportProps {
  pendingInvoices: SupplierInvoice[];
  totalPending: number;
  generatingSepa: boolean;
  onGenerateSepa: () => Promise<void>;
}

export function TreasurySepaExport({
  pendingInvoices,
  totalPending,
  generatingSepa,
  onGenerateSepa,
}: TreasurySepaExportProps) {
  return (
    <div className="rounded-xl border border-border bg-surface-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-action-primary/10 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-action-primary" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest">
              Virements SEPA
            </h3>
            <p className="text-nano text-text-muted">
              Générer un fichier pain.001.001.03 pour les factures approuvées
            </p>
          </div>
        </div>
        <button
          onClick={onGenerateSepa}
          disabled={generatingSepa || pendingInvoices.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-action-primary text-white text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generatingSepa ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Générer SEPA ({pendingInvoices.length})
        </button>
      </div>

      {pendingInvoices.length === 0 ? (
        <p className="text-xs text-text-muted text-center py-4">
          Aucune facture approuvée en attente de paiement.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-text-muted text-left">
                <th className="pb-2 font-black uppercase tracking-widest text-nano">
                  Fournisseur
                </th>
                <th className="pb-2 font-black uppercase tracking-widest text-nano">
                  Échéance
                </th>
                <th className="pb-2 font-black uppercase tracking-widest text-nano text-right">
                  Montant
                </th>
              </tr>
            </thead>
            <tbody>
              {pendingInvoices.map((inv) => (
                <tr key={inv.id} className="border-b border-border/50">
                  <td className="py-2.5 font-medium">{inv.supplierName}</td>
                  <td className="py-2.5 font-mono text-text-muted">
                    {new Date(inv.dueDate).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="py-2.5 text-right font-mono font-bold">
                    {microToEur(inv.amountInMicrounits)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold">
                <td className="pt-3" colSpan={2}>
                  Total
                </td>
                <td className="pt-3 text-right font-mono">
                  {microToEur(totalPending)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
