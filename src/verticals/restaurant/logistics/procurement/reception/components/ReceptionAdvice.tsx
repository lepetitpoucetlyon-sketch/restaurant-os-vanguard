import { motion } from 'framer-motion';
import { Thermometer, AlertCircle, Save } from 'lucide-react';

interface ReceptionAdviceProps {
    isSaving: boolean;
    handleSaveToStock: () => void;
}

function AdviceSaveButton({ isSaving, onSave }: { isSaving: boolean; onSave: () => void }) {
    return (
        <button onClick={onSave} disabled={isSaving} className="w-full bg-surface-bg text-text-primary py-5 rounded-2xl font-black uppercase text-sm flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50">
            {isSaving ? (
                <span className="animate-pulse">Synchronisation...</span>
            ) : (
                <><Save className="w-5 h-5" />Sceller &amp; Stocker</>
            )}
        </button>
    );
}

function LogItem({ label, value, trend }: { label: string, value: string, trend: 'up' | 'ok' }) {
    return (
        <div className="flex justify-between items-center text-[10px] font-bold">
            <span className="text-text-secondary uppercase tracking-tighter">{label}</span>
            <span className={trend === 'up' ? 'text-status-success' : 'text-action-primary'}>{value}</span>
        </div>
    );
}

export function ReceptionAdvice({ isSaving, handleSaveToStock }: ReceptionAdviceProps) {
    return (
        <motion.div 
            key="advice-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
            <div className="md:col-span-2 space-y-6">
                <div className="bg-[#161618] border border-border-default rounded-3xl p-8">
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
                                className="w-full bg-[#0a0a0b]/50 border-none focus:ring-0 text-text-secondary placeholder:text-text-secondary resize-none h-24 font-medium"
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

                <div className="bg-[#161618] border border-border-subtle p-6 rounded-3xl">
                    <h4 className="text-[10px] font-black text-text-secondary uppercase mb-4 tracking-widest">Impact sur l'Empire</h4>
                    <div className="space-y-3">
                        <LogItem label="Marge Calculée" value="+1.4%" trend="up" />
                        <LogItem label="Fiscalité" value="Signé" trend="ok" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
