'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ClipboardList } from 'lucide-react';
import { toast } from 'sonner';

 
import { useNexusOps } from '@/legacy_monolith/ops/providers/NexusOpsProvider';
import { ScannedItem } from './InventoryReceptionTypes';
import { runOcrScan, persistReception } from './InventoryReceptionService';
import { BarcodeScannerMode } from './BarcodeScannerMode';
import { InvoiceScannerPanel } from './InvoiceScannerPanel';
import { ReceptionList } from './ReceptionList';
import { ReceptionAdvice } from './ReceptionAdvice';

export function InventoryReceptionDashboard() {
  const { tenantId } = useNexusOps();
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [scanResult, setScanResult] = useState<ScannedItem[] | null>(null);
  const [activeStep, setActiveStep] = useState<'scan' | 'verify' | 'advice'>('scan');

  const handleScan = async () => {
    if (!tenantId) return;
    setIsScanning(true);
    try {
        const results = await runOcrScan(tenantId);
        if (results.length === 0) {
            toast.warning("Aucun ingrédient correspondant dans le référentiel. Utilisation du mode Ingestion Directe.");
            setScanResult([{ id: 'new-1', name: 'Saumon (Non Référencé)', qty: 5, unit: 'kg', price: 125.00, dlc: '2026-04-20', forceScan: true }]);
        } else {
            setScanResult(results);
        }
        setActiveStep('verify');
    } catch (error) {
        console.error('Scan error:', error);
        toast.error('Erreur lors du scan intelligent.');
    } finally {
        setIsScanning(false);
    }
  };

  const handleSaveToStock = async () => {
    if (!tenantId || !scanResult) return;
    setIsSaving(true);
    try {
        await persistReception(tenantId, scanResult);
        toast.success('Stock mis à jour avec succès !');
        setActiveStep('scan');
        setScanResult(null);
    } catch (error) {
        console.error('Failed to save stock:', error);
        toast.error('Erreur lors de la sauvegarde du stock.');
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-text-primary p-6 md:p-10 font-ui">
      {/* ── log-5: Barcode scan strip ───────────────────────────────────────── */}
      <BarcodeScannerMode />

      {/* Header */}
      <header className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-status-success border border-emerald-500/20 rounded-2xl flex items-center justify-center">
            <ClipboardList className="text-status-success w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase">Réception Marchandise</h1>
            <p className="text-text-secondary text-xs font-bold tracking-widest uppercase">Flux Empire • Ingestion Intelligente</p>
          </div>
        </div>

        <div className="flex bg-[#161618] p-1 rounded-xl border border-border-subtle">
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
              <InvoiceScannerPanel isScanning={isScanning} onScan={handleScan} />
            </motion.div>
          )}

          {activeStep === 'verify' && scanResult && (
            <ReceptionList 
                scanResult={scanResult} 
                onCancel={() => setActiveStep('scan')} 
                onContinue={() => setActiveStep('advice')} 
            />
          )}

          {activeStep === 'advice' && (
            <ReceptionAdvice 
                isSaving={isSaving} 
                handleSaveToStock={handleSaveToStock} 
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function StepIndicator({ step, active, label }: { step: string, active: boolean, label: string }) {
    return (
        <div className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${active ? 'bg-action-primary text-text-primary shadow-lg' : 'text-text-secondary'}`}>
            <span className="opacity-50">{step === 'scan' ? '01' : step === 'verify' ? '02' : '03'}</span>
            {label}
        </div>
    );
}
