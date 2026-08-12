"use client";

import { useState } from "react";
import { FileText, Building2, X } from "lucide-react";
import { Modal } from "@ui/Modal";

export interface InvoiceRequestData {
  customerName: string;
  customerSiret: string;
  customerAddress?: string;
}

interface InvoiceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: InvoiceRequestData) => void;
  totalHTInMicrounits: number;
  isRequired: boolean;
}

const THRESHOLD_HT_MU = 150_000_000;

export function InvoiceRequestModal({
  isOpen,
  onClose,
  onSubmit,
  totalHTInMicrounits,
  isRequired,
}: InvoiceRequestModalProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerSiret, setCustomerSiret] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!customerName.trim()) e.customerName = "Raison sociale obligatoire";
    if (!customerSiret.trim()) {
      e.customerSiret = "SIRET obligatoire";
    } else if (!/^\d{14}$/.test(customerSiret.replace(/\s/g, ""))) {
      e.customerSiret = "SIRET invalide (14 chiffres)";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({
      customerName: customerName.trim(),
      customerSiret: customerSiret.replace(/\s/g, ""),
      customerAddress: customerAddress.trim() || undefined,
    });
  };

  const totalHT = totalHTInMicrounits / 1_000_000;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" showClose={false} noPadding>
      <div className="bg-bg-secondary p-8 rounded-2xl border border-border/50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent-gold/10 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-accent-gold" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">Demande de facture</h2>
              <p className="text-xs text-text-muted">
                {isRequired
                  ? `Obligatoire au-delà de 150 € HT (total : ${totalHT.toFixed(2)} € HT)`
                  : "Le client demande une facture professionnelle"}
              </p>
            </div>
          </div>
          {!isRequired && (
            <button onClick={onClose} className="p-2 hover:bg-surface-sidebar/60 rounded-xl transition">
              <X className="w-5 h-5 text-text-muted" />
            </button>
          )}
        </div>

        {isRequired && (
          <div className="mb-6 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <p className="text-xs text-amber-600 font-medium">
              Le montant HT dépasse 150 € — une facture normalisée avec les coordonnées
              de l&apos;entreprise est exigée pour la récupération de TVA (CGI art. 289).
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1 block">
              Raison sociale *
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nom de l'entreprise"
                className="w-full pl-10 pr-4 py-3 bg-surface-sidebar/40 border border-border/50 rounded-xl text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent-gold/30"
              />
            </div>
            {errors.customerName && <p className="text-xs text-red-500 mt-1">{errors.customerName}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1 block">
              SIRET *
            </label>
            <input
              type="text"
              value={customerSiret}
              onChange={(e) => setCustomerSiret(e.target.value)}
              placeholder="123 456 789 00012"
              maxLength={17}
              className="w-full px-4 py-3 bg-surface-sidebar/40 border border-border/50 rounded-xl text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent-gold/30 font-mono"
            />
            {errors.customerSiret && <p className="text-xs text-red-500 mt-1">{errors.customerSiret}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1 block">
              Adresse (optionnel)
            </label>
            <input
              type="text"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder="Adresse du siège social"
              className="w-full px-4 py-3 bg-surface-sidebar/40 border border-border/50 rounded-xl text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent-gold/30"
            />
          </div>

          <p className="text-[10px] text-text-muted leading-relaxed">
            Ces informations sont utilisées exclusivement pour l&apos;édition de la facture
            et conservées conformément aux obligations fiscales (NF525). Droit d&apos;accès et
            de rectification : contacter le responsable de l&apos;établissement (RGPD Art. 15-16).
          </p>
        </div>

        <div className="flex gap-3 mt-6">
          {!isRequired && (
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-surface-sidebar/60 text-text-muted rounded-xl text-sm font-semibold hover:bg-surface-sidebar transition"
            >
              Annuler
            </button>
          )}
          <button
            onClick={handleSubmit}
            className="flex-1 py-3 px-4 bg-accent-gold text-text-primary rounded-xl text-sm font-bold hover:bg-accent-gold/90 transition"
          >
            Générer la facture
          </button>
        </div>
      </div>
    </Modal>
  );
}
