'use client';

import React, { useState } from 'react';
import {
  Building2,
  ShoppingCart,
  AlertTriangle,
  Truck,
  Sparkles,
  Scale,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/ui.foundations';

import { AutoProcurementWizard } from './AutoProcurementWizard';
import { sampleSuppliers, sampleStockItems, sampleMercuriales } from './supplier-hub/sampleData';
import { DirectoryTab } from './supplier-hub/DirectoryTab';
import { MercurialeTab } from './supplier-hub/MercurialeTab';
import { OrdersTab } from './supplier-hub/OrdersTab';
import { DisputesTab } from './supplier-hub/DisputesTab';
import { RfaTab } from './supplier-hub/RfaTab';

type HubTab = 'directory' | 'mercuriales' | 'orders' | 'disputes' | 'rfa';

export function SupplierHubDashboard() {
  const [activeTab, setActiveTab] = useState<HubTab>('directory');
  const [searchFilter, setSearchFilter] = useState('');
  const [isAutoProcurementOpen, setIsAutoProcurementOpen] = useState(false);

  return (
    <div className="space-y-6">
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

      {/* KPI badges + CTA — le titre est porté par le PageShell parent (suppliers/page.tsx) */}
      <div className="flex flex-wrap items-center gap-3 justify-end">
        <button
          onClick={() => setIsAutoProcurementOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-text-primary font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center gap-2 transition active:scale-95"
        >
          <Sparkles className="w-4 h-4" />
          IA Auto-Réassort
        </button>

        <div className="px-4 py-2 rounded-xl bg-surface-card border border-border flex items-center gap-3">
          <Truck className="w-4 h-4 text-blue-500" />
          <div>
            <div className="text-[10px] font-bold text-text-muted uppercase">Livraisons J-0</div>
            <div className="text-sm font-black text-text-primary">3 Attendues</div>
          </div>
        </div>
        <div className="px-4 py-2 rounded-xl bg-surface-card border border-border flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <div>
            <div className="text-[10px] font-bold text-text-muted uppercase">Litiges / Avoirs</div>
            <div className="text-sm font-black text-amber-500">2 En cours (318,50 €)</div>
          </div>
        </div>
        <div className="px-4 py-2 rounded-xl bg-surface-card border border-border flex items-center gap-3">
          <Award className="w-4 h-4 text-emerald-500" />
          <div>
            <div className="text-[10px] font-bold text-text-muted uppercase">RFA Acquises 2026</div>
            <div className="text-sm font-black text-emerald-500">1 560,00 €</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-border pb-1 overflow-x-auto no-scrollbar">
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
                  ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30 shadow-lg shadow-amber-500/10'
                  : 'text-text-muted hover:text-text-primary hover:bg-surface-hover'
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
