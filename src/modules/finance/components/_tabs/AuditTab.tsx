"use client";

import { useCallback } from "react";
import { Download } from "lucide-react";
import { FiscalAuditView } from '@/modules/finance';
import { FECExporter } from '@/modules/finance';
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
                <button
                    onClick={handleFECExport}
                    disabled={entriesCount === 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-md border border-border text-sm font-medium hover:bg-surface-sidebar transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Download className="w-4 h-4" />
                    Exporter FEC
                </button>
            </div>
            <FiscalAuditView />
        </section>
    );
}
