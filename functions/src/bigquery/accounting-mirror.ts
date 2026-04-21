import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { BigQuery } from '@google-cloud/bigquery';
import * as path from 'path';

/**
 * 📊 BigQuery Mirroring Service - Restaurant OS
 * Propulse les écritures comptables (Ledger) vers BigQuery pour l'analytique lourd.
 */

// Configuration BigQuery
const DATASET_ID = 'restaurant_os_analytics';
const TABLE_ID = 'accounting_ledger';

// Initialisation du client (Utilise le fichier secret si présent)
const bigquery = new BigQuery({
    keyFilename: path.join(__dirname, '../../service-account.json')
});

interface JournalLine {
    accountId: string;
    accountCode: string;
    accountName: string;
    side: 'credit' | 'debit';
    amount: string | number;
}

export const onJournalEntryCreated = onDocumentCreated('journalEntries/{entryId}', async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const entry = snapshot.data();
    const entryId = event.params.entryId;

    console.log(`📊 AccountingMirror: Processing entry ${entryId}...`);

    try {
        // Préparation des lignes pour BigQuery (Aplatissement)
        const rows = (entry.lines || []).map((line: JournalLine) => ({
            entry_id: entryId,
            date: entry.date,
            piece_number: entry.pieceNumber,
            description: entry.description,
            reference_id: entry.referenceId || null,
            reference_type: entry.referenceType || 'manual',
            account_id: line.accountId,
            account_code: line.accountCode,
            account_name: line.accountName,
            side: line.side,
            amount: typeof line.amount === 'string' ? parseFloat(line.amount) : line.amount,
            is_system_generated: !!entry.isSystemGenerated,
            is_validated: !!entry.isValidated,
            fiscal_seal_hash: entry.fiscalSealHash || null,
            sealed_at: entry.sealedAt || null,
            ingested_at: new Date().toISOString()
        }));

        if (rows.length === 0) return;

        // Streaming vers BigQuery
        await bigquery.dataset(DATASET_ID).table(TABLE_ID).insert(rows);
        
        console.log(`✅ AccountingMirror: Successfully streamed ${rows.length} lines to BQ for entry ${entryId}`);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erreur inconnue";
        console.error(`❌ AccountingMirror Error:`, message);
        
        // Tentative de diagnostic (Table manquante ?)
        if (error && typeof error === 'object' && 'name' in error && error.name === 'PartialFailureError') {
            console.error('BQ Partial Failure Details:', JSON.stringify((error as any).errors, null, 2));
        }
    }
});
