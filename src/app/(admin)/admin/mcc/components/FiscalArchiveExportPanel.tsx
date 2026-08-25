'use client';

import React, { useState } from 'react';
import { Archive, Download, Loader2, CheckCircle2 } from 'lucide-react';
import { authedFetch } from '@/lib/client/authedFetch';
import { useFleet } from '@/shared/contexts/FleetContext';
import { toast } from 'sonner';

export function FiscalArchiveExportPanel() {
    const { selectedInstanceId } = useFleet() as { selectedInstanceId: string | null };
    const [exporting, setExporting] = useState(false);
    const [lastArchive, setLastArchive] = useState<{
        masterHash: string;
        totalEntries: number;
        totalSeals: number;
        timestamp: string;
    } | null>(null);

    const handleExport = async () => {
        if (!selectedInstanceId) {
            toast.error('Veuillez sélectionner un établissement dans la flotte.');
            return;
        }

        setExporting(true);
        try {
            const res = await authedFetch('/api/admin/compliance/fiscal-archive-export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId: selectedInstanceId }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || 'Erreur lors de la génération');
            }

            const data = await res.json();
            const archive = data.archive;

            // Déclenchement du téléchargement JSON scellé
            const blob = new Blob([JSON.stringify(archive, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ARCHIVE_FISCALE_${selectedInstanceId}_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setLastArchive({
                masterHash: archive.metadata.masterArchiveHash,
                totalEntries: archive.journalEntries.length,
                totalSeals: archive.chainSummary.totalSeals,
                timestamp: archive.metadata.exportedAt,
            });

            toast.success('Archive fiscale scellée NF525 téléchargée avec succès.');
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : 'Échec de l\'export fiscal';
            toast.error(errorMsg);
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="p-6 rounded-2xl bg-surface-card border border-border-subtle backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h4 className="text-xs font-black uppercase tracking-[0.25em] text-text-primary flex items-center gap-2">
                        <Archive className="w-4 h-4 text-brand" />
                        Export Légal & Archive Fiscale Scellée (1 Clic)
                    </h4>
                    <p className="text-micro text-secondary">
                        Compilation certifiée NF525 du Grand Livre, des clôtures Z et du scellement SHA-256 pour l'administration fiscale.
                    </p>
                </div>

                <button
                    onClick={handleExport}
                    disabled={exporting || !selectedInstanceId}
                    className="flex items-center gap-2 px-5 py-2.5 bg-action-primary hover:bg-action-primary/90 text-text-primary rounded-xl text-xs font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-indigo-600/20 whitespace-nowrap"
                >
                    {exporting ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Scellement en cours...
                        </>
                    ) : (
                        <>
                            <Download className="w-4 h-4" />
                            Générer l&apos;Archive Scellée
                        </>
                    )}
                </button>
            </div>

            {lastArchive && (
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        Dernière Archive Certifiée Prête
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-micro font-mono text-secondary">
                        <div>
                            <span className="text-text-primary font-bold">Écritures comptables:</span> {lastArchive.totalEntries}
                        </div>
                        <div>
                            <span className="text-text-primary font-bold">Sceaux fiscaux:</span> {lastArchive.totalSeals}
                        </div>
                        <div className="truncate" title={lastArchive.masterHash}>
                            <span className="text-text-primary font-bold">Empreinte SHA-256:</span> {lastArchive.masterHash.slice(0, 16)}...
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
