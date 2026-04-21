"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    UploadCloud, 
    FileText, 
    Image as ImageIcon, 
    CheckCircle2, 
    AlertCircle, 
    Search,
    ArrowRight,
    RefreshCw,
    ShieldCheck,
    X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/ui.foundations';
import { useAccounting } from '@/context/AccountingContext';
import { StatementIngestionService } from '@/domain/accounting/StatementIngestionService';
import { AccountingMatchingService, MatchingResult } from '@/domain/accounting/AccountingMatchingService';
import { formatCurrency } from '@/lib/formatters';
import { AggregationWidget } from './AggregationWidget';
import { PowensService } from '@/domain/accounting/PowensService';
import { BankTransaction } from '@/types';

interface PowensAccount {
    id: string;
    name: string;
    bankName: string;
    bankColor: string;
    balanceInCents: number;
}

interface ReconciliationHubProps {
    onClose: () => void;
}

export function ReconciliationHub({ onClose }: ReconciliationHubProps) {
    const { journalEntries, bankTransactions, expenseClaims, reconcileTransaction } = useAccounting();
    
    // UI State
    const [step, setStep] = useState<'upload' | 'processing' | 'match'>('upload');
    const [fileType, setFileType] = useState<'csv' | 'image' | null>(null);
    const [matches, setMatches] = useState<MatchingResult[]>([]);
    const [scannedTxs, setScannedTxs] = useState<BankTransaction[]>([]);
    const [connectedAccounts, setConnectedAccounts] = useState<PowensAccount[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

    // Filter for pending receipts from staff
    const pendingReceipts = expenseClaims.filter(c => c.status === 'pending' && c.receiptUrl);

    // Initial Fetch of accounts
    React.useEffect(() => {
        const loadAccounts = async () => {
            const accs = await PowensService.getAccounts('demo-token');
            setConnectedAccounts(accs);
            if (accs.length > 0) setSelectedAccountId(accs[0].id);
        };
        loadAccounts();
    }, []);

    const handleSyncComplete = (txs: BankTransaction[]) => {
        setScannedTxs(txs);
        setFileType(null); // API source
        setStep('processing');
        
        const matchResults = AccountingMatchingService.batchMatch(txs, journalEntries);
        setMatches(matchResults);
        
        setStep('match');
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const isImage = file.type.startsWith('image/');
        const isCSV = file.name.endsWith('.csv');

        if (!isImage && !isCSV) return;

        setFileType(isImage ? 'image' : 'csv');
        setStep('processing');

        // Simulate Extraction
        let transactions: Omit<BankTransaction, 'id'>[] = [];
        if (isImage) {
            transactions = await StatementIngestionService.extractFromImage(file);
        } else {
            const text = await file.text();
            transactions = await StatementIngestionService.parseCSV(text);
        }

        const typedTransactions = transactions.map((t, idx) => ({ ...t, id: `ext_${idx}` } as BankTransaction));
        setScannedTxs(typedTransactions);

        // Run Matching Engine
        // Note: In real app, we filter journalEntries to those not yet reconciled
        const matchResults = AccountingMatchingService.batchMatch(typedTransactions, journalEntries);
        setMatches(matchResults);

        setStep('match');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-bg-secondary w-full max-w-5xl rounded-[3rem] border border-border overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="p-8 border-b border-border flex items-center justify-between bg-bg-tertiary/30">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center">
                            <RefreshCw className={cn("w-6 h-6 text-accent", step === 'processing' && "animate-spin")} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-serif font-black italic">Nexus <span className="text-accent not-italic">Reconciliation</span></h2>
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">Module de Rapprochement Intelligent</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-bg-tertiary flex items-center justify-center transition-all">
                        <X className="w-5 h-5 text-text-muted" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-auto elegant-scrollbar p-8">
                    <AnimatePresence mode="wait">
                        {step === 'upload' && (
                            <motion.div 
                                key="upload"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="space-y-12"
                            >
                                {/* Automated Option */}
                                <AggregationWidget onSyncComplete={handleSyncComplete} />

                                {/* Manual Separator */}
                                <div className="relative py-4">
                                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/50" /></div>
                                    <div className="relative flex justify-center"><span className="bg-bg-secondary px-4 text-[9px] font-black text-text-muted uppercase tracking-[0.4em]">Ou import manuel</span></div>
                                </div>

                                {/* Drag & Drop Option */}
                                <div className="flex flex-col items-center justify-center text-center">
                                    <div className="w-24 h-24 bg-accent/5 rounded-[2rem] border-2 border-dashed border-accent/20 flex items-center justify-center mb-8 group cursor-pointer hover:bg-accent/10 transition-all">
                                        <UploadCloud className="w-10 h-10 text-accent group-hover:scale-110 transition-transform" />
                                        <input 
                                            type="file" 
                                            onChange={handleFileUpload}
                                            className="absolute inset-0 opacity-0 cursor-pointer" 
                                            accept=".csv, image/*"
                                        />
                                    </div>
                                    <h3 className="text-xl font-bold mb-4">Déposez votre Relevé</h3>
                                    <p className="text-text-muted text-sm max-w-md mx-auto leading-relaxed mb-8">
                                        Glissez un fichier **CSV** ou une **capture d'écran** de votre application bancaire. 
                                        L'IA extraira automatiquement les mouvements pour vous proposer un lettrage immédiat.
                                    </p>
                                </div>
                                {/* Staff Receipts Preview */}
                                {pendingReceipts.length > 0 && (
                                    <div className="p-8 bg-accent/5 rounded-[2.5rem] border border-accent/10 flex items-center justify-between">
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 bg-white dark:bg-bg-tertiary rounded-2xl flex items-center justify-center shadow-sm">
                                                <ImageIcon className="w-6 h-6 text-accent" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black uppercase tracking-widest">Justificatifs Staff en Attente</h4>
                                                <p className="text-[10px] text-text-muted italic">{pendingReceipts.length} scans OCR à valider et réconcilier</p>
                                            </div>
                                        </div>
                                        <Button 
                                            onClick={() => setStep('match')}
                                            className="bg-accent text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] px-8"
                                        >
                                            Ouvrir la File
                                        </Button>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {step === 'processing' && (
                            <motion.div 
                                key="processing"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center py-20 text-center"
                            >
                                <div className="relative w-32 h-32 mb-8">
                                    {/* Scanner Animation */}
                                    <div className="absolute inset-0 border-2 border-accent rounded-3xl opacity-20" />
                                    <motion.div 
                                        animate={{ top: ['0%', '100%', '0%'] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                        className="absolute left-0 right-0 h-1 bg-accent shadow-[0_0_15px_rgba(197,160,89,0.8)] z-10"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        {fileType === 'image' ? <ImageIcon className="w-12 h-12 text-accent" /> : <FileText className="w-12 h-12 text-accent" />}
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold mb-2">Analyse Intelligente...</h3>
                                <p className="text-text-muted text-xs uppercase tracking-widest animate-pulse">
                                    {fileType === 'image' ? "EXTRACTION DE LA GRILLE BANCAIRE" : "PARSING DU FLUX CSV"}
                                </p>
                            </motion.div>
                        )}

                        {step === 'match' && (
                            <motion.div 
                                key="match"
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center gap-4">
                                    <ShieldCheck className="w-6 h-6" />
                                    <span className="text-sm font-black uppercase tracking-widest">{matches.length} Mouvements identifiés</span>
                                </div>

                                {/* Bank Account Selector */}
                                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                    {connectedAccounts.map(acc => (
                                        <button
                                            key={acc.id}
                                            onClick={() => setSelectedAccountId(acc.id)}
                                            className={cn(
                                                "px-6 py-4 rounded-3xl border transition-all text-left min-w-[200px] shrink-0",
                                                selectedAccountId === acc.id 
                                                    ? "bg-bg-secondary border-accent shadow-lg shadow-accent/5" 
                                                    : "bg-bg-tertiary/30 border-border hover:border-text-muted"
                                            )}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: acc.bankColor }}>{acc.bankName}</span>
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            </div>
                                            <p className="text-sm font-bold text-text-primary">{acc.name}</p>
                                            <p className="text-xs font-mono text-text-muted mt-1">{formatCurrency(acc.balanceInCents)}</p>
                                        </button>
                                    ))}
                                </div>

                                <div className="flex items-center justify-between p-6 bg-emerald-500/5 rounded-3xl border border-emerald-500/20 text-emerald-500">
                                    <div className="flex items-center gap-4">
                                        <ShieldCheck className="w-6 h-6" />
                                        <span className="text-sm font-black uppercase tracking-widest">
                                            {matches.filter(m => {
                                                const tx = scannedTxs.find(t => t.id === m.transactionId);
                                                return tx?.bankName?.toLowerCase().includes(connectedAccounts.find(a => a.id === selectedAccountId)?.bankName?.toLowerCase() || '---');
                                            }).length} Mouvements sur ce compte
                                        </span>
                                    </div>
                                    <Button 
                                        onClick={async () => {
                                            const accountingContext = useAccounting() as unknown as { ingestTransactions: (txs: BankTransaction[]) => Promise<void> };
                                            if (accountingContext.ingestTransactions) {
                                                await accountingContext.ingestTransactions(scannedTxs);
                                            } else {
                                                console.warn("ingestTransactions not implemented in this context");
                                            }
                                            setMatches([]);
                                            setScannedTxs([]);
                                            setStep('upload');
                                        }}
                                        className="bg-emerald-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest"
                                    >
                                        TOUT VALIDER
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    {matches.map((match, i) => {
                                        const tx = scannedTxs[i];
                                        const entry = journalEntries.find(e => e.id === match.suggestedEntryId);
                                        
                                        return (
                                            <div key={i} className="grid grid-cols-[1fr_40px_1fr] items-center gap-4 group">
                                                {/* Bank Side */}
                                                <div className="bg-bg-tertiary/50 p-6 rounded-3xl border border-border group-hover:border-accent/30 transition-all">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">BANQUE</span>
                                                        <span className="text-xs font-mono font-bold text-text-primary">{formatCurrency(tx.amountInCents)}</span>
                                                    </div>
                                                    <p className="text-sm font-bold truncate text-text-primary font-mono">{tx.label}</p>
                                                    <p className="text-[10px] text-text-muted mt-1">{new Date(tx.date).toLocaleDateString()}</p>
                                                </div>

                                                {/* Linking Side */}
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-full flex items-center justify-center border-2",
                                                        match.confidence === 'perfect' ? "bg-emerald-500/10 border-emerald-500 text-emerald-500" : 
                                                        match.confidence === 'high' ? "bg-accent/10 border-accent text-accent" : 
                                                        "bg-error/10 border-error text-error"
                                                    )}>
                                                        {match.confidence === 'perfect' ? <CheckCircle2 className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
                                                    </div>
                                                    <span className="text-[8px] font-black tracking-tighter uppercase opacity-40">{match.score}%</span>
                                                </div>

                                                {/* Ledger Side */}
                                                <div className={cn(
                                                    "p-6 rounded-3xl border border-border transition-all flex items-center justify-between",
                                                    match.suggestedEntryId ? "bg-bg-secondary" : "bg-bg-tertiary border-dashed opacity-50"
                                                )}>
                                                    {entry ? (
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="text-[10px] font-black text-accent uppercase tracking-widest">REGISTRE</span>
                                                                <span className="text-xs font-bold text-text-primary">{formatCurrency(entry.lines[0].amountInCents)}</span>
                                                            </div>
                                                            <p className="text-sm font-bold text-text-primary truncate">{entry.description}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="px-2 py-0.5 bg-bg-tertiary text-[8px] font-black rounded-md">{entry.pieceNumber}</span>
                                                                <span className="text-[10px] text-emerald-500 font-bold">{match.reasons[0]}</span>
                                                                {expenseClaims.find(c => c.journalEntryId === entry.id)?.receiptUrl && (
                                                                    <a 
                                                                        href={expenseClaims.find(c => c.journalEntryId === entry.id)?.receiptUrl} 
                                                                        target="_blank" 
                                                                        rel="noopener noreferrer"
                                                                        className="flex items-center gap-1 px-2 py-0.5 bg-accent/10 text-accent rounded-md text-[8px] font-black uppercase hover:bg-accent/20 transition-all"
                                                                    >
                                                                        <ImageIcon className="w-2 h-2" /> VOIR JUSTIFICATIF
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex-1 text-center py-2">
                                                            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Aucune preuve trouvée</p>
                                                        </div>
                                                    )}
                                                    
                                                    {entry && (
                                                        <button 
                                                            onClick={() => reconcileTransaction(match.transactionId, entry.id)}
                                                            className="w-8 h-8 rounded-full hover:bg-emerald-500 hover:text-white flex items-center justify-center text-emerald-500 border border-emerald-500/30 transition-all opacity-0 group-hover:opacity-100"
                                                        >
                                                            <CheckCircle2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Controls */}
                <div className="p-8 border-t border-border flex items-center justify-between bg-bg-tertiary/10">
                    <div className="flex items-center gap-2 text-text-muted">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Le rapprochement est irréversible après validation fiscale</span>
                    </div>
                    {step === 'match' && (
                        <Button variant="outline" onClick={() => setStep('upload')} className="rounded-full px-8 text-[10px] font-black uppercase tracking-widest">Recommencer</Button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
