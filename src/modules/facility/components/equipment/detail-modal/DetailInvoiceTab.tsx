'use client';

import React from 'react';
import { ExternalLink, TrendingDown } from 'lucide-react';
import type { EquipmentAsset } from '../../../assets/domain/schemas/equipment';
import type { DepreciationYear } from '../../../services/EquipmentAssetService';

interface DetailInvoiceTabProps {
  asset: EquipmentAsset;
  depreciationSchedule: DepreciationYear[];
}

export function DetailInvoiceTab({ asset, depreciationSchedule }: DetailInvoiceTabProps) {
  if (!asset.purchase) {
    return (
      <div className="p-8 text-center bg-surface-glass rounded-2xl border border-border-default text-text-muted text-xs">
        Aucune facture ni garantie enregistrée pour cet équipement.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-surface-glass p-4 rounded-2xl border border-border-default">
        <div>
          <span className="text-text-muted text-xs block font-semibold">Fournisseur</span>
          <span className="text-text-primary font-medium text-sm">{asset.purchase.supplierName}</span>
        </div>
        <div>
          <span className="text-text-muted text-xs block font-semibold">Date d Achat</span>
          <span className="text-text-primary font-medium text-sm">
            {new Date(asset.purchase.purchaseDate).toLocaleDateString('fr-FR')}
          </span>
        </div>
        <div>
          <span className="text-text-muted text-xs block font-semibold">Prix d Achat HT</span>
          <span className="text-emerald-400 font-bold text-sm">
            {(asset.purchase.purchasePriceInMicrounits / 1_000_000).toLocaleString('fr-FR', {
              style: 'currency',
              currency: 'EUR',
            })}
          </span>
        </div>

        <div>
          <span className="text-text-muted text-xs block font-semibold">Garantie Constructeur</span>
          <span className="text-text-primary font-medium text-sm">
            {asset.purchase.warrantyDurationMonths} mois (Échéance :{' '}
            {new Date(asset.purchase.warrantyExpiresAt).toLocaleDateString('fr-FR')})
          </span>
        </div>

        <div>
          <span className="text-text-muted text-xs block font-semibold">Amortissement Fiscal</span>
          <span className="text-text-primary font-medium text-sm">
            {asset.purchase.depreciationPeriodYears} ans (PCG {asset.purchase.pcgAccount})
          </span>
        </div>

        <div>
          <span className="text-text-muted text-xs block font-semibold">Pièce Justificative</span>
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
            <span className="text-text-muted text-xs mt-1 block">Non téléversée</span>
          )}
        </div>
      </div>

      {/* Tableau d'Amortissement */}
      <div className="bg-surface-glass p-4 rounded-2xl border border-border-default">
        <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-indigo-400" />
          <span>Tableau d Amortissement Linéaire (Comptabilité PCG)</span>
        </h4>
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-border-default text-text-muted">
              <th className="py-2">Année</th>
              <th className="py-2">Dotation Annuelle</th>
              <th className="py-2">Amortissements Cumulés</th>
              <th className="py-2 text-right">Valeur Nette Comptable (VNC)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default">
            {depreciationSchedule.map((row) => (
              <tr key={row.yearIndex} className="text-text-secondary">
                <td className="py-2 font-medium">{row.year} (An {row.yearIndex})</td>
                <td className="py-2">{(row.annualDepreciationInMicrounits / 1_000_000).toFixed(2)} €</td>
                <td className="py-2">{(row.accumulatedDepreciationInMicrounits / 1_000_000).toFixed(2)} €</td>
                <td className="py-2 text-right font-bold text-text-primary">
                  {(row.bookValueInMicrounits / 1_000_000).toFixed(2)} €
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
