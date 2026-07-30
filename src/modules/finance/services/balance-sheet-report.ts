import type { JournalEntry } from '@nexus/contracts/finance.types';
import type { PnLLine, BalanceSheetResult } from './accounting-types';
import { microToEur, formatEur } from './accounting-types';

function isActif(code: string): boolean {
    const first = code.charAt(0);
    return first === '2' || first === '3' || first === '4' || first === '5';
}

export async function buildBalanceSheet(asOfDate: number, tenantId?: string): Promise<BalanceSheetResult> {
    const { Nexus } = await import('@/lib/nexus/NexusAdapter');
    const path = tenantId ? `tenants/${tenantId}/journalEntries` : Nexus.getTenantPath('journalEntries');

    const entries = await Nexus.adapter.query<JournalEntry>(path, {
        where: [{ field: 'date', operator: '<=', value: asOfDate }],
        orderBy: { field: 'date', direction: 'asc' },
    });

    const actifMap  = new Map<string, PnLLine>();
    const passifMap = new Map<string, PnLLine>();

    for (const entry of entries) {
        for (const line of (entry.lines ?? [])) {
            const code = line.accountCode ?? '';
            const first = code.charAt(0);
            if (!['1', '2', '3', '4', '5'].includes(first)) continue;

            const debit  = (line.debitInCents  ?? 0) * 10_000;
            const credit = (line.creditInCents ?? 0) * 10_000;
            const map = isActif(code) ? actifMap : passifMap;

            const existing = map.get(code) ?? {
                accountCode: code, accountName: line.accountName ?? code,
                debitInMicrounits: 0, creditInMicrounits: 0, balanceInMicrounits: 0,
            };
            existing.debitInMicrounits  += debit;
            existing.creditInMicrounits += credit;
            existing.balanceInMicrounits = isActif(code)
                ? existing.debitInMicrounits - existing.creditInMicrounits
                : existing.creditInMicrounits - existing.debitInMicrounits;
            map.set(code, existing);
        }
    }

    const actifLines  = Array.from(actifMap.values()).sort((a, b) => a.accountCode.localeCompare(b.accountCode));
    const passifLines = Array.from(passifMap.values()).sort((a, b) => a.accountCode.localeCompare(b.accountCode));

    return {
        actifLines, passifLines,
        totalActif:  actifLines.reduce((s, l) => s + l.balanceInMicrounits, 0),
        totalPassif: passifLines.reduce((s, l) => s + l.balanceInMicrounits, 0),
        asOfDate,
    };
}

export async function exportBalanceSheetPDF(data: BalanceSheetResult): Promise<void> {
    const jsPDF     = (await import('jspdf')).default;
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF({ orientation: 'landscape' });
    const W = doc.internal.pageSize.width;

    doc.setFillColor(26, 26, 26);
    doc.rect(0, 0, W, 32, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16); doc.setFont('helvetica', 'bold');
    doc.text('BILAN SIMPLIFIÉ', 14, 14);
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text(`Au ${new Date(data.asOfDate).toLocaleDateString('fr-FR')}`, 14, 24);

    const midX = W / 2;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text('ACTIF', 14, 44);

    autoTable(doc, {
        startY: 48, tableWidth: midX - 20,
        head: [['Compte', 'Libellé', 'Montant']],
        body: data.actifLines.map(l => [l.accountCode, l.accountName, formatEur(microToEur(l.balanceInMicrounits))]),
        foot: [['', 'TOTAL ACTIF', formatEur(microToEur(data.totalActif))]],
        theme: 'grid',
        headStyles: { fillColor: [30, 80, 160], textColor: 255, fontStyle: 'bold' },
        footStyles: { fillColor: [210, 225, 255], fontStyle: 'bold' },
        styles: { fontSize: 9 },
    });

    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text('PASSIF & CAPITAUX PROPRES', midX + 6, 44);

    autoTable(doc, {
        startY: 48, startX: midX + 6, tableWidth: midX - 20,
        head: [['Compte', 'Libellé', 'Montant']],
        body: data.passifLines.map(l => [l.accountCode, l.accountName, formatEur(microToEur(l.balanceInMicrounits))]),
        foot: [['', 'TOTAL PASSIF', formatEur(microToEur(data.totalPassif))]],
        theme: 'grid',
        headStyles: { fillColor: [120, 40, 140], textColor: 255, fontStyle: 'bold' },
        footStyles: { fillColor: [240, 210, 255], fontStyle: 'bold' },
        styles: { fontSize: 9 },
    } as Parameters<typeof autoTable>[1] & { startX?: number });

    const H = doc.internal.pageSize.height;
    doc.setFontSize(7); doc.setTextColor(160, 160, 160);
    doc.text(`Généré le ${new Date().toLocaleString('fr-FR')} — Restaurant OS`, 14, H - 10);

    doc.save(`Bilan_${new Date(data.asOfDate).toISOString().slice(0, 10)}.pdf`);
}
