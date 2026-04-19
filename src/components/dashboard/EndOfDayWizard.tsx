"use client";

import React, { useState } from 'react';
import { useAtomValue } from 'jotai';
import { dashboardRevenueSelector, dashboardActiveTablesSelector } from '@/store/dashboardAtoms';
import { FinanceCore } from '@/domain/services/FinanceCore';
import { useTenant } from '@/engines/core/NexusCoreProvider';
import { useToast } from '@/components/ui/Toast';
import { 
    CheckCircle2, 
    Lock, 
    FileText, 
    AlertCircle,
    Loader2
} from 'lucide-react';

/**
 * 🏁 END OF DAY WIZARD - Grade VI
 * Final validation step for NF525 and HACCP.
 * Closes the day, generates the Z-Report and seals the ledger.
 */
export const EndOfDayWizard: React.FC = () => {
    const { activeTenantId } = useTenant();
    const { showToast } = useToast();
    const [isClosing, setIsClosing] = useState(false);
    const [isClosed, setIsClosed] = useState(false);

    const revenue = useAtomValue(dashboardRevenueSelector);
    const activeTables = useAtomValue(dashboardActiveTablesSelector);

    const handleClosure = async () => {
        if (!activeTenantId) return;
        if (activeTables > 0) {
            showToast("Impossible de clôturer : des tables sont encore actives.", "error");
            return;
        }

        setIsClosing(true);
        try {
            // 📡 Industrial Call to FinanceCore (Grade VI)
            const zReport = await FinanceCore.generateZReport(activeTenantId);
            
            showToast(`Journée Clôturée. Z-Report Scellé : ${zReport._fiscalSeal.hash.substring(0, 10)}`, "success");
            setIsClosed(true);
        } catch (error) {
            showToast("Erreur lors de la clôture fiscale", "error");
        } finally {
            setIsClosing(false);
        }
    };

    if (isClosed) {
        return (
            <div className="p-8 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center">
                <CheckCircle2 className="mx-auto text-emerald-400 mb-4" size={48} />
                <h2 className="text-xl font-bold text-white mb-2">Journée Clôturée</h2>
                <p className="text-emerald-400/70 text-sm mb-6">
                    Tous les registres fiscaux ont été scellés et archivés (NF525).
                </p>
                <button className="px-6 py-2 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors">
                    Télécharger le Rapport Z
                </button>
            </div>
        );
    }

    return (
        <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
                    <Lock size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">Clôture de Journée</h2>
                    <p className="text-slate-400 text-sm">Certification NF525 & HACCP</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                    <p className="text-xs text-slate-500 uppercase font-bold mb-1">CA à Sceller</p>
                    <p className="text-lg font-bold text-white">{(revenue / 100).toFixed(2)} €</p>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                    <p className="text-xs text-slate-500 uppercase font-bold mb-1">État Tables</p>
                    <p className={`text-lg font-bold ${activeTables > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {activeTables > 0 ? `${activeTables} Active(s)` : 'Toutes closes'}
                    </p>
                </div>
            </div>

            {activeTables > 0 && (
                <div className="flex items-center gap-2 p-3 bg-rose-500/10 text-rose-400 rounded-lg text-xs mb-6">
                    <AlertCircle size={16} />
                    <span>Attention : Vous ne pouvez pas clôturer avec des tables ouvertes.</span>
                </div>
            )}

            <button 
                onClick={handleClosure}
                disabled={isClosing || activeTables > 0}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-white text-slate-900 rounded-xl font-black text-lg hover:bg-slate-200 transition-all disabled:opacity-50 disabled:grayscale"
            >
                {isClosing ? <Loader2 className="animate-spin" /> : <FileText size={20} />}
                GÉNÉRER LE Z DE CAISSE
            </button>

            <p className="mt-4 text-[10px] text-slate-500 text-center uppercase tracking-widest leading-relaxed">
                En cliquant, vous certifiez l'exactitude des données de vente <br/> conformément à la norme NF525.
            </p>
        </div>
    );
};
