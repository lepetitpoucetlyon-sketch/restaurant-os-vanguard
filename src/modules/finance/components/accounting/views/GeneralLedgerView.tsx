"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { useAccounting } from "@modules/finance";

export function GeneralLedgerView() {
    const { ledger } = useAccounting();
    const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

    const accountsWithMovements = ledger.filter(a => a.movements.length > 0);
    const selectedAccount = ledger.find(a => a.id === selectedAccountId);

    return (
        <div className="flex gap-6 h-[calc(100vh-280px)]">
            {/* Accounts List */}
            <div className="w-80 bg-bg-secondary rounded-2xl border border-border flex flex-col overflow-hidden">
                <div className="p-4 border-b border-border">
                    <h3 className="text-sm font-bold text-text-primary">Comptes Mouvementés</h3>
                    <p className="text-[10px] text-text-muted">{accountsWithMovements.length} comptes</p>
                </div>
                <div className="flex-1 overflow-auto elegant-scrollbar">
                    {accountsWithMovements.map(account => (
                        <button
                            key={account.id}
                            onClick={() => setSelectedAccountId(account.id)}
                            className={cn(
                                "w-full flex items-center justify-between px-4 py-3 border-b border-border/50 hover:bg-bg-tertiary/30 transition-all text-left outline-none",
                                selectedAccountId === account.id && "bg-accent/5 border-l-4 border-l-accent"
                            )}
                        >
                            <div>
                                <span className="font-mono text-xs font-bold text-accent">{account.code}</span>
                                <p className="text-sm font-medium text-text-primary truncate max-w-[180px]">{account.name}</p>
                            </div>
                             <span className={cn("text-sm font-black font-mono", account.balanceInCents >= 0 ? "text-success" : "text-error")}>
                                {formatCurrency(account.balanceInCents)}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Account Detail */}
            <div className="flex-1 bg-bg-secondary rounded-2xl border border-border overflow-hidden flex flex-col">
                {selectedAccount ? (
                    <>
                        <div className="p-6 border-b border-border bg-gradient-to-r from-accent/5 to-transparent">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="font-mono text-lg font-black text-accent">{selectedAccount.code}</span>
                                    <h2 className="text-xl font-bold text-text-primary">{selectedAccount.name}</h2>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-text-muted uppercase tracking-widest">Solde</p>
                                     <p className={cn("text-2xl font-black font-mono", selectedAccount.balanceInCents >= 0 ? "text-success" : "text-error")}>
                                        {formatCurrency(selectedAccount.balanceInCents)}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto p-6">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left py-3 text-[10px] font-black text-text-muted uppercase">Date</th>
                                        <th className="text-left py-3 text-[10px] font-black text-text-muted uppercase">Pièce</th>
                                        <th className="text-left py-3 text-[10px] font-black text-text-muted uppercase">Libellé</th>
                                        <th className="text-right py-3 text-[10px] font-black text-text-muted uppercase">Débit</th>
                                        <th className="text-right py-3 text-[10px] font-black text-text-muted uppercase">Crédit</th>
                                        <th className="text-right py-3 text-[10px] font-black text-text-muted uppercase">Solde</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {selectedAccount.movements.map((mv, i) => (
                                        <tr key={i} className="hover:bg-bg-tertiary/20">
                                            <td className="py-3 text-sm text-text-muted">{new Date(mv.date).toLocaleDateString('fr-FR')}</td>
                                            <td className="py-3"><span className="font-mono text-xs text-accent bg-accent/5 px-2 py-0.5 rounded">{mv.pieceNumber}</span></td>
                                            <td className="py-3 text-sm text-text-primary">{mv.description}</td>
                                             <td className="py-3 text-right font-mono text-sm text-success">{mv.debitInCents > 0 ? formatCurrency(mv.debitInCents) : '-'}</td>
                                            <td className="py-3 text-right font-mono text-sm text-error">{mv.creditInCents > 0 ? formatCurrency(mv.creditInCents) : '-'}</td>
                                            <td className="py-3 text-right font-mono text-sm font-bold">{formatCurrency(mv.runningBalanceInCents)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <FileText className="w-16 h-16 text-text-muted/20 mx-auto mb-4" />
                            <p className="text-base font-bold text-text-muted">Sélectionnez un compte</p>
                            <p className="text-sm text-text-muted/70">pour voir ses mouvements</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
