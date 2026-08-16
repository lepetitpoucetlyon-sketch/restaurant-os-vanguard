'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  TrendingDown,
  ShoppingCart,
  AlertTriangle,
  FileText,
  Truck,
  CheckCircle2,
  Clock,
  Sparkles,
  Phone,
  Mail,
  MessageSquare,
  Scale,
  Award,
  ChevronRight,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/ui.foundations';

import { AutoProcurementWizard } from './AutoProcurementWizard';
import { toMicrounits } from '@/shared/schemas/primitives';
import type { StockItem } from '@/modules/logistics/domain/schemas/inventory';
import type { MercurialeItem } from '../mercuriales/MercurialeTypes';
import type { SupplierEntity } from '../core/domain/supplier.types';

type HubTab = 'directory' | 'mercuriales' | 'orders' | 'disputes' | 'rfa';

export function SupplierHubDashboard() {
  const [activeTab, setActiveTab] = useState<HubTab>('directory');
  const [searchFilter, setSearchFilter] = useState('');
  const [isAutoProcurementOpen, setIsAutoProcurementOpen] = useState(false);

  // Mock initial sovereign dataset for Auto-Procurement demonstration
  const sampleSuppliers: SupplierEntity[] = [
    {
      id: 'tg',
      tenantId: 'tenant_demo',
      name: 'Transgourmet Rhône-Alpes',
      category: 'dry_goods',
      preferredOrderChannel: 'WHATSAPP',
      contacts: [{ id: 'c1', name: 'Jérôme B.', role: 'commercial', phone: '+33612345678', email: 'jerome@transgourmet.fr', isPrimary: true }],
      francoCts: 25000,
      shippingCostCts: 3000,
      paymentTerms: '30_DAYS',
      paymentMethod: 'SEPA_DEBIT',
      deliverySchedule: { allowedDays: [2, 4, 5], cutOffTime: '22:00', cutOffDaysBefore: 1, deliveryWindow: '06:00-09:00' },
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'pomona',
      tenantId: 'tenant_demo',
      name: 'Pomona TerreAzur',
      category: 'produce',
      preferredOrderChannel: 'WHATSAPP',
      contacts: [{ id: 'c2', name: 'Céline V.', role: 'commercial', phone: '+33698765432', email: 'celine@pomona.fr', isPrimary: true }],
      francoCts: 18000,
      shippingCostCts: 2000,
      paymentTerms: '30_DAYS',
      paymentMethod: 'SEPA_DEBIT',
      deliverySchedule: { allowedDays: [1, 2, 3, 4, 5, 6], cutOffTime: '23:30', cutOffDaysBefore: 1, deliveryWindow: '05:00-08:00' },
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'fb',
      tenantId: 'tenant_demo',
      name: 'France Boissons',
      category: 'beverages',
      preferredOrderChannel: 'EMAIL_PDF',
      contacts: [{ id: 'c3', name: 'Alexandre M.', role: 'commercial', phone: '+33472001122', email: 'commandes@france-boissons.fr', isPrimary: true }],
      francoCts: 40000,
      shippingCostCts: 4500,
      paymentTerms: '45_DAYS',
      paymentMethod: 'SEPA_DEBIT',
      deliverySchedule: { allowedDays: [2, 5], cutOffTime: '17:00', cutOffDaysBefore: 2, deliveryWindow: '07:00-11:00' },
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
  ];

  const sampleStockItems: StockItem[] = [
    {
      id: 'item_entrecote',
      type: 'stockItem',
      name: 'Entrecôte Black Angus',
      quantityInStock: 2,
      threshold: 10,
      criticalThreshold: 4,
      unit: 'kg',
      priceInMicrounits: toMicrounits(22_000_000),
      supplierId: 'tg',
      schemaVersion: 2,
      updatedAt: Date.now(),
    },
    {
      id: 'item_avocat',
      type: 'stockItem',
      name: 'Avocat Hass Calibre 18',
      quantityInStock: 3,
      threshold: 8,
      criticalThreshold: 3,
      unit: 'crate',
      priceInMicrounits: toMicrounits(14_000_000),
      supplierId: 'pomona',
      schemaVersion: 2,
      updatedAt: Date.now(),
    },
    {
      id: 'item_fut_blonde',
      type: 'stockItem',
      name: 'Fût Bière Blonde Artisanale 30L',
      quantityInStock: 1,
      threshold: 4,
      criticalThreshold: 2,
      unit: 'unit',
      priceInMicrounits: toMicrounits(95_000_000),
      supplierId: 'fb',
      schemaVersion: 2,
      updatedAt: Date.now(),
    }
  ];

  const sampleMercuriales: MercurialeItem[] = [
    {
      id: 'merc_entrecote_tg',
      supplierId: 'tg',
      ingredientId: 'item_entrecote',
      supplierRefCode: 'TG-EA-01',
      name: 'Entrecôte Black Angus',
      packagingLabel: 'Carton 5kg (Sous-vide)',
      packagingQuantity: 5,
      packagingUnit: 'kg',
      conversionFactorToBaseUnit: 5,
      packagePriceHtCts: 11000,
      unitPriceHtCts: 2200,
      vatRatePct: 5.5,
      validFromUtc: Date.now(),
      isAvailable: true,
    },
    {
      id: 'merc_avocat_pomona',
      supplierId: 'pomona',
      ingredientId: 'item_avocat',
      supplierRefCode: 'POM-AV-18',
      name: 'Avocat Hass Calibre 18',
      packagingLabel: 'Colis 4kg (18 pièces)',
      packagingQuantity: 1,
      packagingUnit: 'unit',
      conversionFactorToBaseUnit: 1,
      packagePriceHtCts: 1400,
      unitPriceHtCts: 1400,
      vatRatePct: 5.5,
      validFromUtc: Date.now(),
      isAvailable: true,
    },
    {
      id: 'merc_fut_fb',
      supplierId: 'fb',
      ingredientId: 'item_fut_blonde',
      supplierRefCode: 'FB-BLONDE-30',
      name: 'Fût Bière Blonde Artisanale 30L',
      packagingLabel: 'Fût Inox 30L',
      packagingQuantity: 1,
      packagingUnit: 'unit',
      conversionFactorToBaseUnit: 1,
      packagePriceHtCts: 9500,
      unitPriceHtCts: 9500,
      vatRatePct: 20.0,
      validFromUtc: Date.now(),
      isAvailable: true,
    },
    {
      id: 'merc_huile_tg',
      supplierId: 'tg',
      ingredientId: 'item_huile',
      supplierRefCode: 'TG-OIL-10',
      name: 'Bidon Huile de Tournesol 10L',
      packagingLabel: 'Bidon 10L',
      packagingQuantity: 1,
      packagingUnit: 'l',
      conversionFactorToBaseUnit: 10,
      packagePriceHtCts: 2450,
      unitPriceHtCts: 245,
      vatRatePct: 5.5,
      validFromUtc: Date.now(),
      isAvailable: true,
    }
  ];

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 text-slate-100 p-6 overflow-y-auto space-y-6">
      {/* Auto Procurement Wizard Modal */}
      <AutoProcurementWizard
        isOpen={isAutoProcurementOpen}
        onClose={() => setIsAutoProcurementOpen(false)}
        tenantId="tenant_demo"
        stockItems={sampleStockItems}
        mercurialeItems={sampleMercuriales}
        suppliers={sampleSuppliers}
        currentUserId="emp_chef_demo"
        businessName="Le Petit Poucet Lyon"
      />

      {/* Header Hub */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-lg shadow-amber-500/5">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                FOURNISSEURS 360°
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold uppercase tracking-wider">
                  SRM SOUVERAIN
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Mercuriales, Commandes Multi-Canaux, Réceptions & Litiges Avoirs, Contrats RFA & Brasseurs
              </p>
            </div>
          </div>
        </div>

        {/* Action Button & Global KPI quick badges */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsAutoProcurementOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center gap-2 transition active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            IA Auto-Réassort
          </button>

          <div className="px-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
            <Truck className="w-4 h-4 text-blue-400" />
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Livraisons J-0</div>
              <div className="text-sm font-black text-white">3 Attendues</div>
            </div>
          </div>
          <div className="px-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Litiges / Avoirs</div>
              <div className="text-sm font-black text-amber-400">2 En cours (318,50 €)</div>
            </div>
          </div>
          <div className="px-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
            <Award className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">RFA Acquises 2026</div>
              <div className="text-sm font-black text-emerald-400">1 560,00 €</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800/60 pb-1 overflow-x-auto no-scrollbar">
        {[
          { id: 'directory', label: 'Annuaire SRM & Contacts', icon: Building2 },
          { id: 'mercuriales', label: 'Mercuriales & Comparateur', icon: Scale },
          { id: 'orders', label: 'Commandes Multi-Canaux', icon: ShoppingCart },
          { id: 'disputes', label: 'Réceptions & Litiges Avoirs', icon: AlertTriangle },
          { id: 'rfa', label: 'RFA & Contrats Brasseurs', icon: Award },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as HubTab)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200',
                isActive
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-lg shadow-amber-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-[500px]">
        {activeTab === 'directory' && <DirectoryTab searchFilter={searchFilter} setSearchFilter={setSearchFilter} />}
        {activeTab === 'mercuriales' && <MercurialeTab />}
        {activeTab === 'orders' && <OrdersTab />}
        {activeTab === 'disputes' && <DisputesTab />}
        {activeTab === 'rfa' && <RfaTab />}
      </div>
    </div>
  );
}

// ─── Sub-Tabs Implementation ────────────────────────────────────────────────

function DirectoryTab({
  searchFilter,
  setSearchFilter,
}: {
  searchFilter: string;
  setSearchFilter: (v: string) => void;
}) {
  const suppliers = [
    {
      id: 'tg',
      name: 'Transgourmet Rhône-Alpes',
      category: 'Épicerie, Frais & Surgelé',
      franco: '250,00 €',
      cutOff: '22h00 (J-1)',
      deliveryDays: 'Mar, Jeu, Ven',
      primaryContact: 'Jérôme B. (+33 6 12 34 56 78)',
      payment: 'LCR 30j Fin de Mois',
      iban: 'FR76 3000 2005 ... 99',
      channel: 'WHATSAPP',
    },
    {
      id: 'pomona',
      name: 'Pomona TerreAzur',
      category: 'Fruits, Légumes & Marée Fraîche',
      franco: '180,00 €',
      cutOff: '23h30 (J-1)',
      deliveryDays: 'Lun, Mar, Mer, Jeu, Ven, Sam',
      primaryContact: 'Céline V. (+33 6 98 76 54 32)',
      payment: 'Prélèvement SEPA 30j',
      iban: 'FR76 1005 8890 ... 12',
      channel: 'WHATSAPP',
    },
    {
      id: 'fb',
      name: 'France Boissons',
      category: 'Bières fûts, Vins & Spiritueux',
      franco: '400,00 €',
      cutOff: '17h00 (J-2)',
      deliveryDays: 'Mardi, Vendredi',
      primaryContact: 'Alexandre M. (+33 4 72 00 11 22)',
      payment: 'LCR 45j',
      iban: 'FR76 1027 8001 ... 44',
      channel: 'EMAIL_PDF',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filtrer fournisseurs..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
          />
        </div>
        <button className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs tracking-wider uppercase hover:bg-amber-400 transition-colors flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          Nouveau Fournisseur
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {suppliers.map((s) => (
          <div
            key={s.id}
            className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-white text-base">{s.name}</h3>
                  <p className="text-[11px] text-slate-400">{s.category}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-amber-500/20">
                  {s.channel}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-xs text-slate-300">
                <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
                  <span className="text-slate-400">Franco de port :</span>
                  <span className="font-bold text-white">{s.franco}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
                  <span className="text-slate-400">Cut-off commande :</span>
                  <span className="font-bold text-amber-400">{s.cutOff}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
                  <span className="text-slate-400">Jours de passage :</span>
                  <span className="font-semibold text-slate-200">{s.deliveryDays}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
                  <span className="text-slate-400">Règlement :</span>
                  <span className="text-slate-200">{s.payment}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>{s.primaryContact}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MercurialeTab() {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <div className="text-xs font-bold text-amber-300">
              OPTIMISEUR DE MERCURIALES EN TEMPS RÉEL
            </div>
            <div className="text-[11px] text-slate-300">
              Détection automatique des écarts de prix par kg/L et calcul de l'impact food cost.
            </div>
          </div>
        </div>
        <button className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs uppercase">
          Importer Mercuriale (Excel / OCR)
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="p-3.5">Ingrédient</th>
              <th className="p-3.5">Meilleure Offre</th>
              <th className="p-3.5">Prix Unitaire</th>
              <th className="p-3.5">Conditionnement</th>
              <th className="p-3.5">Fournisseurs Comparés</th>
              <th className="p-3.5 text-right">Écart Prix Max</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            <tr>
              <td className="p-3.5 font-bold text-white">Beurre Doux 82% MG</td>
              <td className="p-3.5 text-emerald-400 font-bold">Transgourmet</td>
              <td className="p-3.5 font-mono font-bold text-white">8,80 € / kg</td>
              <td className="p-3.5 text-slate-400">Carton 10x1kg (88,00 €)</td>
              <td className="p-3.5 text-slate-400">Metro (9,20 €), Pomona (9,50 €)</td>
              <td className="p-3.5 text-right text-emerald-400 font-bold">+7,95%</td>
            </tr>
            <tr>
              <td className="p-3.5 font-bold text-white">Crème Fleurette 35%</td>
              <td className="p-3.5 text-emerald-400 font-bold">Metro Cash & Carry</td>
              <td className="p-3.5 font-mono font-bold text-white">3,75 € / L</td>
              <td className="p-3.5 text-slate-400">Pack 6x1L (22,50 €)</td>
              <td className="p-3.5 text-slate-400">Transgourmet (3,95 €)</td>
              <td className="p-3.5 text-right text-emerald-400 font-bold">+5,33%</td>
            </tr>
            <tr>
              <td className="p-3.5 font-bold text-white">Pavé de Saumon Frais</td>
              <td className="p-3.5 text-emerald-400 font-bold">Pomona TerreAzur</td>
              <td className="p-3.5 font-mono font-bold text-white">21,00 € / kg</td>
              <td className="p-3.5 text-slate-400">Colis 5kg (105,00 €)</td>
              <td className="p-3.5 text-slate-400">Transgourmet (23,00 €)</td>
              <td className="p-3.5 text-right text-emerald-400 font-bold">+9,52%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrdersTab() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Panier Optimisé Multi-Fournisseurs */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-amber-400" />
              Panier IA Recommandé (Franco Atteint)
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              0 € FRAIS DE PORT
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
              <div className="flex items-center justify-between font-bold text-white">
                <span>Transgourmet (Livraison Mardi)</span>
                <span className="text-emerald-400">266,00 € HT (Franco: 250 €)</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                2x Carton Beurre (176 €), 2x Colis Crème (90 €)
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
              <div className="flex items-center justify-between font-bold text-white">
                <span>Pomona TerreAzur (Livraison Mardi)</span>
                <span className="text-emerald-400">210,00 € HT (Franco: 180 €)</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                2x Colis Saumon Frais (210 €)
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <div className="text-xs">
              <span className="text-slate-400">Total Commandes : </span>
              <span className="font-bold text-white">476,00 € HT</span>
            </div>
            <button className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs uppercase flex items-center gap-2 hover:bg-emerald-400 transition-colors">
              <MessageSquare className="w-4 h-4" />
              Envoyer par WhatsApp
            </button>
          </div>
        </div>

        {/* Historique des Commandes */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            Dernières Commandes Émises
          </h3>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
              <div>
                <div className="font-bold text-white">BC-202608-0088 — Transgourmet</div>
                <div className="text-[11px] text-slate-400">Livr. prévue 18/08 • WhatsApp</div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                CONFIRMÉE
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
              <div>
                <div className="font-bold text-white">BC-202608-0087 — France Boissons</div>
                <div className="text-[11px] text-slate-400">Livr. prévue 19/08 • Email PDF</div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                LIVRAISON EN COURS
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DisputesTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Litiges Réception & Demandes d'Avoirs
        </h3>
        <button className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs uppercase">
          Déclarer une non-conformité BL
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400">LIT-202608-0015 — Transgourmet</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              AVOIR EN ATTENTE
            </span>
          </div>
          <div className="text-xs text-slate-300 space-y-1">
            <div>BL Fournisseur : <strong className="text-white">BL-98765</strong></div>
            <div>Motif : <span className="text-red-400 font-semibold">1x Colis Beurre manquant (-88,00 € HT)</span></div>
            <div>Avoir réclamé : <strong className="text-white">92,84 € TTC</strong></div>
          </div>
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Déclaré le 15/08 par Chef</span>
            <button className="text-amber-400 hover:underline font-bold">Rapprocher l'avoir</button>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400">LIT-202608-0012 — Pomona</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              AVOIR REÇU & DÉDUIT
            </span>
          </div>
          <div className="text-xs text-slate-300 space-y-1">
            <div>BL Fournisseur : <strong className="text-white">BL-44102</strong></div>
            <div>N° Avoir Fournisseur : <strong className="text-emerald-400">AV-POM-8821 (110,77 € TTC)</strong></div>
            <div>Déduit sur le virement du 31/08</div>
          </div>
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Clôturé le 12/08</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
        </div>
      </div>
    </div>
  );
}

function RfaTab() {
  return (
    <div className="space-y-4">
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              Contrat Annuel RFA — France Boissons (2026)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Réf : RFA-HEINEKEN-2026 • Période : 01/01/2026 au 31/12/2026
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400">Total RFA Estimée</div>
            <div className="text-lg font-black text-emerald-400">1 560,00 €</div>
          </div>
        </div>

        {/* Jauge de progression Volume CA */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300">Volume Achats Cumulé : <strong className="text-white">18 000,00 € HT</strong></span>
            <span className="text-amber-400 font-bold">Palier 1 Atteint (2.0%)</span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-950 border border-slate-800 overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full"
              style={{ width: '36%' }} // 18k / 50k
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Palier 1 : 10k€ (2%)</span>
            <span>Palier 2 : 25k€ (4%) — <em>Manque 7 000 € (+680 € gain)</em></span>
            <span>Palier 3 : 50k€ (6%)</span>
          </div>
        </div>

        {/* Engagement Brasseur Fûts */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <div>
              <span className="font-bold text-white">Engagement Fûts Heineken 30L : </span>
              <span className="text-slate-300">80 / 200 fûts réalisés (15,00 € / fût = 1 200,00 € acquis)</span>
            </div>
          </div>
          <button className="text-xs text-amber-400 hover:underline font-bold">
            Voir barème détaillé
          </button>
        </div>
      </div>
    </div>
  );
}
