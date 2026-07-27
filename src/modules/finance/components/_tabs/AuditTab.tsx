"use client";

import { Download } from "lucide-react";
import { FiscalAuditView } from "@modules/finance/components/accounting";

/**
 * Onglet « Audit fiscal » de la page Finance — extrait de page.tsx (dette-4).
 */
export interface AuditTabProps {
    /** nombre d'écritures de journal (désactive l'export si 0) */
    entriesCount: number;
    onExportFEC: () => void;
}

export function AuditTab({ entriesCount, onExportFEC }: AuditTabProps) {
    return (
        <section className="space-y-4">
            <div className="flex justify-end">
                <button
                    onClick={onExportFEC}
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
