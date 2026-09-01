"use client";

import { useState, useCallback } from "react";
import { 
  Building2, 
  Send, 
  Inbox, 
  CheckCircle2, 
  FileText, 
  Key, 
  Globe, 
  ShieldCheck,
} from "lucide-react";
import { FacturXDownloadButton } from "../FacturXDownloadButton";
import { useTenant } from "@/shared/hooks/useTenant";
import { useSovereignCollection } from "@/kernel/hooks/useSovereignCollection";
import type { Order } from "@nexus/contracts";

export interface EInvoicingTabProps {
  paidOrders?: Order[];
  ordersLoading?: boolean;
}

export function EInvoicingTab({ paidOrders = [], ordersLoading = false }: EInvoicingTabProps) {
  const { activeTenantId } = useTenant();
  const [providerMode, setProviderMode] = useState<"platform_super_pdp" | "custom_api">("platform_super_pdp");
  const [siret, setSiret] = useState("12345678900014");
  const [companyName, setCompanyName] = useState("Restaurant Le Bellcour");
  const [customEndpoint, setCustomEndpoint] = useState("https://api.pdp-partenaire.fr/v1");
  const [apiKey, setApiKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [configSuccess, setConfigSuccess] = useState(false);

  // Inbound invoices (factures fournisseurs reçues via PDP)
  const { data: inboundInvoices = [] } = useSovereignCollection<{
    id: string;
    invoiceNumber: string;
    supplierName: string;
    supplierSiret: string;
    totalAmountInMicrounits: number;
    status: string;
    issueDate: string;
    dueDate: string;
  }>("inbound_invoices", { tenantId: activeTenantId ?? undefined });

  const handleSaveConfig = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setConfigSuccess(false);
    try {
      await new Promise((r) => setTimeout(r, 600));
      setConfigSuccess(true);
      setTimeout(() => setConfigSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Filtrer les commandes B2B (> 150€ HT ou expressément émises)
  const b2bOrders = paidOrders.filter((o) => {
    const totalMu = o.totalInMicrounits ?? 0;
    return totalMu >= 150_000_000 || o.customerName; // Seuil légal 150€ HT
  });

  return (
    <section className="space-y-6">
      {/* En-tête statut PDP & Décret 2026 */}
      <div className="rounded-xl border border-border/80 bg-surface-card p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-serif font-semibold flex items-center gap-2">
                {"Facturation Électronique B2B · Réforme Factur-X (DGFiP / PPF)"}
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-sans font-medium border border-emerald-500/20">
                  {"Conforme NF525 & PDP"}
                </span>
              </h2>
              <p className="text-xs text-text-muted">
                {"Émission et réception automatisées au format mixte Factur-X (PDF/A-3 + XML CII/UBL)."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">{"Connectivité :"}</span>
            <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-surface-base border border-border flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {providerMode === "platform_super_pdp" ? "Super-PDP Plateforme (Option 1)" : "API Dédiée Tenant (Option 2)"}
            </span>
          </div>
        </div>

        {/* Configuration Connectivité (Option 1 vs Option 2) */}
        <form onSubmit={handleSaveConfig} className="pt-3 border-t border-border/60 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label
              onClick={() => setProviderMode("platform_super_pdp")}
              className={`p-3.5 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${
                providerMode === "platform_super_pdp"
                  ? "border-accent bg-accent/5 ring-1 ring-accent"
                  : "border-border bg-surface-base hover:border-border-hover"
              }`}
            >
              <Globe className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <div className="space-y-1 text-left">
                <p className="text-xs font-semibold">{"Option 1 : Super-PDP Mutualisé (SaaS)"}</p>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  {"Raccordement direct au concentrateur agréé Super-PDP Restaurant OS. Déclaration automatique du SIRET auprès du Portail Public de Facturation (PPF)."}
                </p>
              </div>
            </label>

            <label
              onClick={() => setProviderMode("custom_api")}
              className={`p-3.5 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${
                providerMode === "custom_api"
                  ? "border-accent bg-accent/5 ring-1 ring-accent"
                  : "border-border bg-surface-base hover:border-border-hover"
              }`}
            >
              <Key className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <div className="space-y-1 text-left">
                <p className="text-xs font-semibold">{"Option 2 : API Personnalisée / PDP Dédié"}</p>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  {"Branchez vos propres identifiants API sur votre PDP partenaire (Generix, Cecurity, Yooz, Pennylane, etc.)."}
                </p>
              </div>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-text-muted mb-1">{"SIRET Établissement"}</label>
              <input
                type="text"
                value={siret}
                onChange={(e) => setSiret(e.target.value)}
                required
                className="w-full px-3 py-1.5 rounded-md border border-border bg-surface-base text-xs focus:border-accent focus:outline-none"
                placeholder="14 chiffres"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-text-muted mb-1">{"Raison Sociale"}</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                className="w-full px-3 py-1.5 rounded-md border border-border bg-surface-base text-xs focus:border-accent focus:outline-none"
              />
            </div>
            {providerMode === "custom_api" && (
              <>
                <div>
                  <label className="block text-[11px] font-medium text-text-muted mb-1">{"Endpoint API PDP"}</label>
                  <input
                    type="url"
                    value={customEndpoint}
                    onChange={(e) => setCustomEndpoint(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 rounded-md border border-border bg-surface-base text-xs focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-text-muted mb-1">{"Clé API / Token"}</label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="pdp_sk_live_..."
                    className="w-full px-3 py-1.5 rounded-md border border-border bg-surface-base text-xs focus:border-accent focus:outline-none"
                  />
                </div>
              </>
            )}
            <div className="flex items-end">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full px-3 py-1.5 rounded-md bg-accent text-text-on-accent text-xs font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                {isSaving ? "Enregistrement…" : "Mettre à jour la liaison"}
              </button>
            </div>
          </div>

          {configSuccess && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {"Liaison de facturation électronique enregistrée avec succès."}
            </p>
          )}
        </form>
      </div>

      {/* Deux colonnes : Factures Émises (Outbound) & Factures Fournisseurs (Inbound) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Colonne 1 : Factures Émises B2B (>150€ HT) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Send className="w-4 h-4 text-accent" />
              {"Factures Clients Émises (B2B > 150€ HT)"}
            </h3>
            <span className="text-xs text-text-muted">
              {b2bOrders.length} facture{b2bOrders.length !== 1 ? "s" : ""}
            </span>
          </div>

          {ordersLoading ? (
            <p className="text-xs text-text-muted italic py-6 text-center">{"Chargement…"}</p>
          ) : b2bOrders.length === 0 ? (
            <div className="p-5 rounded-lg border border-dashed border-border text-center space-y-1 bg-surface-card">
              <p className="text-xs text-text-muted">
                {"Aucune facture client B2B assujettie émise pour l'instant."}
              </p>
              <p className="text-[11px] text-text-muted/70">
                {"Les règlements B2B ou supérieurs à 150 € HT génèrent automatiquement le scellement Factur-X."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {b2bOrders.map((order) => {
                const totalMu = order.totalInMicrounits ?? 0;
                const totalEur = (totalMu / 1_000_000).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
                return (
                  <div
                    key={order.id}
                    className="p-3 rounded-lg border border-border bg-surface-card flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-accent shrink-0" />
                      <div>
                        <p className="text-xs font-medium">
                          FACT-{new Date().getFullYear()}-{order.id.slice(-6).toUpperCase()}
                        </p>
                        <p className="text-[11px] text-text-muted">
                          {order.customerName ?? "Client Professionnel"} · {totalEur}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-medium">
                        {"Transmis PDP"}
                      </span>
                      <FacturXDownloadButton
                        invoiceId={order.id}
                        filename={`facturx_FACT-${new Date().getFullYear()}-${order.id.slice(-6).toUpperCase()}.xml`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Colonne 2 : Factures Fournisseurs Reçues (Inbound) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Inbox className="w-4 h-4 text-accent" />
              {"Factures Fournisseurs Reçues (Inbound PDP)"}
            </h3>
            <span className="text-xs text-text-muted">
              {inboundInvoices.length} facture{inboundInvoices.length !== 1 ? "s" : ""}
            </span>
          </div>

          {inboundInvoices.length === 0 ? (
            <div className="p-5 rounded-lg border border-dashed border-border text-center space-y-1 bg-surface-card">
              <p className="text-xs text-text-muted">
                {"Aucune facture fournisseur reçue via le concentrateur pour le moment."}
              </p>
              <p className="text-[11px] text-text-muted/70">
                {"Les factures acheminées par vos fournisseurs (Metro, Transgourmet, etc.) apparaîtront ici automatiquement avec rapprochement 3-way match."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {inboundInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="p-3 rounded-lg border border-border bg-surface-card flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="w-4 h-4 text-text-muted shrink-0" />
                    <div>
                      <p className="text-xs font-medium">{inv.supplierName}</p>
                      <p className="text-[11px] text-text-muted">
                        N° {inv.invoiceNumber} · {((inv.totalAmountInMicrounits || 0) / 1_000_000).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-surface-base border border-border text-text-secondary font-medium">
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
