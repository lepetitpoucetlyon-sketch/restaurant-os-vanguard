'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  CheckCircle2,
  AlertCircle,
  Save,
  Thermometer,
  ShieldAlert,
  ChevronRight,
  ClipboardList,
  FileText,
  ScanLine,
  Barcode,
  Search
} from 'lucide-react';
import { useTenant } from '@/shared/hooks/useTenant';

import {
    type ScannedItem,
    type BarcodeSearchResult,
    performScan,
    performSaveToStock,
    performBarcodeSearch,
    onBarcodeKeyDown,
} from './receptionService';

// ── Sous-composants locaux (purement présentationnels, ~60L) ──────────────────

function ScanContent({ isScanning, onScan }: { isScanning: boolean; onScan: () => void }) {
    return isScanning ? (
        <>
            <motion.div
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-status-success to-transparent z-10 shadow-[0_0_20px_rgba(52,211,153,0.5)]"
            />
            <ScanLine className="w-20 h-20 text-status-success animate-pulse mb-4" />
            <span className="text-status-success font-black tracking-[0.3em] uppercase animate-pulse">Analyse Empire Vision...</span>
        </>
    ) : (
        <>
            <Camera className="w-16 h-16 text-text-secondary group-hover:text-status-success transition-colors mb-6" />
            <p className="text-text-secondary font-bold mb-8 text-center max-w-xs uppercase tracking-tighter">Posez le bon de livraison sous l'objectif ou importez un PDF</p>
            <button onClick={onScan} className="bg-surface-card text-primary font-black py-5 px-12 rounded-2xl hover:bg-status-success transition-all active:scale-95 text-lg uppercase shadow-xl shadow-emerald-500/10">
                Scanner le Bon
            </button>
        </>
    );
}

function AdviceSaveButton({ isSaving, onSave }: { isSaving: boolean; onSave: () => void }) {
    return (
        <button onClick={onSave} disabled={isSaving} className="w-full bg-accent-gold text-[#0B0B0C] py-4 rounded-2xl font-medium text-sm tracking-tight flex items-center justify-center gap-3 active:scale-[0.99] transition-colors disabled:opacity-50 shadow-[0_4px_20px_-6px_rgba(197,160,89,0.4)]">
            {isSaving ? (
                <span className="animate-pulse">Synchronisation...</span>
            ) : (
                <><Save className="w-5 h-5" />Sceller &amp; Stocker</>
            )}
        </button>
    );
}

function StepIndicator({ step, active, label }: { step: string; active: boolean; label: string }) {
    return (
        <div className={`px-4 py-2 rounded-lg text-xs font-medium tracking-tight transition-colors flex items-center gap-2 ${active ? 'bg-accent-gold/12 text-accent-gold border border-accent-gold/30' : 'text-text-secondary'}`}>
            <span className="font-serif italic opacity-60 tabular-nums">{step === 'scan' ? '01' : step === 'verify' ? '02' : '03'}</span>
            <span>{label}</span>
        </div>
    );
}

function LogItem({ label, value, trend }: { label: string; value: string; trend: 'up' | 'ok' }) {
    return (
        <div className="flex justify-between items-baseline text-xs">
            <span className="text-text-muted">{label}</span>
            <span className={`font-medium tabular-nums ${trend === 'up' ? 'text-status-success' : 'text-accent-gold'}`}>{value}</span>
        </div>
    );
}

// ── Composant principal ───────────────────────────────────────────────────────

