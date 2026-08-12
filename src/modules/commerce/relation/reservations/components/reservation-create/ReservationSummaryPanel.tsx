'use client';

import { Users, Sparkles, ArrowRight } from 'lucide-react';
import type { Customer } from '@nexus/contracts';
import type { Table } from '@/modules/ops';

interface ReservationSummaryPanelProps {
    selectedCustomer: Customer | null;
    formData: { date: string; time: string; covers: number; tableId: string };
    availableTables: Table[];
    suggestedTable: Table | null;
    step: 1 | 2;
    saving: boolean;
    onSubmit: () => void;
}

export function ReservationSummaryPanel({
    selectedCustomer, formData, availableTables, suggestedTable, step, saving, onSubmit,
}: ReservationSummaryPanelProps) {
    return (
        <div className="w-[300px] bg-bg-secondary p-10 flex flex-col justify-between shrink-0 border-l border-border">
            <div className="space-y-6">
                {selectedCustomer ? (
                    <>
                        <div>
                            <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Sparkles className="w-3 h-3 text-accent" /> Profil client
                            </p>
                            <p className="text-xl font-serif italic text-text-primary">
                                {selectedCustomer.firstName} {selectedCustomer.lastName}
                            </p>
                            <p className="text-[11px] text-text-muted mt-1">{selectedCustomer.phone}</p>
                            {selectedCustomer.email && (
                                <p className="text-[10px] text-text-muted">{selectedCustomer.email}</p>
                            )}
                        </div>

                        {selectedCustomer.preferences.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {selectedCustomer.preferences.slice(0, 4).map((p, i) => (
                                    <span key={i} className="px-3 py-1 bg-bg-tertiary text-[9px] font-black text-text-muted rounded-xl border border-border uppercase tracking-widest">
                                        {p}
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="p-5 rounded-2xl bg-accent/5 border border-accent/20">
                            <p className="text-[9px] font-black text-accent uppercase tracking-widest mb-2">Résumé</p>
                            <p className="text-[11px] text-text-muted leading-relaxed">
                                {formData.date} à {formData.time} — {formData.covers} couv.
                                {(formData.tableId || suggestedTable) && (
                                    <> — Table #{(formData.tableId ? availableTables.find((t) => t.id === formData.tableId)?.number : suggestedTable?.number) ?? "?"}</>
                                )}
                            </p>
                        </div>
                    </>
                ) : (
                    <div className="py-12 text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-bg-tertiary flex items-center justify-center mx-auto border border-dashed border-border">
                            <Users strokeWidth={1} className="w-8 h-8 text-text-muted/30" />
                        </div>
                        <p className="text-[11px] font-black uppercase tracking-widest text-text-muted max-w-[160px] mx-auto leading-relaxed italic">
                            Sélectionnez un client pour continuer
                        </p>
                    </div>
                )}
            </div>

            <button
                disabled={!selectedCustomer || step !== 2 || saving}
                onClick={onSubmit}
                className="w-full h-16 bg-accent text-bg-primary rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.25em] transition-all shadow-2xl shadow-amber-500/20 disabled:opacity-20 disabled:cursor-not-allowed hover:scale-[1.02] flex items-center justify-center gap-3"
            >
                <ArrowRight className="w-4 h-4" />
                {saving ? "Enregistrement…" : "Confirmer"}
            </button>
        </div>
    );
}
