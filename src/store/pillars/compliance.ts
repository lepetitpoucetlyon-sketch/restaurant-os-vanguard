/* eslint-disable no-restricted-imports */
// 🛡️ COMPLIANCE PILLAR — HACCP, Hygiene & Fiscal Ledger
// ⚠️ Ré-exports depuis le fichier SOURCE des atomes, jamais depuis le barrel (anti-cycle SSR).

export {
    fiscalLedgerNodeAtom,     // COMPLIANCE
    fiscalLedgerAtom,         // COMPLIANCE
    fiscalLoadingAtom,        // COMPLIANCE
    fiscalSealsNodeAtom,      // COMPLIANCE — L7 Pattern E: FiscalSeal distinct de JournalEntry
    fiscalSealsAtom,          // COMPLIANCE
    hygieneLabelsNodeAtom,    // COMPLIANCE
    hygieneLabelsAtom,        // COMPLIANCE
    maintenanceLogsNodeAtom,  // COMPLIANCE
    maintenanceLogsAtom,      // COMPLIANCE
    deliveriesNodeAtom,       // COMPLIANCE
    deliveriesAtom,           // COMPLIANCE
    hygieneLogsNodeAtom,      // COMPLIANCE
    hygieneLogsAtom,          // COMPLIANCE
    regulatoryLogsNodeAtom,   // COMPLIANCE (Universal Regulatory Log Alias)
    regulatoryLogsAtom,       // COMPLIANCE (Universal Regulatory Log Alias)
    receptionLogsNodeAtom,    // COMPLIANCE

    receptionLogsAtom,        // COMPLIANCE
    oilLogsNodeAtom,          // COMPLIANCE
    oilLogsAtom,              // COMPLIANCE
    wasteLogsNodeAtom,        // COMPLIANCE
    wasteLogsAtom,            // COMPLIANCE
    guardLoadingAtom,         // COMPLIANCE
    quarantinedProductsAtom,  // COMPLIANCE
} from '@/modules/compliance/qualite/haccp/store/complianceAtoms';
