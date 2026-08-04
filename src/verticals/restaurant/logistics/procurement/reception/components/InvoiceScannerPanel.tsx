import { motion } from 'framer-motion';
import { Camera, ScanLine } from 'lucide-react';

interface InvoiceScannerPanelProps {
    isScanning: boolean;
    onScan: () => void;
}

export function InvoiceScannerPanel({ isScanning, onScan }: InvoiceScannerPanelProps) {
    return (
        <div className="w-full aspect-video md:aspect-[21/9] bg-[#161618] rounded-[2.5rem] border-2 border-dashed border-border-default flex flex-col items-center justify-center relative overflow-hidden group">
            {isScanning ? (
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
            )}
        </div>
    );
}
