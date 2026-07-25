"use client";

/**
 * FacturXDownloadButton — fin-9
 * Bouton de téléchargement du XML Factur-X (EN16931 / profil MINIMUM)
 * pour une JournalEntry identifiée par son ID.
 *
 * Obligation légale e-facturation B2B 2026 (France).
 */

import { useState, useCallback } from "react";
import { FileCode2 } from "lucide-react";
import { toast } from "sonner";
import { AccountingReportService } from "@/modules/finance/services/AccountingReportService";

// ── Props ─────────────────────────────────────────────────────────────────────

interface FacturXDownloadButtonProps {
    /** ID de la JournalEntry Nexus à exporter */
    invoiceId: string;
    /** Nom du fichier XML (optionnel — sinon facturx_<pieceNumber>.xml) */
    filename?: string;
    className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function FacturXDownloadButton({
    invoiceId,
    filename,
    className = "",
}: FacturXDownloadButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleDownload = useCallback(async () => {
        setLoading(true);
        try {
            const xml = await AccountingReportService.exportFacturX(invoiceId);

            // Téléchargement côté client via Blob
            const blob = new Blob([xml], { type: "application/xml;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename ?? `facturx_${invoiceId}.xml`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success("XML Factur-X téléchargé.");
        } catch (err) {
            console.error("[FacturX]", err);
            toast.error("Erreur lors de la génération Factur-X.");
        } finally {
            setLoading(false);
        }
    }, [invoiceId, filename]);

    return (
        <button
            onClick={handleDownload}
            disabled={loading}
            title="Télécharger Factur-X (XML EN16931) — e-facturation B2B 2026"
            className={[
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border",
                "text-xs font-medium transition-colors",
                "hover:bg-action-primary hover:text-white hover:border-action-primary",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                className,
            ]
                .filter(Boolean)
                .join(" ")}
        >
            <FileCode2 className="w-3.5 h-3.5 shrink-0" />
            {loading ? "Génération…" : "Factur-X (XML)"}
        </button>
    );
}
