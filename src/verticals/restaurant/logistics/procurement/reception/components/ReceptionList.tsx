import { motion } from 'framer-motion';
import { FileText, ShieldAlert, CheckCircle2, ChevronRight } from 'lucide-react';
import { ScannedItem } from './InventoryReceptionTypes';

interface ReceptionListProps {
    scanResult: ScannedItem[];
    onCancel: () => void;
    onContinue: () => void;
}

export function ReceptionList({ scanResult, onCancel, onContinue }: ReceptionListProps) {
    return (
        <motion.div 
            key="verify-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
        >
            <div className="bg-[#161618] border border-border-subtle rounded-3xl p-8">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <FileText className="text-action-primary" />
                        Données Extraites (OCR)
                    </h2>
                    <span className="text-[10px] font-black bg-action-primary text-action-primary px-3 py-1 rounded-full uppercase tracking-widest">Confidence 98.4%</span>
                </div>

                <div className="space-y-4">
                    {scanResult.map((item, idx) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-[#0a0a0b] rounded-2xl border border-border-subtle group hover:border-emerald-500/30 transition-all">
                        <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-surface-card rounded-xl flex items-center justify-center font-bold text-xs">{(idx+1).toString().padStart(2, '0')}</div>
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
                <button onClick={onCancel} className="px-8 py-4 font-bold text-text-secondary uppercase tracking-widest">Annuler</button>
                <button onClick={onContinue} className="bg-action-primary px-10 py-5 rounded-2xl font-black uppercase shadow-lg shadow-indigo-600/20 hover:bg-action-primary transition-all flex items-center gap-3">
                Continuer vers le Stockage
                <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </motion.div>
    );
}
