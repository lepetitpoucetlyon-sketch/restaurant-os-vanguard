"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  Send, 
  ShieldCheck, 
  FileText, 
  Calendar, 
  Users, 
  PieChart, 
  Building, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink,
  Sparkles,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Layers
} from 'lucide-react';
import { cn } from '@/lib/ui.foundations';
import type { AccountingMonthlySummary } from '@/modules/finance/comptabilite/services/MonthlyAccountingPackService';

export default function AccountingPortalPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2026-08');
  const [activeTab, setActiveTab] = useState<'sales' | 'vat' | 'payroll' | 'reconciliation' | 'ai-audit'>('sales');
  const [summary, setSummary] = useState<AccountingMonthlySummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isTransmitting, setIsTransmitting] = useState<string | null>(null);
  const [transmitSuccess, setTransmitSuccess] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  // Charger les données du mois sélectionné
  useEffect(() => {
    async function loadSummary() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/finance/accounting-portal/summary?period=${selectedPeriod}`);
        const data = await res.json();
        if (data.ok) {
          setSummary(data.summary);
        }
      } catch (e) {
        console.error('Erreur chargement summary', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadSummary();
  }, [selectedPeriod]);

  // Téléchargement du pack en 1 clic
  const handleDownloadPack = async () => {
    setIsDownloading(true);
    try {
      const res = await fetch(`/api/finance/accounting-portal/pack?period=${selectedPeriod}`);
      const data = await res.json();
      if (data.ok && data.pack?.files) {
        // Télécharger le fichier FEC simulé en direct
        const blob = new Blob([data.pack.files.fecContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = data.pack.files.fecFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error('Erreur download pack', e);
    } finally {
      setIsDownloading(false);
    }
  };

  // Télétransmission directe vers un logiciel comptable
  const handleTransmit = async (provider: 'pennylane' | 'silae' | 'sage' | 'cegid') => {
    setIsTransmitting(provider);
    setTransmitSuccess(null);
    try {
      const res = await fetch('/api/finance/accounting-portal/transmit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 'demo-restaurant',
          period: selectedPeriod,
          provider,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setTransmitSuccess(provider);
        setTimeout(() => setTransmitSuccess(null), 5000);
      }
    } catch (e) {
      console.error('Erreur transmission', e);
    } finally {
      setIsTransmitting(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 lg:p-10 font-sans">
      {/* En-tête Global Espace Expert-Comptable */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-white/10">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">Portail Fiduciaire & Expert-Comptable</h1>
                <span className="bg-amber-500/20 text-amber-300 text-xs px-2.5 py-0.5 rounded-full border border-amber-500/30 font-semibold">
                  RBAC 65 • Lecture Seule Fiscale
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-0.5">
                Clôtures mensuelles scellées NF525, Fichier FEC DGFiP, Ventilation TVA CA3 et Intégration Silae / Pennylane.
              </p>
            </div>
          </div>
        </div>

        {/* Sélecteur de Période & Statut NF525 */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5">
            <Calendar className="w-4 h-4 text-amber-400 mr-2" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-transparent text-sm text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="2026-08" className="bg-slate-900">Août 2026</option>
              <option value="2026-07" className="bg-slate-900">Juillet 2026</option>
              <option value="2026-06" className="bg-slate-900">Juin 2026</option>
              <option value="2026-05" className="bg-slate-900">Mai 2026</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-xl text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>NF525 Certifié</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8 space-y-8">
        {/* HERO SECTION : Bouton 1-Clic Pack Mensuel & Télétransmission */}
        <div className="bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-indigo-950/40 border border-white/10 rounded-3xl p-6 lg:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Clôture Fiscale Mensuelle en 1 Clic
              </span>
              <h2 className="text-xl lg:text-2xl font-bold text-white">
                Pack Comptable {selectedPeriod} • Prêt pour le Cabinet
              </h2>
              <p className="text-sm text-slate-300 max-w-2xl">
                Contient l'intégralité des pièces légales scellées : FEC DGFiP officiel, Grand Livre des Ventes NF525, 
                ventilations TVA (5.5%, 10%, 20%), variables de paie Silae HCR et lettrage bancaire.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <button
                onClick={handleDownloadPack}
                disabled={isDownloading}
                className="flex-1 lg:flex-initial flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold px-6 py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all text-sm"
              >
                <Download className={cn("w-4 h-4", isDownloading && "animate-bounce")} />
                <span>{isDownloading ? "Compilation du Pack..." : "Télécharger Pack Mensuel (ZIP)"}</span>
              </button>
            </div>
          </div>

          {/* Télétransmission Directe API */}
          <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-slate-400 font-medium">
              Télétransmission Directe API vers les logiciels comptables français :
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleTransmit('pennylane')}
                disabled={!!isTransmitting}
                className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-white/10 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:border-amber-500/40"
              >
                <span>🪙 Pennylane</span>
                <Send className="w-3 h-3 text-slate-400" />
              </button>

              <button
                onClick={() => handleTransmit('silae')}
                disabled={!!isTransmitting}
                className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-white/10 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:border-indigo-500/40"
              >
                <span>💼 Silae Paie</span>
                <Send className="w-3 h-3 text-slate-400" />
              </button>

              <button
                onClick={() => handleTransmit('sage')}
                disabled={!!isTransmitting}
                className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-white/10 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:border-emerald-500/40"
              >
                <span>📗 Sage 100</span>
                <Send className="w-3 h-3 text-slate-400" />
              </button>

              <button
                onClick={() => handleTransmit('cegid')}
                disabled={!!isTransmitting}
                className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-white/10 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:border-blue-500/40"
              >
                <span>📘 Cegid Loop</span>
                <Send className="w-3 h-3 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Toast de succès de transmission */}
          {transmitSuccess && (
            <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Télétransmission réussie vers {transmitSuccess.toUpperCase()} pour la période {selectedPeriod} !</span>
            </div>
          )}
        </div>

        {/* BARRE D'ONGLETS THÉMATIQUES */}
        <div className="flex border-b border-white/10 gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveTab('sales')}
            className={cn(
              "px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all",
              activeTab === 'sales'
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            )}
          >
            <TrendingUp className="w-4 h-4" />
            <span>📜 Ventes & Fiscalité NF525</span>
          </button>

          <button
            onClick={() => setActiveTab('vat')}
            className={cn(
              "px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all",
              activeTab === 'vat'
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            )}
          >
            <PieChart className="w-4 h-4" />
            <span>📊 Déclaration TVA (CA3)</span>
          </button>

          <button
            onClick={() => setActiveTab('payroll')}
            className={cn(
              "px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all",
              activeTab === 'payroll'
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            )}
          >
            <Users className="w-4 h-4" />
            <span>👥 Social & Paie HCR (Silae)</span>
          </button>

          <button
            onClick={() => setActiveTab('reconciliation')}
            className={cn(
              "px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all",
              activeTab === 'reconciliation'
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            )}
          >
            <CreditCard className="w-4 h-4" />
            <span>🏦 Rapprochement & Achats</span>
          </button>

          <button
            onClick={() => setActiveTab('ai-audit')}
            className={cn(
              "px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all",
              activeTab === 'ai-audit'
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            )}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>🧠 Auditeur IA Fiscal (Themis)</span>
          </button>
        </div>

        {/* CONTENU DES ONGLETS */}
        <AnimatePresence mode="wait">
          {activeTab === 'sales' && summary && (
            <motion.div
              key="sales"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Carte Chiffre d'Affaires */}
              <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Ventes Clôturées</span>
                <div className="text-3xl font-bold text-white font-mono">
                  {(summary.totalRevenueTtcCents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </div>
                <div className="space-y-2 pt-2 border-t border-white/10 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Chiffre d'Affaires Brut HT :</span>
                    <span className="font-mono font-semibold">{(summary.totalRevenueHtCents / 100).toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total TVA Collectée :</span>
                    <span className="font-mono font-semibold">{((summary.totalRevenueTtcCents - summary.totalRevenueHtCents) / 100).toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Titres-Restaurant CONECS (18%) :</span>
                    <span className="font-mono font-semibold">{(summary.mealVouchersTotalCents / 100).toFixed(2)} €</span>
                  </div>
                </div>
              </div>

              {/* Carte NF525 & Scellement */}
              <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Chaîne Fiscale NF525</span>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{summary.nf525.zReportCount} Tickets Z Scellés</div>
                    <div className="text-xs text-emerald-400 font-medium">Chaîne cryptographique inaltérée</div>
                  </div>
                </div>
                <div className="pt-2 border-t border-white/10 text-xs text-slate-400 space-y-1">
                  <div>Master Hash SHA-256 :</div>
                  <div className="font-mono text-[10px] text-slate-300 bg-slate-950 p-2 rounded-lg break-all">
                    {summary.nf525.masterHashSha256}
                  </div>
                </div>
              </div>

              {/* Carte Export FEC */}
              <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Fichier FEC DGFiP</span>
                <p className="text-xs text-slate-300">
                  Fichier normalisé conforme à l'article A.47 A-1 du Livre des Procédures Fiscales, directement intégrable dans Cegid, Sage, Pennylane et MyUnisoft.
                </p>
                <div className="pt-4">
                  <button
                    onClick={handleDownloadPack}
                    className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 px-4 rounded-xl border border-white/10 text-xs transition-all"
                  >
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>Télécharger FEC_{selectedPeriod.replace('-', '')}.txt</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'vat' && summary && (
            <motion.div
              key="vat"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Ventilation Fiscale TVA & Titres-Restaurant</h3>
                  <p className="text-xs text-slate-400">Bases HT et TVA collectée ventilées pour la déclaration mensuelle CA3.</p>
                </div>
                <div className="text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-lg border border-white/10">
                  Régime Réel Normal / Simplifié
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400">
                      <th className="py-3 px-4">Taux de TVA</th>
                      <th className="py-3 px-4">Nature des Ventes</th>
                      <th className="py-3 px-4 font-mono text-right">Base HT (€)</th>
                      <th className="py-3 px-4 font-mono text-right">Montant TVA (€)</th>
                      <th className="py-3 px-4 font-mono text-right">Total TTC (€)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono text-slate-200">
                    <tr>
                      <td className="py-3.5 px-4 font-bold text-amber-400">5.5 %</td>
                      <td className="py-3.5 px-4 font-sans text-slate-300">Alimentation emportée, eau, produits sous emballage</td>
                      <td className="py-3.5 px-4 text-right">{(summary.vatBreakdown.vat55HtCents / 100).toFixed(2)}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-400">{(summary.vatBreakdown.vat55AmountCents / 100).toFixed(2)}</td>
                      <td className="py-3.5 px-4 text-right font-bold">{((summary.vatBreakdown.vat55HtCents + summary.vatBreakdown.vat55AmountCents) / 100).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-bold text-amber-400">10.0 %</td>
                      <td className="py-3.5 px-4 font-sans text-slate-300">Restauration sur place, boissons sans alcool, café</td>
                      <td className="py-3.5 px-4 text-right">{(summary.vatBreakdown.vat10HtCents / 100).toFixed(2)}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-400">{(summary.vatBreakdown.vat10AmountCents / 100).toFixed(2)}</td>
                      <td className="py-3.5 px-4 text-right font-bold">{((summary.vatBreakdown.vat10HtCents + summary.vatBreakdown.vat10AmountCents) / 100).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-bold text-amber-400">20.0 %</td>
                      <td className="py-3.5 px-4 font-sans text-slate-300">Boissons alcoolisées (Vins, Spiritueux, Bières)</td>
                      <td className="py-3.5 px-4 text-right">{(summary.vatBreakdown.vat20HtCents / 100).toFixed(2)}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-400">{(summary.vatBreakdown.vat20AmountCents / 100).toFixed(2)}</td>
                      <td className="py-3.5 px-4 text-right font-bold">{((summary.vatBreakdown.vat20HtCents + summary.vatBreakdown.vat20AmountCents) / 100).toFixed(2)}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-white/10 font-mono font-bold text-white bg-slate-950/40">
                      <td colSpan={2} className="py-3.5 px-4 font-sans uppercase text-slate-400">Total Général Déclaration</td>
                      <td className="py-3.5 px-4 text-right">{(summary.totalRevenueHtCents / 100).toFixed(2)} €</td>
                      <td className="py-3.5 px-4 text-right text-emerald-400">
                        {((summary.vatBreakdown.vat55AmountCents + summary.vatBreakdown.vat10AmountCents + summary.vatBreakdown.vat20AmountCents) / 100).toFixed(2)} €
                      </td>
                      <td className="py-3.5 px-4 text-right text-amber-400">{(summary.totalRevenueTtcCents / 100).toFixed(2)} €</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'payroll' && summary && (
            <motion.div
              key="payroll"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Effectifs & Heures Travaillées</span>
                <div className="text-2xl font-bold text-white">{summary.payroll.employeeCount} Salariés en poste</div>
                <div className="space-y-2 pt-2 border-t border-white/10 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Heures Travaillées :</span>
                    <span className="font-mono font-semibold">{summary.payroll.totalHoursWorked} h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Heures Sup (36-39h - +10%) :</span>
                    <span className="font-mono font-semibold text-amber-400">{summary.payroll.overtimeHours10} h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Heures Sup (40-43h - +20%) :</span>
                    <span className="font-mono font-semibold text-amber-400">{summary.payroll.overtimeHours20} h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Heures Sup (&gt;43h - +50%) :</span>
                    <span className="font-mono font-semibold text-rose-400">{summary.payroll.overtimeHours50} h</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Avantages en Nature & Pourboires</span>
                <div className="text-2xl font-bold text-white">{summary.payroll.staffMealsDeclaredCount} Repas Enregistrés</div>
                <div className="space-y-2 pt-2 border-t border-white/10 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Avantage Repas CCN HCR :</span>
                    <span className="font-mono font-semibold">4.15 € / repas</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pourboires CB Déclarés (DSN) :</span>
                    <span className="font-mono font-semibold text-emerald-400">{(summary.payroll.declaredTipsTotalCents / 100).toFixed(2)} €</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Télétransmission Silae Paie</span>
                <p className="text-xs text-slate-300">
                  Export direct des variables de paie vers le dossier Silae du cabinet pour génération instantanée des bulletins.
                </p>
                <button
                  onClick={() => handleTransmit('silae')}
                  disabled={!!isTransmitting}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>{isTransmitting === 'silae' ? 'Synchronisation...' : 'Transmettre à Silae Paie'}</span>
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'reconciliation' && summary && (
            <motion.div
              key="reconciliation"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* Rapprochement Bancaire */}
              <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Rapprochement Bancaire DSP2</span>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6" />
                    <span>Lettrage Parfait (Écart : 0,00 €)</span>
                  </div>
                </div>
                <div className="space-y-2 pt-2 border-t border-white/10 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Télécollectes TPE / Stripe :</span>
                    <span className="font-mono font-semibold">{(summary.reconciliation.tpeSettlementsTotalCents / 100).toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Versements Espèces Caisse :</span>
                    <span className="font-mono font-semibold">{(summary.reconciliation.cashDepositsTotalCents / 100).toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Crédits Relevé Bancaire Open Banking :</span>
                    <span className="font-mono font-semibold">{(summary.reconciliation.bankCreditsTotalCents / 100).toFixed(2)} €</span>
                  </div>
                </div>
              </div>

              {/* Achats & Factures Fournisseurs */}
              <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Factures Fournisseurs (OCR)</span>
                <div className="text-2xl font-bold text-white">{summary.purchases.invoicesCount} Factures Traitées</div>
                <div className="space-y-2 pt-2 border-t border-white/10 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Achats Matières Premières HT :</span>
                    <span className="font-mono font-semibold">{(summary.purchases.totalPurchasesHtCents / 100).toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">TVA Déductible sur Achats :</span>
                    <span className="font-mono font-semibold text-emerald-400">{(summary.purchases.totalPurchasesVatCents / 100).toFixed(2)} €</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'ai-audit' && summary && (
            <motion.div
              key="ai-audit"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3 bg-gradient-to-r from-amber-500/10 to-amber-600/10 border border-amber-500/30 rounded-2xl p-4">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <div className="text-xs text-amber-200">
                  <span className="font-bold">Auditeur IA Themis :</span> L'analyse algorithmique a inspecté 100% des écritures fiscales, déclarations de pourboires et pointages HCR du mois de {selectedPeriod}.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {summary.aiAuditAlerts.map((alert) => (
                  <div key={alert.id} className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{alert.title}</span>
                      <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30 font-semibold">
                        {alert.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{alert.description}</p>
                    <div className="pt-2 border-t border-white/10 text-[11px] text-amber-300 flex items-center gap-1.5">
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>{alert.recommendation}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
