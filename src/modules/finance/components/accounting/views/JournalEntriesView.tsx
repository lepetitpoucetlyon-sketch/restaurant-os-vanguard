"use client";

import { useState, useMemo } from "react";
import { CheckCircle2, Clock, Eye } from "lucide-react";
import { Button } from "@ui/button";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { useAccounting } from "@modules/finance";

export function JournalEntriesView() {
    const { journalEntries, validateJournalEntry } = useAccounting();
    const [filter, setFilter] = useState<'all' | 'pending' | 'validated'>('all');

    const filtered = useMemo(() => {
        if (filter === 'pending') return journalEntries.filter(e => !e.isValidated);
        if (filter === 'validated') return journalEntries.filter(e => e.isValidated);
        return journalEntries;
    }, [journalEntries, filter]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 p-1 bg-bg-secondary rounded-xl border border-border">
                    {['all', 'pending', 'validated'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as 'all' | 'pending' | 'validated')}
                            className={cn(
                                "px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all",
                                filter === f ? "bg-accent text-white" : "text-text-muted hover:text-text-primary"
                            )}
                        >
                            {f === 'all' ? 'Toutes' : f === 'pending' ? 'En attente' : 'Validées'}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-[9px] text-text-muted uppercase">Total Débits</p>
                        <p className="text-lg font-black text-success font-mono">
                            {formatCurrency(filtered.reduce((acc, e) => acc + e.lines.filter(l => l.side === 'debit').reduce((a, l) => a + l.amountInCents, 0), 0))}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] text-text-muted uppercase">Total Crédits</p>
                        <p className="text-lg font-black text-error font-mono">
                            {formatCurrency(filtered.reduce((acc, e) => acc + e.lines.filter(l => l.side === 'credit').reduce((a, l) => a + l.amountInCents, 0), 0))}
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-bg-secondary rounded-2xl border border-border overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-border bg-bg-tertiary/30">
                            <th className="text-left py-4 px-6 text-[10px] font-black text-text-muted uppercase">Date</th>
                            <th className="text-left py-4 px-6 text-[10px] font-black text-text-muted uppercase">N° Pièce</th>
                            <th className="text-left py-4 px-6 text-[10px] font-black text-text-muted uppercase">Libellé</th>
                            <th className="text-center py-4 px-6 text-[10px] font-black text-text-muted uppercase">Lignes</th>
                            <th className="text-right py-4 px-6 text-[10px] font-black text-text-muted uppercase">Montant</th>
                            <th className="text-center py-4 px-6 text-[10px] font-black text-text-muted uppercase">Statut</th>
                            <th className="text-right py-4 px-6 text-[10px] font-black text-text-muted uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {filtered.length === 0 ? (
                            <tr><td colSpan={7} className="py-12 text-center text-text-muted italic">Aucune écriture</td></tr>
                        ) : (
                            filtered.map(entry => (
                                <tr key={entry.id} className="hover:bg-bg-tertiary/20 group">
                                    <td className="py-4 px-6 text-sm text-text-muted">{entry.date ? new Date(entry.date).toLocaleDateString('fr-FR') : '—'}</td>
                                    <td className="py-4 px-6"><span className="font-mono text-xs font-bold text-accent bg-accent/5 px-2 py-1 rounded">{entry.pieceNumber}</span></td>
                                    <td className="py-4 px-6 text-sm font-medium text-text-primary max-w-xs truncate">{entry.description}</td>
                                    <td className="py-4 px-6 text-center text-sm text-text-muted">{entry.lines.length}</td>
                                    <td className="py-4 px-6 text-right font-mono text-sm font-black">{formatCurrency(entry.lines.filter(l => l.side === 'debit').reduce((a, l) => a + l.amountInCents, 0))}</td>
                                    <td className="py-4 px-6 text-center">
                                        {entry.isValidated ? (
                                            <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase text-success bg-success/5 px-2 py-1 rounded-full">
                                                <CheckCircle2 className="w-3 h-3" /> Validé
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase text-amber-600 bg-amber-5 px-2 py-1 rounded-full">
                                                <Clock className="w-3 h-3" /> Attente
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                            <Button size="sm" variant="ghost" className="h-8 px-3 rounded-lg"><Eye className="w-4 h-4" /></Button>
                                            {!entry.isValidated && (
                                                <Button size="sm" className="h-8 px-3 bg-success text-white rounded-lg text-[10px] font-bold" onClick={() => validateJournalEntry(entry.id)}>
                                                    Valider
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
