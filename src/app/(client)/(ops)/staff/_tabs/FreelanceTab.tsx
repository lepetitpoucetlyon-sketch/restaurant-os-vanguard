"use client";

import { useState } from "react";
import type { ContractorRow } from "../staffUtils";
import { Briefcase, Download, FileCheck, ShieldCheck, AlertTriangle, FileText, CheckCircle2, DollarSign } from "lucide-react";
import { Button } from "@ui/Button";
import { ContractorSelfBillingService, type SelfBillingInvoiceDraft } from "@/modules/human";
import { useToast } from "@ui/Toast";
import { Modal } from "@ui/Modal";

interface FreelanceTabProps {
    isManager: boolean;
    billingMonth: string;
    setBillingMonth: (month: string) => void;
    contractorRows: ContractorRow[];
    onOpenContractModal?: (user: ContractorRow['contractor']) => void;
    onOpenAddStaff?: () => void;
}

export function FreelanceTab({
    isManager,
    billingMonth,
    setBillingMonth,
    contractorRows,
    onOpenContractModal,
    onOpenAddStaff
}: FreelanceTabProps) {
    const { showToast } = useToast();
    const [selectedInvoice, setSelectedInvoice] = useState<SelfBillingInvoiceDraft | null>(null);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

    if (!isManager) {
        return (
            <section className="space-y-6">
                <p className="text-sm text-text-muted italic py-8 text-center">
                    Accès réservé aux managers et à la direction.
                </p>
            </section>
        );
    }

    const totalHt = contractorRows.reduce((s, r) => s + r.totalHtEur, 0);
    const totalVat = contractorRows.reduce((s, r) => s + r.totalVatEur, 0);
    const totalTtc = contractorRows.reduce((s, r) => s + r.totalTtcEur, 0);
    const totalHours = contractorRows.reduce((s, r) => s + r.hours, 0);

    const handleGenerateInvoice = (row: ContractorRow) => {
        if (row.hours <= 0) {
            showToast("Aucune vacation pointée pour ce prestataire sur ce mois.", "warning");
            return;
        }

        const draft = ContractorSelfBillingService.generateSelfBillingInvoice({
            contractor: row.contractor,
            tenant: {
                id: 'tenant_main',
                name: 'Restaurant OS Core',
                siret: '89012345600012',
                address: '10 Place Bellecour',
                city: 'Lyon',
                postalCode: '69002',
                vatNumber: 'FR12890123456',
            },
            shifts: [
                {
                    id: 'sh_vacation',
                    date: `${billingMonth}-15`,
                    startTime: '18:00',
                    endTime: '23:30',
                    description: `Vacations cumulées ${billingMonth} (${row.hours}h @ ${row.hourlyRateEur}€/h)`
                }
            ],
            periodMonth: billingMonth,
        });

        setSelectedInvoice(draft);
        setIsInvoiceModalOpen(true);
    };

    const handleDownloadXml = (invoice: SelfBillingInvoiceDraft) => {
        const blob = new Blob([invoice.xmlFacturX], { type: 'application/xml;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${invoice.invoiceNumber}_FacturX.xml`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast(`Facture Factur-X ${invoice.invoiceNumber} téléchargée`, "success");
    };

    return (
        <section className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-serif font-bold tracking-tight text-text-primary">
                        Prestataires & Extras Freelance (Auto-Entrepreneurs)
                    </h2>
                    <p className="text-xs text-text-muted mt-0.5">
                        Mandats d'auto-facturation Factur-X B2B, conventions de mission et suivi des attestations URSSAF.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        type="month"
                        value={billingMonth}
                        onChange={e => setBillingMonth(e.target.value)}
                        className="px-3.5 py-2 rounded-xl border border-border bg-surface-card dark:bg-bg-secondary text-sm font-bold focus:outline-none focus:ring-2 focus:ring-action-primary"
                    />
                    <Button
                        variant="default"
                        size="sm"
                        onClick={onOpenAddStaff}
                        className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
                    >
                        <Briefcase className="w-4 h-4" />
                        Ajouter Prestataire
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-surface-card dark:bg-bg-secondary border border-border">
                    <div className="flex items-center gap-2 text-xs text-text-muted font-bold uppercase tracking-wider mb-1">
                        <DollarSign className="w-3.5 h-3.5 text-action-primary" />
                        Honoraires Total HT
                    </div>
                    <div className="text-2xl font-black font-mono text-text-primary tabular-nums">
                        {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(totalHt)}
                    </div>
                    <p className="text-nano text-text-muted mt-1">
                        Imputation Comptable : Compte 611000
                    </p>
                </div>

                <div className="p-4 rounded-2xl bg-surface-card dark:bg-bg-secondary border border-border">
                    <div className="flex items-center gap-2 text-xs text-text-muted font-bold uppercase tracking-wider mb-1">
                        <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                        Vacations Pointées
                    </div>
                    <div className="text-2xl font-black font-mono text-text-primary tabular-nums">
                        {totalHours.toFixed(1)} h
                    </div>
                    <p className="text-nano text-text-muted mt-1">
                        {contractorRows.length} prestataires indépendants
                    </p>
                </div>

                <div className="p-4 rounded-2xl bg-surface-card dark:bg-bg-secondary border border-border">
                    <div className="flex items-center gap-2 text-xs text-text-muted font-bold uppercase tracking-wider mb-1">
                        <FileCheck className="w-3.5 h-3.5 text-indigo-400" />
                        TVA Facturée
                    </div>
                    <div className="text-2xl font-black font-mono text-text-primary tabular-nums">
                        {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(totalVat)}
                    </div>
                    <p className="text-nano text-text-muted mt-1">
                        Franchise Art. 293 B ou TVA 20%
                    </p>
                </div>

                <div className="p-4 rounded-2xl bg-surface-card dark:bg-bg-secondary border border-border">
                    <div className="flex items-center gap-2 text-xs text-text-muted font-bold uppercase tracking-wider mb-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-status-success" />
                        Total TTC à Régler
                    </div>
                    <div className="text-2xl font-black font-mono text-text-primary tabular-nums text-status-success">
                        {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(totalTtc)}
                    </div>
                    <p className="text-nano text-text-muted mt-1">
                        Par virement bancaire SEPA
                    </p>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-border overflow-hidden bg-surface-card dark:bg-bg-secondary">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-bg-tertiary/50 border-b border-border text-text-muted text-left text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-4 py-3 font-semibold">Prestataire / Entreprise</th>
                                <th className="px-4 py-3 font-semibold">SIRET</th>
                                <th className="px-4 py-3 font-semibold">{"Régime TVA"}</th>
                                <th className="px-4 py-3 font-semibold text-right">{"Heures Pointées"}</th>
                                <th className="px-4 py-3 font-semibold text-right">Taux HT (€/h)</th>
                                <th className="px-4 py-3 font-semibold text-right">Total HT</th>
                                <th className="px-4 py-3 font-semibold text-center">Vigilance URSSAF</th>
                                <th className="px-4 py-3 font-semibold text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {contractorRows.map(row => (
                                <tr key={row.contractor.id} className="hover:bg-bg-tertiary/30 transition-colors">
                                    <td className="px-4 py-3 font-semibold text-text-primary">
                                        <div>{row.companyName}</div>
                                        <div className="text-nano text-text-muted font-normal">{row.contractor.name} ({row.contractor.role})</div>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                                        {row.siret}
                                    </td>
                                    <td className="px-4 py-3 text-xs">
                                        <span className="px-2 py-0.5 rounded text-nano font-bold uppercase tracking-wider bg-bg-tertiary border border-border text-text-muted">
                                            {row.vatRegime === 'franchise_art_293b' ? 'Art. 293 B (0%)' : 'TVA 20%'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono font-bold tabular-nums">
                                        {row.hours.toFixed(1)} h
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono tabular-nums text-text-muted">
                                        {row.hourlyRateEur.toFixed(2)} €
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono font-bold text-text-primary tabular-nums text-base">
                                        {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(row.totalHtEur)}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {row.vigilanceStatus === 'valid' ? (
                                            <span className="inline-flex items-center gap-1 text-nano font-bold text-status-success bg-status-success/10 px-2 py-0.5 rounded-full">
                                                <CheckCircle2 className="w-3 h-3" /> Valide
                                            </span>
                                        ) : row.vigilanceStatus === 'expiring_soon' ? (
                                            <span className="inline-flex items-center gap-1 text-nano font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                                <AlertTriangle className="w-3 h-3" /> Expire bientôt
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-nano font-bold text-status-danger bg-status-danger/10 px-2 py-0.5 rounded-full">
                                                <AlertTriangle className="w-3 h-3" /> Requise (&gt;5k€)
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleGenerateInvoice(row)}
                                                className="text-nano h-8 px-2.5 font-bold flex items-center gap-1 text-action-primary border-action-primary/30 hover:bg-action-primary/10"
                                            >
                                                <FileCheck className="w-3.5 h-3.5" />
                                                Factur-X
                                            </Button>
                                            <button
                                                type="button"
                                                onClick={() => onOpenContractModal?.(row.contractor)}
                                                className="p-1.5 rounded-lg text-text-muted hover:text-action-primary hover:bg-action-primary/10 transition-colors"
                                                title="Générer Convention de Prestation"
                                            >
                                                <FileText className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {contractorRows.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center text-text-muted italic">
                                        Aucun prestataire freelance enregistré ou ayant pointé ce mois-ci.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Factur-X Preview Modal */}
            {selectedInvoice && (
                <Modal
                    isOpen={isInvoiceModalOpen}
                    onClose={() => setIsInvoiceModalOpen(false)}
                    title={`Facture B2B — ${selectedInvoice.invoiceNumber}`}
                >
                    <div className="space-y-6">
                        <div className="p-4 rounded-xl bg-surface-card border border-border flex justify-between items-start">
                            <div>
                                <p className="text-nano font-bold text-text-muted uppercase tracking-wider">{"Émetteur (Prestataire)"}</p>
                                <p className="font-bold text-base text-text-primary mt-1">{selectedInvoice.seller.companyName || selectedInvoice.seller.name}</p>
                                <p className="text-xs font-mono text-text-muted">SIRET : {selectedInvoice.seller.siret}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-nano font-bold text-text-muted uppercase tracking-wider">Total TTC</p>
                                <p className="font-black text-2xl font-mono text-status-success mt-1">
                                    {selectedInvoice.totalTtcEur.toFixed(2)} €
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">{"Mentions Légales & Fiscales"}</p>
                            <div className="p-3.5 rounded-xl bg-bg-tertiary border border-border/50 text-xs text-text-secondary space-y-1">
                                {selectedInvoice.legalMentions.map((m, i) => (
                                    <p key={i} className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-action-primary" />
                                        {m}
                                    </p>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button
                                variant="outline"
                                className="flex-1 h-12 text-xs font-bold uppercase tracking-wider"
                                onClick={() => handleDownloadXml(selectedInvoice)}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Télécharger Factur-X (XML)
                            </Button>
                            <Button
                                variant="default"
                                className="flex-1 h-12 text-xs font-bold uppercase tracking-wider bg-action-primary text-text-on-primary"
                                onClick={() => {
                                    showToast("Facture enregistrée dans les achats fournisseurs (Compte 611000)", "success");
                                    setIsInvoiceModalOpen(false);
                                }}
                            >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Valider & Imputer en Compta (611)
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </section>
    );
}
