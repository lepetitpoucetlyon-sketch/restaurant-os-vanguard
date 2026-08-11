import type { JournalEntry } from '@nexus/contracts/finance.types';
import type { PnLLine, PnLResult } from './accounting-types';
import { microToEur, formatEur } from './accounting-types';

export async function buildPnL(startDate: number, endDate: number, tenantId?: string): Promise<PnLResult> {
    const { Nexus } = await import('@/lib/nexus/NexusAdapter');
    const path = tenantId ? `tenants/${tenantId}/journalEntries` : Nexus.getTenantPath('journalEntries');

    const entries = await Nexus.adapter.query<JournalEntry>(path, {
        where: [
            { field: 'date', operator: '>=', value: startDate },
            { field: 'date', operator: '<=', value: endDate },
        ],
        orderBy: { field: 'date', direction: 'asc' },
    });

    const revenueMap = new Map<string, PnLLine>();
    const costMap = new Map<string, PnLLine>();

    for (const entry of entries) {
        for (const line of (entry.lines ?? [])) {
            const code = line.accountCode ?? '';
            const prefix = code.charAt(0);
            const debit = line.debitInMicrounits ?? ((line.debitInCents ?? 0) * 10_000);
            const credit = line.creditInMicrounits ?? ((line.creditInCents ?? 0) * 10_000);

            if (prefix === '7') {
                const existing = revenueMap.get(code) ?? {
                    accountCode: code, accountName: line.accountName ?? code,
                    debitInMicrounits: 0, creditInMicrounits: 0, balanceInMicrounits: 0,
                };
                existing.debitInMicrounits += debit;
                existing.creditInMicrounits += credit;
                existing.balanceInMicrounits = existing.creditInMicrounits - existing.debitInMicrounits;
                revenueMap.set(code, existing);
            } else if (prefix === '6') {
                const existing = costMap.get(code) ?? {
                    accountCode: code, accountName: line.accountName ?? code,
                    debitInMicrounits: 0, creditInMicrounits: 0, balanceInMicrounits: 0,
                };
                existing.debitInMicrounits += debit;
                existing.creditInMicrounits += credit;
                existing.balanceInMicrounits = existing.debitInMicrounits - existing.creditInMicrounits;
                costMap.set(code, existing);
            }
        }
    }

    const revenueLines = Array.from(revenueMap.values()).sort((a, b) => a.accountCode.localeCompare(b.accountCode));
    const costLines    = Array.from(costMap.values()).sort((a, b) => a.accountCode.localeCompare(b.accountCode));

    const revenue = revenueLines.reduce((s, l) => s + l.balanceInMicrounits, 0);
    const costs   = costLines.reduce((s, l) => s + l.balanceInMicrounits, 0);
    const grossMargin = revenue - costs;

    return { revenue, costs, grossMargin, operatingResult: grossMargin, revenueLines, costLines, periodStart: startDate, periodEnd: endDate };
}

export async function exportPnLPDF(data: PnLResult): Promise<void> {
    const jsPDF    = (await import('jspdf')).default;
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF();
    const W = doc.internal.pageSize.width;

    doc.setFillColor(26, 26, 26);
    doc.rect(0, 0, W, 32, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16); doc.setFont('helvetica', 'bold');
    doc.text('COMPTE DE RÉSULTAT', 14, 14);
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    const period = `Du ${new Date(data.periodStart).toLocaleDateString('fr-FR')} au ${new Date(data.periodEnd).toLocaleDateString('fr-FR')}`;
    doc.text(period, 14, 24);
    doc.text('Restaurant OS Core', W - 14, 24, { align: 'right' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text('PRODUITS (comptes 7xx)', 14, 44);

    autoTable(doc, {
        startY: 48,
        head: [['Compte', 'Libellé', 'Débit', 'Crédit', 'Solde']],
        body: data.revenueLines.map(l => [l.accountCode, l.accountName, formatEur(microToEur(l.debitInMicrounits)), formatEur(microToEur(l.creditInMicrounits)), formatEur(microToEur(l.balanceInMicrounits))]),
        foot: [['', 'TOTAL PRODUITS', '', '', formatEur(microToEur(data.revenue))]],
        theme: 'grid',
        headStyles: { fillColor: [40, 120, 80], textColor: 255, fontStyle: 'bold' },
        footStyles: { fillColor: [220, 240, 220], fontStyle: 'bold' },
        styles: { fontSize: 9 },
    });

    const afterRevenue = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text('CHARGES (comptes 6xx)', 14, afterRevenue);

    autoTable(doc, {
        startY: afterRevenue + 4,
        head: [['Compte', 'Libellé', 'Débit', 'Crédit', 'Solde']],
        body: data.costLines.map(l => [l.accountCode, l.accountName, formatEur(microToEur(l.debitInMicrounits)), formatEur(microToEur(l.creditInMicrounits)), formatEur(microToEur(l.balanceInMicrounits))]),
        foot: [['', 'TOTAL CHARGES', '', '', formatEur(microToEur(data.costs))]],
        theme: 'grid',
        headStyles: { fillColor: [160, 50, 50], textColor: 255, fontStyle: 'bold' },
        footStyles: { fillColor: [240, 220, 220], fontStyle: 'bold' },
        styles: { fontSize: 9 },
    });

    const afterCosts = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 14;

    doc.setFillColor(240, 245, 255);
    doc.roundedRect(14, afterCosts, W - 28, 28, 2, 2, 'FD');
    doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80);
    doc.text('Marge brute :', 20, afterCosts + 9);
    doc.text(formatEur(microToEur(data.grossMargin)), W - 20, afterCosts + 9, { align: 'right' });
    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0);
    doc.text('RÉSULTAT D\'EXPLOITATION :', 20, afterCosts + 22);
    const resultColor = data.operatingResult >= 0 ? [30, 130, 60] : [180, 40, 40];
    doc.setTextColor(resultColor[0], resultColor[1], resultColor[2]);
    doc.text(formatEur(microToEur(data.operatingResult)), W - 20, afterCosts + 22, { align: 'right' });

    const H = doc.internal.pageSize.height;
    doc.setFontSize(7); doc.setTextColor(160, 160, 160);
    doc.text(`Généré le ${new Date().toLocaleString('fr-FR')} — Restaurant OS`, 14, H - 10);

    doc.save(`PnL_${new Date(data.periodStart).toISOString().slice(0, 7)}.pdf`);
}
