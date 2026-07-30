import type {
    LegacyImportConfig,
    RawLegacyDocument,
    DuplicateCandidate,
    FiscalValidationResult,
    MigrationReport,
    OpeningBalance,
    OpeningEntry,
    LegacyArchiveEntry,
} from './types';

export interface AirlockState {
    documents: RawLegacyDocument[];
    duplicates: DuplicateCandidate[];
    fiscalResults: FiscalValidationResult[];
    archiveEntries: LegacyArchiveEntry[];
    config: LegacyImportConfig;
}

const CATEGORY_TO_ACCOUNT: Record<string, { code: string; name: string; side: 'debit' | 'credit' }> = {
    sales:     { code: '701', name: 'Ventes de marchandises',     side: 'credit' },
    revenue:   { code: '706', name: 'Prestations de services',    side: 'credit' },
    purchases: { code: '607', name: 'Achats de marchandises',     side: 'debit' },
    payroll:   { code: '641', name: 'Rémunérations du personnel', side: 'debit' },
    fixed:     { code: '614', name: 'Charges locatives',          side: 'debit' },
    bank:      { code: '512', name: 'Banques',                    side: 'debit' },
    other:     { code: '471', name: "Comptes d'attente",          side: 'debit' },
};

export function extractOpeningBalances(archiveEntries: LegacyArchiveEntry[]): OpeningBalance[] {
    const categoryMap = new Map<string, number>();

    for (const entry of archiveEntries) {
        if (entry.entityType === 'transaction') {
            const category = (entry.data.category as string) ?? 'other';
            const amount   = (entry.data.amountInCents as number) ?? 0;
            categoryMap.set(category, (categoryMap.get(category) ?? 0) + amount);
        }
    }

    const balances: OpeningBalance[] = [];
    for (const [category, totalCents] of categoryMap.entries()) {
        const mapping = CATEGORY_TO_ACCOUNT[category] ?? CATEGORY_TO_ACCOUNT['other'];
        balances.push({
            accountCode:    mapping.code,
            accountName:    mapping.name,
            balanceInCents: Math.abs(totalCents),
            side: totalCents >= 0 ? mapping.side : (mapping.side === 'debit' ? 'credit' : 'debit'),
            source: 'legacy_import',
        });
    }
    return balances;
}

export function generateOpeningEntry(archiveEntries: LegacyArchiveEntry[], config: LegacyImportConfig): OpeningEntry {
    const balances    = extractOpeningBalances(archiveEntries);
    const totalDebit  = balances.filter(b => b.side === 'debit').reduce((s, b) => s + b.balanceInCents, 0);
    const totalCredit = balances.filter(b => b.side === 'credit').reduce((s, b) => s + b.balanceInCents, 0);

    return {
        id:                 `opening_${config.sessionId}`,
        asOfDate:           config.genesisDate,
        lines:              balances,
        totalDebitInCents:  totalDebit,
        totalCreditInCents: totalCredit,
        isBalanced:         totalDebit === totalCredit,
        fiscalSealHash:     `seal_${Date.now().toString(16)}`,
        migrationSessionId: config.sessionId,
        sealedAt:           new Date().toISOString(),
        sealedBy:           config.initiatedBy,
    };
}

export function generateReport(state: AirlockState, startTime: number): MigrationReport {
    const { documents, duplicates, fiscalResults, archiveEntries, config } = state;

    const ready        = documents.filter(d => d.status === 'READY').length;
    const rejected     = documents.filter(d => d.status === 'REJECTED').length;
    const needsReview  = documents.filter(d => d.status === 'NEEDS_REVIEW').length;
    const fiscalIssues = fiscalResults.reduce((s, r) => s + r.issues.length, 0);
    const autoFixed    = fiscalResults.reduce((s, r) => s + r.issues.filter(i => i.autoFixable).length, 0);

    const entityBreakdown: Record<string, number> = {};
    for (const entry of archiveEntries) {
        entityBreakdown[entry.entityType] = (entityBreakdown[entry.entityType] ?? 0) + 1;
    }

    const topIssues = documents.flatMap(d => d.issues)
        .filter(i => i.severity === 'ERROR' || i.severity === 'WARNING')
        .slice(0, 10);

    const successRate = documents.length > 0
        ? Math.round((ready / documents.length) * 100) : 0;

    return {
        sessionId:       config.sessionId,
        tenantId:        config.tenantId,
        sourceSystem:    config.sourceSystem,
        integrationMode: config.integrationMode,
        genesisDate:     config.genesisDate,
        startedAt:       config.startedAt,
        completedAt:     new Date().toISOString(),
        durationMs:      Date.now() - startTime,
        stats: {
            totalDocumentsIngested: documents.length,
            successfullyNormalized: ready,
            duplicatesFound:        duplicates.length,
            duplicatesMerged:       duplicates.filter(d => d.resolution === 'MERGED').length,
            fiscalIssuesFound:      fiscalIssues,
            fiscalIssuesAutoFixed:  autoFixed,
            rejectedDocuments:      rejected,
            needsReviewDocuments:   needsReview,
        },
        openingBalances: extractOpeningBalances(archiveEntries),
        entityBreakdown,
        topIssues,
        summary:
            `Migration ${config.sourceSystem} → Restaurant OS: ` +
            `${ready}/${documents.length} documents prêts (${successRate}%). ` +
            `${duplicates.length} doublons détectés, ${fiscalIssues} problèmes fiscaux ` +
            `(${autoFixed} auto-corrigés). ${needsReview} documents en attente de révision.`,
    };
}
