"use client";

import React, { useState } from "react";
import {
  Truck,
  Users,
  BadgeEuro,
  CreditCard,
  ClipboardCheck,
  TrendingUp,
  Receipt,
  Building2,
  FileCheck,
  ArrowUpRight,
  BarChart3,
  Calendar,
  Package,
  CheckCircle2,
  AlertCircle,
  Download,
  Filter,
  Plus
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { StatGrid, StatCard } from "@/shared/components/ui";
import { cn } from "@/lib/ui.foundations";

export function SuppliersView() {
  const suppliers = [
    { code: "401METRO", name: "Metro Cash & Carry", balanceCents: 423500, due: "2026-08-30", status: "PENDING" },
    { code: "401BRAKE", name: "Brake France Frais", balanceCents: 185000, due: "2026-09-05", status: "PENDING" },
    { code: "401POMONA", name: "Groupe Pomona TerreAzur", balanceCents: 92000, due: "2026-08-25", status: "OVERDUE" },
    { code: "401VALRHONA", name: "Valrhona Chocolats", balanceCents: 64000, due: "2026-09-15", status: "PENDING" },
  ];
  return (
    <div className="space-y-6">
      <StatGrid columns={3}>
        <StatCard label="Dettes Fournisseurs Totales" value={formatCurrency(7645)} />
        <StatCard label="Factures Échues (>30j)" value={formatCurrency(920)} trend="-12%" />
        <StatCard label="Délai Moyen de Règlement" value="28 jours" />
      </StatGrid>
      <div className="bg-surface-card border border-border-default rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border-default flex justify-between items-center">
          <h3 className="font-bold text-sm text-text-primary">Balance Auxiliaire Fournisseurs (Compte 401)</h3>
          <button className="px-3 py-1.5 rounded-xl bg-action-primary text-text-on-primary text-xs font-bold shadow-sm">
            Nouveau Règlement
          </button>
        </div>
        <table className="w-full text-xs">
          <thead className="bg-surface-bg text-text-muted">
            <tr>
              <th className="p-3 text-left">Compte</th>
              <th className="p-3 text-left">Fournisseur</th>
              <th className="p-3 text-left">Échéance</th>
              <th className="p-3 text-left">Statut</th>
              <th className="p-3 text-right">Solde Dû</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default">
            {suppliers.map((s) => (
              <tr key={s.code} className="hover:bg-surface-hover">
                <td className="p-3 font-mono text-action-primary">{s.code}</td>
                <td className="p-3 font-bold text-text-primary">{s.name}</td>
                <td className="p-3 text-text-muted">{s.due}</td>
                <td className="p-3">
                  <span className={cn("px-2 py-0.5 rounded-full text-nano font-bold", s.status === 'OVERDUE' ? "bg-status-danger/10 text-status-danger" : "bg-status-warning/10 text-status-warning")}>
                    {s.status === 'OVERDUE' ? 'Échue' : 'À régler'}
                  </span>
                </td>
                <td className="p-3 text-right font-mono font-bold text-text-primary">{formatCurrency(s.balanceCents / 100)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function CustomersView() {
  return (
    <div className="space-y-6">
      <StatGrid columns={3}>
        <StatCard label="Créances Clients (411)" value={formatCurrency(3420)} />
        <StatCard label="Factures Séminaires & Groupes" value="5 en cours" />
        <StatCard label="Délai Encaissement (DSO)" value="14 jours" />
      </StatGrid>
      <div className="p-6 bg-surface-card border border-border-default rounded-2xl text-center space-y-3">
        <Users className="w-10 h-10 text-action-primary mx-auto" />
        <h4 className="font-bold text-text-primary text-sm">Gestion des Comptes Clients & Débiteurs</h4>
        <p className="text-xs text-text-muted max-w-md mx-auto">
          Factures d'entreprises, événements de groupe et transferts folios hôtel en attente de virement bancaire.
        </p>
      </div>
    </div>
  );
}

export function EmployeesView() {
  return (
    <div className="space-y-6">
      <StatGrid columns={3}>
        <StatCard label="Masse Salariale Brute (641)" value={formatCurrency(14850)} />
        <StatCard label="Charges Sociales Patronales (645)" value={formatCurrency(6240)} />
        <StatCard label="Effectif Rémunéré" value="8 salariés" />
      </StatGrid>
      <div className="p-4 bg-surface-card border border-border-default rounded-2xl flex items-center justify-between">
        <div>
          <h4 className="font-bold text-sm text-text-primary">Journal de Paie Mensuel</h4>
          <p className="text-xs text-text-muted">Écritures automatiques des salaires nets et des cotisations URSSAF.</p>
        </div>
        <button className="px-4 py-2 rounded-xl bg-action-primary text-text-on-primary text-xs font-bold shadow-sm">
          Exporter DSN / FEC Paie
        </button>
      </div>
    </div>
  );
}

export function CashBankView() {
  return (
    <div className="space-y-6">
      <StatGrid columns={3}>
        <StatCard label="Solde Banque Principale (512)" value={formatCurrency(28450)} />
        <StatCard label="Fond de Caisse POS (530)" value={formatCurrency(500)} />
        <StatCard label="Remises Cartes en Transit (580)" value={formatCurrency(3120)} />
      </StatGrid>
    </div>
  );
}

export function ReconciliationView() {
  return (
    <div className="space-y-6">
      <StatGrid columns={3}>
        <StatCard label="Taux de Rapprochement" value="98.4%" />
        <StatCard label="Écritures Rapprochées" value="412 / 418" />
        <StatCard label="Écart Résiduel" value={formatCurrency(0)} />
      </StatGrid>
      <div className="p-5 bg-surface-card border border-border-default rounded-2xl flex items-center gap-4">
        <CheckCircle2 className="w-8 h-8 text-status-success shrink-0" />
        <div>
          <h4 className="font-bold text-sm text-text-primary">Liaison Bancaire Automatique EBICS / OpenBanking</h4>
          <p className="text-xs text-text-muted">Flux bancaire synchronisé en temps réel avec le grand livre des encaissements TPE.</p>
        </div>
      </div>
    </div>
  );
}

export function ForecastView() {
  return (
    <div className="space-y-6">
      <StatGrid columns={3}>
        <StatCard label="Trésorerie Prévisionnelle J+30" value={formatCurrency(34200)} trend="+18%" />
        <StatCard label="Décaissements Prévus" value={formatCurrency(12400)} />
        <StatCard label="Encaissements Prévus" value={formatCurrency(18150)} />
      </StatGrid>
    </div>
  );
}

export function TVAView() {
  return (
    <div className="space-y-6">
      <StatGrid columns={3}>
        <StatCard label="TVA Collectée (44571)" value={formatCurrency(3840)} />
        <StatCard label="TVA Déductible (44566)" value={formatCurrency(1420)} />
        <StatCard label="TVA Nette à Décaisser" value={formatCurrency(2420)} />
      </StatGrid>
      <div className="p-4 bg-surface-card border border-border-default rounded-2xl flex items-center justify-between">
        <div>
          <h4 className="font-bold text-sm text-text-primary">Déclaration CA3 Mensuelle</h4>
          <p className="text-xs text-text-muted">Ventilation automatique des taux 10% (restauration) et 20% (alcools/boissons).</p>
        </div>
        <button className="px-4 py-2 rounded-xl bg-action-primary text-text-on-primary text-xs font-bold">
          Télédéclarer CA3
        </button>
      </div>
    </div>
  );
}

export function ISView() {
  return (
    <div className="space-y-6">
      <StatGrid columns={3}>
        <StatCard label="Résultat Fiscal Estimé" value={formatCurrency(42000)} />
        <StatCard label="Taux Réduit PME (15%)" value={formatCurrency(6300)} />
        <StatCard label="Prochain Acompte IS" value="15 Septembre 2026" />
      </StatGrid>
    </div>
  );
}

export function LiasseFiscaleView() {
  return (
    <div className="space-y-6">
      <StatGrid columns={3}>
        <StatCard label="Régime Fiscal" value="Réel Simplifié" />
        <StatCard label="Formulaires Prêts" value="2050, 2051, 2052, 2053" />
        <StatCard label="Télétransmission EDI" value="Connecté DGFiP" />
      </StatGrid>
    </div>
  );
}

export function CashFlowView() {
  return (
    <div className="space-y-6">
      <StatGrid columns={3}>
        <StatCard label="Flux Opérationnel" value={formatCurrency(8450)} />
        <StatCard label="Flux d'Investissement" value={formatCurrency(-2100)} />
        <StatCard label="Variation Nette de Trésorerie" value={formatCurrency(6350)} trend="+8.2%" />
      </StatGrid>
    </div>
  );
}

export function AnalyticsView() {
  return (
    <div className="space-y-6">
      <StatGrid columns={4}>
        <StatCard label="Food Cost Ratio" value="28.4%" trend="-1.2%" />
        <StatCard label="Labor Cost Ratio" value="32.1%" />
        <StatCard label="Prime Cost" value="60.5%" trend="Optimal" />
        <StatCard label="Marge Brute" value="71.6%" />
      </StatGrid>
    </div>
  );
}

export function MonthlyClosingView() {
  return (
    <div className="space-y-6">
      <StatGrid columns={3}>
        <StatCard label="Période en cours" value="Août 2026" />
        <StatCard label="Contrôles Validés" value="12 / 12" />
        <StatCard label="Statut Clôture" value="Prête au scellage" />
      </StatGrid>
      <div className="p-4 bg-surface-card border border-border-default rounded-2xl flex items-center justify-between">
        <div>
          <h4 className="font-bold text-sm text-text-primary">Génération du Bilan Mensuel & Export Expert-Comptable</h4>
          <p className="text-xs text-text-muted">Génération des écritures d'inventaire, des FNP et des CCA.</p>
        </div>
        <button className="px-4 py-2 rounded-xl bg-action-primary text-text-on-primary text-xs font-bold">
          Clôturer le Mois
        </button>
      </div>
    </div>
  );
}

export function AnnualClosingView() {
  return (
    <div className="space-y-6">
      <StatGrid columns={3}>
        <StatCard label="Exercice Fiscal" value="2026 (01/01 → 31/12)" />
        <StatCard label="Bilan Provisoire" value={formatCurrency(68500)} />
        <StatCard label="Grand Livre Scellé" value="Conforme NF525" />
      </StatGrid>
    </div>
  );
}

export function InventoryView() {
  return (
    <div className="space-y-6">
      <StatGrid columns={3}>
        <StatCard label="Valeur Stock Actuel" value={formatCurrency(12480)} />
        <StatCard label="Écart Inventaire / Théorique" value="-1.4%" />
        <StatCard label="Dernier Inventaire Physique" value="31 Juillet 2026" />
      </StatGrid>
    </div>
  );
}
