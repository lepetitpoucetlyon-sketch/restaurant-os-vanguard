"use client";

import { useCallback } from "react";
import { Download } from "lucide-react";
import { FiscalAuditView } from '../accounting/FiscalAuditView';
import { FECExporter } from '../../comptabilite/accounting/domain/FECExporter';
import { ActionGuard } from '@/shared/components/rbac/ActionGuard';
import type { JournalEntry } from "@nexus/contracts";

/**
 * Onglet « Audit fiscal » de la page Finance — extrait de page.tsx (dette-4).
 */
export interface AuditTabProps {
    /** nombre d'écritures de journal (désactive l'export si 0) */
    entriesCount: number;
    journalEntries: unknown[];
}

export function AuditTab({ entriesCount, journalEntries }: AuditTabProps) {
    const handleFECExport = useCallback(() => {
        FECExporter.downloadFEC(journalEntries as unknown as JournalEntry[]);
    }, [journalEntries]);

    return (
        <section className="space-y-4">
            <div className="flex justify-end">
                <ActionGuard
                    page="finance"
                    action="export_fec"
                    requiresPin={true}
                    pinTitle="Export Fiscal FEC Sécurisé"
                    pinDescription="Confirmation d'identité requise pour exporter le Fichier des Écritures Comptables conforme DGFiP."
                >
                    <button
                        onClick={handleFECExport}
                        disabled={entriesCount === 0}
                        className="flex items-center gap-2 px-4 py-2 rounded-md border border-border text-sm font-medium hover:bg-surface-glass transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download className="w-4 h-4" />
                        Exporter FEC
                    </button>
                </ActionGuard>
            </div>
            <FiscalAuditView />
        </section>
    );
}
