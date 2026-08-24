"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Truck, 
    Camera, 
    Plus, 
    Thermometer, 
    PackageCheck, 
    Trash2, 
    ShieldCheck,
    AlertTriangle
} from 'lucide-react';
import { cn } from "@/lib/ui.foundations";;
import { useReceptionLogs, useCreateReceptionLog, useDeleteReceptionLog } from '@nexus/guards/NexusGuardProvider';
import { useNotifications } from '@/shared/contexts/NotificationsContext';
import { BottomSheet } from '@ui/BottomSheet';
import { Button } from '@ui/button';
import { StatusBadge } from '@ui/StatusBadge';
import { CameraCapture } from '@/shared/components/ui/CameraCapture';
import { StorageService } from '@/lib/Storage';
import { useTenant } from '@/shared/hooks';
import { Loader2 } from 'lucide-react';

export function ReceptionMarchandises() {
    const { data: logs = [] } = useReceptionLogs();
    const { mutateAsync: createLog } = useCreateReceptionLog();
    const { mutateAsync: deleteLog } = useDeleteReceptionLog();
    const { addNotification } = useNotifications();
    const { tenantId } = useTenant();

    const [isAdding, setIsAdding] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [formData, setFormData] = useState({

        supplier: '',
        productName: '',
        temperature: 4,
        expirationDate: '',
        batchNumber: '',
        integrityStatus: 'conforme' as 'conforme' | 'non-conforme',
        imageUrl: '',
        user: 'Chef Paul' // Mock user
    });

    const handleSubmit = async () => {
        if (!formData.supplier || !formData.productName) {
            addNotification({ type: 'critical', title: 'Champs manquants', message: 'Veuillez renseigner au moins le fournisseur et le produit.' });
            return;
        }

        setIsUploading(true);
        try {
            let finalImageUrl = formData.imageUrl;

            // Upgrade ephemeral DataURL to permanent Cloud Storage URL
            if (formData.imageUrl && formData.imageUrl.startsWith('data:')) {
                const storagePath = `tenants/${tenantId}/haccp/receptions/${Date.now()}_${formData.supplier}.jpg`;
                finalImageUrl = await StorageService.uploadBase64Image(formData.imageUrl, storagePath);
            }

            await createLog({ 
                ...formData, 
                imageUrl: finalImageUrl,
                receptionDate: new Date().toISOString()
            } as import('@nexus/contracts').ReceptionLog);
            addNotification({ type: 'success', title: 'Réception enregistrée', message: `Le contrôle de ${formData.productName} a été archivé.` });
            setFormData({
                supplier: '',
                productName: '',
                temperature: 4,
                expirationDate: '',
                batchNumber: '',
                integrityStatus: 'conforme',
                imageUrl: '',
                user: 'Chef Paul'
            });
            setIsAdding(false);
        } catch (e) {
            const error = e as Error;
            console.error(error);
            addNotification({ type: 'critical', title: 'Erreur', message: error.message || 'Impossible d\'enregistrer la réception.' });
        } finally {
            setIsUploading(false);
        }
    };


    return (
        <div className="space-y-8 pb-12">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[22px] bg-action-primary/10 text-brand flex items-center justify-center shadow-lg shadow-blue-500/5">
                        <Truck size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-primary dark:text-text-primary tracking-tight uppercase">Réception Marchandises</h2>
                        <p className="text-[10px] font-black text-muted dark:text-secondary uppercase tracking-widest mt-1">Contrôle sanitaire à l'arrivée</p>
                    </div>
                </div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsAdding(true)}
                    className="h-12 px-6 rounded-[24px] bg-text-primary text-bg-primary font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center gap-2"
                >
                    <Plus size={16} />
                    Nouvelle Réception
                </motion.button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {logs.map((log, idx) => (
                        <motion.div
                            key={log.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-bg-primary rounded-[32px] border border-border p-6 relative group overflow-hidden shadow-sm"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-action-primary/5 rounded-full blur-[40px] -mr-16 -mt-16 pointer-events-none" />
                            
                            {log.imageUrl && (
                                <div className="absolute top-4 right-4 w-12 h-12 rounded-xl overflow-hidden border border-border/50 shadow-sm z-20">
                                    <img src={log.imageUrl} alt="Reception" className="w-full h-full object-cover" />
                                </div>
                            )}

                            <div className="flex justify-between items-start mb-6 relative z-10">
                                <div className="w-12 h-12 rounded-2xl bg-bg-tertiary flex items-center justify-center border border-border">
                                    <PackageCheck size={22} className="text-text-muted" />
                                </div>
                                <button
                                    onClick={() => deleteLog(log.id)}
                                    className="w-8 h-8 rounded-full bg-status-danger/10 text-status-danger flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-status-danger hover:text-text-primary"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            <h3 className="text-lg font-serif italic font-black text-text-primary mb-1 truncate">
                                {log.productName}
                            </h3>
                            <div className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-6 border-b border-border pb-4">
                                FOURNISSEUR: {log.supplier}
                            </div>

                            <div className="space-y-4 relative z-10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-action-primary/10 flex items-center justify-center text-brand">
                                            <Thermometer size={14} />
                                        </div>
                                        <span className="text-[10px] font-black uppercase text-text-muted tracking-widest">TEMP.</span>
                                    </div>
                                    <span className={cn(
                                        "text-sm font-black",
                                        log.temperature > 4 ? "text-status-danger" : "text-status-success"
                                    )}>
                                        {log.temperature}°C
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-action-primary/10 flex items-center justify-center text-brand">
                                            <ShieldCheck size={14} />
                                        </div>
                                        <span className="text-[10px] font-black uppercase text-text-muted tracking-widest">INTÉGRITÉ</span>
                                    </div>
                                    <StatusBadge 
                                        status={log.integrityStatus === 'conforme' ? 'success' : 'error'} 
                                        label={log.integrityStatus}
                                    />
                                </div>

                                <div className="pt-4 flex items-center justify-between text-[8px] font-black uppercase tracking-[0.2em] text-text-muted border-t border-border">
                                    <span>Par: {log.user}</span>
                                    <span>{new Date(log.receptionDate).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {logs.length === 0 && (
                    <div className="col-span-1 md:col-span-2 lg:grid-cols-3 py-20 flex flex-col items-center justify-center border border-dashed border-border rounded-[32px] bg-bg-primary/50">
                        <Truck size={48} className="text-text-muted/30 mb-4" />
                        <h3 className="text-xl font-serif italic text-text-muted">Aucune réception enregistrée</h3>
                        <p className="text-chip-label text-text-muted/50 mt-2">Cliquez sur nouvelle réception pour commencer</p>
                    </div>
                )}
            </div>

            <BottomSheet
                isOpen={isAdding}
                onClose={() => setIsAdding(false)}
                title="Contrôle de Réception"
                subtitle="Enregistrez les paramètres sanitaires à la livraison"
            >
                <div className="space-y-6 pt-4 pb-8">
                    {!isCapturing ? (
                        <>
                            <div className="flex justify-center mb-6">
                                <button 
                                    onClick={() => setIsCapturing(true)}
                                    className="w-full h-32 rounded-[32px] bg-bg-tertiary border border-border border-dashed flex flex-col items-center justify-center text-text-muted gap-2 hover:bg-bg-primary transition-colors group relative overflow-hidden"
                                >
                                    {formData.imageUrl ? (
                                        <img src={formData.imageUrl} alt="Capture" className="w-full h-full object-cover" />
                                    ) : (
                                        <>
                                            <Camera size={24} />
                                            <span className="text-chip-label-sm">Photo du Bon / Étiquette</span>
                                        </>
                                    )}
                                    {formData.imageUrl && <div className="absolute inset-0 bg-surface-sidebar/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera size={24} className="text-text-primary" /></div>}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1">Fournisseur</label>
                                    <input
                                        type="text"
                                        value={formData.supplier}
                                        onChange={e => setFormData({ ...formData, supplier: e.target.value })}
                                        placeholder="EX: Transgourmet"
                                        className="w-full h-14 bg-bg-tertiary border border-border rounded-2xl px-4 text-sm font-black outline-none focus:border-accent-gold transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1">Produit</label>
                                    <input
                                        type="text"
                                        value={formData.productName}
                                        onChange={e => setFormData({ ...formData, productName: e.target.value })}
                                        placeholder="EX: Filet de Boeuf"
                                        className="w-full h-14 bg-bg-tertiary border border-border rounded-2xl px-4 text-sm font-black outline-none focus:border-accent-gold transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1">Température (°C)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={formData.temperature}
                                        onChange={e => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                                        className="w-full h-14 bg-bg-tertiary border border-border rounded-2xl px-4 text-sm font-black outline-none focus:border-accent-gold transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1">DLC / DLUO</label>
                                    <input
                                        type="date"
                                        value={formData.expirationDate}
                                        onChange={e => setFormData({ ...formData, expirationDate: e.target.value })}
                                        className="w-full h-14 bg-bg-tertiary border border-border rounded-2xl px-4 text-sm font-black outline-none focus:border-accent-gold transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1 text-center">État du Conditionnement</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setFormData({ ...formData, integrityStatus: 'conforme' })}
                                        className={cn(
                                            "h-14 rounded-2xl border transition-all text-chip-label-sm flex items-center justify-center gap-2",
                                            formData.integrityStatus === 'conforme' 
                                                ? "bg-status-success/10 border-emerald-500 text-status-success" 
                                                : "bg-bg-tertiary border-border text-text-muted"
                                        )}
                                    >
                                        <ShieldCheck size={16} /> Conforme
                                    </button>
                                    <button
                                        onClick={() => setFormData({ ...formData, integrityStatus: 'non-conforme' })}
                                        className={cn(
                                            "h-14 rounded-2xl border transition-all text-chip-label-sm flex items-center justify-center gap-2",
                                            formData.integrityStatus === 'non-conforme' 
                                                ? "bg-status-danger/10 border-rose-500 text-status-danger" 
                                                : "bg-bg-tertiary border-border text-text-muted"
                                        )}
                                    >
                                        <AlertTriangle size={16} /> Non Conforme
                                    </button>
                                </div>
                            </div>

                            <Button
                                onClick={handleSubmit}
                                disabled={isUploading}
                                className="w-full h-16 rounded-[24px] text-chip-label shadow-xl transition-all bg-action-primary text-text-primary hover:bg-action-primary border border-focus/20"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 size={16} className="mr-2 animate-spin" />
                                        Enregistrement...
                                    </>
                                ) : (
                                    'Valider la Réception'
                                )}
                            </Button>

                        </>
                    ) : (
                        <CameraCapture 
                            onCapture={(img) => { setFormData({...formData, imageUrl: img}); setIsCapturing(false); }}
                            onClose={() => setIsCapturing(false)}
                            title="Photo de Livraison"
                        />
                    )}
                </div>
            </BottomSheet>
        </div>
    );
}
