import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  AccountingPortalHeader,
  MonthlyCloseHero,
  AccountingPortalTabs,
  SalesFiscalTab,
} from '@/modules/finance/comptabilite/components/accountant';

describe('V2-DETTE-04: Accounting Portal Decomposed Components', () => {
  it('renders AccountingPortalHeader with period selector and NF525 badge', () => {
    const onPeriodChange = vi.fn();
    render(
      <AccountingPortalHeader
        selectedPeriod="2026-08"
        onPeriodChange={onPeriodChange}
      />
    );

    expect(screen.getByText(/Portail Fiduciaire & Expert-Comptable/i)).toBeDefined();
    expect(screen.getByText(/NF525 Certifié/i)).toBeDefined();

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '2026-07' } });
    expect(onPeriodChange).toHaveBeenCalledWith('2026-07');
  });

  it('renders MonthlyCloseHero and triggers download pack and transmit callbacks', () => {
    const onDownloadPack = vi.fn();
    const onTransmit = vi.fn();

    render(
      <MonthlyCloseHero
        selectedPeriod="2026-08"
        isDownloading={false}
        isTransmitting={null}
        transmitSuccess={null}
        onDownloadPack={onDownloadPack}
        onTransmit={onTransmit}
      />
    );

    expect(screen.getByText(/Pack Comptable 2026-08/i)).toBeDefined();

    const downloadBtn = screen.getByText(/Télécharger Pack Mensuel/i);
    fireEvent.click(downloadBtn);
    expect(onDownloadPack).toHaveBeenCalled();

    const pennylaneBtn = screen.getByText(/Pennylane/i);
    fireEvent.click(pennylaneBtn);
    expect(onTransmit).toHaveBeenCalledWith('pennylane');
  });

  it('renders AccountingPortalTabs and handles tab changes', () => {
    const onTabChange = vi.fn();
    render(
      <AccountingPortalTabs
        activeTab="sales"
        onTabChange={onTabChange}
      />
    );

    const vatTab = screen.getByText(/Déclaration TVA/i);
    fireEvent.click(vatTab);
    expect(onTabChange).toHaveBeenCalledWith('vat');
  });

  it('renders SalesFiscalTab with correct revenue and NF525 stats', () => {
    const mockSummary = {
      period: '2026-08',
      generatedAt: '2026-08-18T10:00:00Z',
      totalRevenueHtCents: 1000000,
      totalRevenueTtcCents: 1100000,
      mealVouchersTotalCents: 150000,
      vatBreakdown: {
        vat55HtCents: 200000,
        vat55AmountCents: 11000,
        vat10HtCents: 600000,
        vat10AmountCents: 60000,
        vat20HtCents: 200000,
        vat20AmountCents: 40000,
      },
      payroll: {
        employeeCount: 8,
        totalHoursWorked: 1200,
        overtimeHours10: 10,
        overtimeHours20: 5,
        overtimeHours50: 0,
        staffMealsDeclaredCount: 160,
        declaredTipsTotalCents: 35000,
      },
      reconciliation: {
        tpeSettlementsTotalCents: 850000,
        cashDepositsTotalCents: 250000,
        bankCreditsTotalCents: 1100000,
        unreconciledDiscrepancyCents: 0,
      },
      purchases: {
        invoicesCount: 42,
        totalPurchasesHtCents: 350000,
        totalPurchasesVatCents: 35000,
      },
      nf525: {
        zReportCount: 31,
        masterHashSha256: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
      },
      aiAuditAlerts: [],
    };

    render(
      <SalesFiscalTab
        summary={mockSummary as any}
        selectedPeriod="2026-08"
        onDownloadPack={vi.fn()}
      />
    );

    expect(screen.getByText(/31 Tickets Z Scellés/i)).toBeDefined();
    expect(screen.getByText(/Chaîne cryptographique inaltérée/i)).toBeDefined();
  });
});