export function InventoryReceptionDashboard() {
    const { activeTenantId } = useTenant();
    const tenantId = activeTenantId || 'default';
    const [isScanning, setIsScanning] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [scanResult, setScanResult] = useState<ScannedItem[] | null>(null);
    const [activeStep, setActiveStep] = useState<'scan' | 'verify' | 'advice'>('scan');

    // ── log-5: Barcode scan at reception ──────────────────────────────────────
    const barcodeRef = useRef<HTMLInputElement>(null);
    const [barcodeValue, setBarcodeValue] = useState('');
    const [barcodeResult, setBarcodeResult] = useState<BarcodeSearchResult | null>(null);
    const [barcodeSearching, setBarcodeSearching] = useState(false);
    const barcodeBufferRef = useRef('');
    const barcodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleBarcodeSearch = useCallback(async (code: string) => {
        await performBarcodeSearch(tenantId ?? '', code, setBarcodeSearching, setBarcodeResult);
    }, [tenantId]);

    const handleBarcodeKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            onBarcodeKeyDown(e, barcodeValue, barcodeBufferRef, barcodeTimerRef, handleBarcodeSearch);
        },
        [barcodeValue, handleBarcodeSearch]
    );

    const handleScan = async () => {
        if (!tenantId) return;
        await performScan(tenantId, setIsScanning, setScanResult as (items: ScannedItem[]) => void, setActiveStep);
    };

    const handleSaveToStock = async () => {
        if (!tenantId || !scanResult) return;
        await performSaveToStock(tenantId, scanResult, setIsSaving, setActiveStep, setScanResult);
    };

    return (
        <div className="min-h-screen bg-surface-sidebar text-text-primary p-6 md:p-10 font-ui">
            {/* ── log-5: Barcode scan strip ───────────────────────────────────── */}
            <div className="mb-8 bg-surface-sidebar border border-border-subtle rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-text-secondary shrink-0">
                    <Barcode className="w-4 h-4 text-status-success" />
                    Scan code-barres
                </div>
                <div className="flex-1 relative">
                    <input
                        ref={barcodeRef}
                        type="text"
                        value={barcodeValue}
                        onChange={(e) => setBarcodeValue(e.target.value)}
                        onKeyDown={handleBarcodeKeyDown}
                        placeholder="Scannez ou saisissez un code-barres / SKU, puis Entrée…"
                        className="w-full bg-surface-sidebar border border-border-default rounded-xl px-4 py-3 text-sm font-medium text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-status-success transition-all"
                        autoComplete="off"
                    />
                    {barcodeSearching && (
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-status-success animate-pulse" />
                    )}
                </div>
                <button
                    onClick={() => { if (barcodeValue) { void handleBarcodeSearch(barcodeValue); } }}
                    disabled={!barcodeValue || barcodeSearching}
                    className="px-5 py-3 rounded-xl bg-status-success/10 text-status-success text-xs font-black uppercase tracking-widest hover:bg-status-success/20 disabled:opacity-40 transition-all whitespace-nowrap"
                >
                    Rechercher
                </button>
            </div>

            {/* Barcode result banner */}
            {barcodeResult && (
                <div className="mb-6 bg-status-success/10 border border-status-success/20 rounded-2xl px-5 py-4 flex items-start justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-status-success mb-1">Produit identifié</p>
                        <p className="font-bold text-text-primary">{barcodeResult.name}</p>
                        <div className="flex gap-4 mt-1 text-[10px] text-text-secondary font-bold uppercase">
                            {barcodeResult.unit && <span>Unité : {barcodeResult.unit}</span>}
                            {barcodeResult.sku && <span>SKU : {barcodeResult.sku}</span>}
                            {barcodeResult.supplier && <span>Fournisseur : {barcodeResult.supplier}</span>}
                        </div>
                    </div>
                    <button
                        onClick={() => { setBarcodeResult(null); setBarcodeValue(''); }}
                        className="text-text-secondary hover:text-text-primary text-xs font-black uppercase tracking-widest shrink-0"
                    >
                        Effacer
                    </button>
                </div>
            )}

            {/* Header */}
            <header className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-status-success/10 border border-status-success/20 rounded-2xl flex items-center justify-center text-status-success">
                        <ClipboardList className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.32em]">
                            Flux Empire • Ingestion Intelligente
                        </p>
                        <h1 className="text-3xl md:text-[34px] font-serif font-black italic text-text-primary tracking-tight leading-none">
                            Réception<span className="text-accent-gold not-italic">.</span>
                        </h1>
                    </div>
                </div>
                <div className="flex bg-surface-sidebar p-1 rounded-xl border border-border-subtle">
                    <StepIndicator step="scan" active={activeStep === 'scan'} label="Scan" />
                    <StepIndicator step="verify" active={activeStep === 'verify'} label="Vérif" />
                    <StepIndicator step="advice" active={activeStep === 'advice'} label="Conseils" />
                </div>
            </header>

            <main className="max-w-5xl mx-auto">
                <AnimatePresence mode="wait">
                    {activeStep === 'scan' && (
                        <motion.div
                            key="scan-view"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            className="flex flex-col items-center"
                        >
                            <div className="w-full aspect-video md:aspect-[21/9] bg-surface-sidebar rounded-3xl border-2 border-dashed border-border-default flex flex-col items-center justify-center relative overflow-hidden group">
                                <ScanContent isScanning={isScanning} onScan={handleScan} />
                            </div>
                        </motion.div>
                    )}

                    {activeStep === 'verify' && scanResult && (
                        <motion.div
                            key="verify-view"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-6"
                        >
                            <div className="bg-surface-sidebar border border-border-subtle rounded-3xl p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        <FileText className="text-action-primary" />
                                        Données Extraites (OCR)
                                    </h2>
                                    <span className="text-[10px] font-black bg-action-primary text-action-primary px-3 py-1 rounded-full uppercase tracking-widest">Confidence 98.4%</span>
                                </div>
                                <div className="space-y-4">
                                    {scanResult.map((item, idx) => (
                                        <div key={item.id} className="flex items-center justify-between p-4 bg-surface-sidebar rounded-2xl border border-border-subtle group hover:border-emerald-500/30 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-surface-card rounded-xl flex items-center justify-center font-bold text-xs">0{idx + 1}</div>
                                                <div>
                                                    <p className="font-bold text-sm uppercase">{item.name}</p>
                                                    <p className="text-[10px] text-text-secondary font-bold tracking-widest">DLC: {item.dlc}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-8">
                                                <div className="text-right">
                                                    <p className="text-sm font-black">{item.qty} {item.unit}</p>
                                                    <p className="text-[10px] text-status-success font-bold">€{item.price.toFixed(2)}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button className={`p-2 rounded-lg transition-all ${item.forceScan ? 'bg-status-warning text-status-warning' : 'bg-surface-card text-text-secondary hover:text-text-primary'}`}>
                                                        <ShieldAlert className="w-5 h-5" />
                                                    </button>
                                                    <button className="p-2 bg-status-success text-status-success rounded-lg">
                                                        <CheckCircle2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-end gap-4">
                                <button onClick={() => setActiveStep('scan')} className="px-8 py-4 font-bold text-text-secondary uppercase tracking-widest">Annuler</button>
                                <button onClick={() => setActiveStep('advice')} className="bg-action-primary px-10 py-5 rounded-2xl font-black uppercase shadow-lg shadow-indigo-600/20 hover:bg-action-primary transition-all flex items-center gap-3">
                                    Continuer vers le Stockage
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {activeStep === 'advice' && (
                        <motion.div
                            key="advice-view"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-1 md:grid-cols-3 gap-8"
                        >
                            <div className="md:col-span-2 space-y-6">
                                <div className="bg-surface-sidebar border border-border-default rounded-3xl p-8">
                                    <div className="flex items-center justify-between mb-8">
                                        <h2 className="text-xl font-bold italic underline decoration-indigo-500/50">L'Intelligence du Chef</h2>
                                        <Thermometer className="text-status-warning w-6 h-6 animate-pulse" />
                                    </div>
                                    <div className="space-y-8">
                                        <div className="p-6 bg-action-primary border border-focus/20 rounded-2xl">
                                            <h3 className="text-action-primary text-xs font-black uppercase mb-4 flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4" />
                                                Conseil de Conservation (ANETH)
                                            </h3>
                                            <textarea
                                                className="w-full bg-surface-sidebar/50 border-none focus:ring-0 text-text-secondary placeholder:text-text-secondary resize-none h-24 font-medium"
                                                placeholder="Ex: Dans un torchon humide au frais, changer l'eau tous les 2 jours..."
                                                defaultValue={"Dans un torchon humide au frais, à l'abri de la lumière directe."}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-6 bg-surface-card rounded-2xl">
                                            <div>
                                                <h4 className="font-bold text-sm uppercase">Scellement de Rigueur</h4>
                                                <p className="text-[10px] text-text-secondary font-bold tracking-tight uppercase">Imposer le scan pour sortir le SAUMON</p>
                                            </div>
                                            <div className="w-14 h-8 bg-status-success rounded-full relative p-1 flex items-center justify-end cursor-pointer">
                                                <div className="w-6 h-6 bg-surface-card rounded-full shadow-sm" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="bg-status-success text-primary p-8 rounded-3xl shadow-2xl shadow-emerald-500/20">
                                    <h3 className="font-black text-2xl mb-4 leading-tight uppercase">Fin de Réception</h3>
                                    <p className="text-primary/70 font-bold text-xs uppercase mb-10 tracking-tighter leading-snug">
                                        En validant, les stocks seront déduits via FIFO, les alertes DLC activées et les calculs de marge mis à jour.
                                    </p>
                                    <AdviceSaveButton isSaving={isSaving} onSave={handleSaveToStock} />
                                </div>
                                <div className="bg-surface-sidebar border border-border-subtle p-6 rounded-3xl">
                                    <h4 className="text-[10px] font-black text-text-secondary uppercase mb-4 tracking-widest">Impact sur l'Empire</h4>
                                    <div className="space-y-3">
                                        <LogItem label="Marge Calculée" value="+1.4%" trend="up" />
                                        <LogItem label="Fiscalité" value="Signé" trend="ok" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
