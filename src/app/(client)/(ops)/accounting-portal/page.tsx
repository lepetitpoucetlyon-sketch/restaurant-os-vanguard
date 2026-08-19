"use client";

import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { AccountingMonthlySummary } from '@/modules/finance';
import {
  AccountingPortalHeader,
  MonthlyCloseHero,
  AccountingPortalTabs,
  type AccountingTabKey,
  SalesFiscalTab,
  VatDeclarationTab,
  PayrollSocialTab,
  ReconciliationPurchasesTab,
  AiAuditThemisTab,
} from '@/modules/finance/comptabilite/components/accountant';

export default function AccountingPortalPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2026-08');
  const [activeTab, setActiveTab] = useState<AccountingTabKey>('sales');
  const [summary, setSummary] = useState<AccountingMonthlySummary | null>(null);
  const [, setIsLoading] = useState<boolean>(true);
  const [isTransmitting, setIsTransmitting] = useState<string | null>(null);
  const [transmitSuccess, setTransmitSuccess] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

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

  const handleDownloadPack = async () => {
    setIsDownloading(true);
    try {
      const res = await fetch(`/api/finance/accounting-portal/pack?period=${selectedPeriod}`);
      const data = await res.json();
      if (data.ok && data.pack?.files) {
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
      <AccountingPortalHeader
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
      />

      <div className="max-w-7xl mx-auto mt-8 space-y-8">
        <MonthlyCloseHero
          selectedPeriod={selectedPeriod}
          isDownloading={isDownloading}
          isTransmitting={isTransmitting}
          transmitSuccess={transmitSuccess}
          onDownloadPack={handleDownloadPack}
          onTransmit={handleTransmit}
        />

        <AccountingPortalTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <AnimatePresence mode="wait">
          {activeTab === 'sales' && summary && (
            <SalesFiscalTab
              summary={summary}
              selectedPeriod={selectedPeriod}
              onDownloadPack={handleDownloadPack}
            />
          )}

          {activeTab === 'vat' && summary && (
            <VatDeclarationTab summary={summary} />
          )}

          {activeTab === 'payroll' && summary && (
            <PayrollSocialTab
              summary={summary}
              isTransmitting={isTransmitting}
              onTransmit={handleTransmit}
            />
          )}

          {activeTab === 'reconciliation' && summary && (
            <ReconciliationPurchasesTab summary={summary} />
          )}

          {activeTab === 'ai-audit' && summary && (
            <AiAuditThemisTab
              summary={summary}
              selectedPeriod={selectedPeriod}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
