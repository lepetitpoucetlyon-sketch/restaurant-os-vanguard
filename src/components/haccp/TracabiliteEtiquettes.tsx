// @ts-nocheck
"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Tags,
    Camera,
    Plus,
    PackageSearch,
    CalendarClock,
    Box,
    Trash2
} from 'lucide-react';
import { cn } from "@/lib/ui.foundations";;
import { useHygieneLabels, useCreateHygieneLabel, useDeleteHygieneLabel } from '@/engines/guard/NexusGuardProvider';
import { useNotifications } from '@/context/NotificationsContext';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CameraCapture } from './CameraCapture';
import { StorageService } from '@/lib/StorageService';
import { useTenant } from '@/context/TenantContext';
import { Loader2 } from 'lucide-react';

export function TracabiliteEtiquettes() {
    const { data: labels = [] } = useHygieneLabels();
    const { mutateAsync: createLabel } = useCreateHygieneLabel();
    const { mutateAsync: deleteLabel } = useDeleteHygieneLabel();
    const { addNotification } = useNotifications();
    const { tenantId } = useTenant();

    const [isAdding, setIsAdding] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [nowTimestamp] = useState(() => Date.now());


    const [formData, setFormData] = useState({
        productName: '',
        batchNumber: '',
        expirationDate: '',
        supplier: '',
        storageLocation: 'Stockage Froid',
        imageUrl: ''
    });

    const handleSubmit = async () => {
        if (!formData.productName || !formData.batchNumber) {
            addNotification({ type: 'error', title: 'Erreur', message: 'Veuillez remplir le nom du produit et le numéro de lot.' });
            return;
        }

        setIsUploading(true);
        try {
            let finalImageUrl = formData.imageUrl;

            // If we have a base64 image, upload it to Storage
            if (formData.imageUrl && formData.imageUrl.startsWith('data:')) {
                const storagePath = `tenants/${tenantId}/haccp/labels/${Date.now()}_${formData.batchNumber}.jpg`;
                finalImageUrl = await StorageService.uploadBase64Image(formData.imageUrl, storagePath);
            }

            await createLabel({ ...formData, imageUrl: finalImageUrl });
            addNotification({ type: 'success', title: 'Étiquette scannée', message: 'La traçabilité de ce produit a été enregistrée.' });
            setFormData({
                productName: '',
                batchNumber: '',
                expirationDate: '',
                supplier: '',
                storageLocation: 'Stockage Froid',
                imageUrl: ''
            });
            setIsAdding(false);
        } catch (e: any) {
            console.error(e);
            addNotification({ type: 'error', title: 'Erreur d\'envoi', message: e.message || 'Impossible d\'enregistrer l\'étiquette.' });
        } finally {
            setIsUploading(false);
        }
    };


    const handleDelete = async (id: string) => {
        try {
            await deleteLabel(id);
            addNotification({ type: 'success', title: 'Produit retiré', message: 'L\'étiquette a été supprimée de l\'historique.' });
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="space-y-8 pb-12">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[22px] bg-purple-500/10 text-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/5">
                        <Tags size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Traçabilité & DLC</h2>
                        <p className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-1">Numérisation des étiquettes sanitaires</p>
                    </div>
                </div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsAdding(true)}
                    className="h-12 px-6 rounded-[24px] bg-text-primary text-bg-primary font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center gap-2"
                >
                    <Camera size={16} />
                    Scanner Étiquette
                </motion.button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {labels.map((label, idx) => {
                        const lastLog = (label as any).logs && (label as any).logs.length > 0 ? (label as any).logs[(label as any).logs.length - 1] : null;
                        return (
                            <motion.div
                                key={label.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-bg-primary rounded-[32px] border border-border p-6 relative group overflow-hidden shadow-sm"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-[40px] -mr-16 -mt-16 pointer-events-none" />

                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <div className="w-12 h-12 rounded-2xl bg-bg-tertiary flex items-center justify-center border border-border relative overflow-hidden">
                                        {lastLog ? (
                                            <StatusBadge status={lastLog.status === 'ok' ? 'success' : lastLog.status === 'warning' ? 'warning' : 'error'} label={lastLog.status} />
                                        ) : label.imageUrl ? (
                                            <img src={label.imageUrl} alt="Étiquette" className="w-full h-full object-cover" />
                                        ) : (
                                            <PackageSearch size={22} className="text-text-muted" />
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleDelete(label.id)}
                                        className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                <h3 className="text-lg font-serif italic font-black text-text-primary mb-1 truncate">
                                    {label.productName}
                                </h3>
                                <div className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-6 border-b border-border pb-4">
                                    FOURNISSEUR: {label.supplier || 'NON SPÉCIFIÉ'}
                                </div>

                                <div className="space-y-4 relative z-10">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center text-text-muted">
                                                <Tags size={14} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase text-text-muted tracking-widest">LOT</span>
                                        </div>
                                        <span className="text-sm font-black font-mono bg-bg-tertiary px-3 py-1 rounded-lg border border-border">
                                            {label.batchNumber}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                                                <CalendarClock size={14} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase text-text-muted tracking-widest">DLC</span>
                                        </div>
                                        <span className={cn(
                                            "text-xs font-black uppercase tracking-widest",
                                            new Date(label.expirationDate).getTime() < nowTimestamp ? "text-rose-500" : "text-amber-500"
                                        )}>
                                            {new Date(label.expirationDate).toLocaleDateString('fr-FR')}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                                                <Box size={14} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase text-text-muted tracking-widest">ZONE</span>
                                        </div>
                                        <span className="text-[10px] font-black text-text-primary uppercase tracking-widest text-right truncate pl-4">
                                            {label.storageLocation}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {labels.length === 0 && (
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 py-20 flex flex-col items-center justify-center border border-dashed border-border rounded-[32px] bg-bg-primary/50">
                        <Tags size={48} className="text-text-muted/30 mb-4" />
                        <h3 className="text-xl font-serif italic text-text-muted">Aucune étiquette scannée aujourd'hui</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 mt-2">Utilisez le bouton scanner pour enregistrer une traçabilité</p>
                    </div>
                )}
            </div>

            <BottomSheet
                isOpen={isAdding}
                onClose={() => setIsAdding(false)}
                title="Scanner Étiquette"
                subtitle="Enregistrement d'étiquette de traçabilité"
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
                                            <Camera size={32} />
                                            <span className="text-[8px] font-black uppercase tracking-widest">Scanner OCR / Photo</span>
                                        </>
                                    )}
                                    {formData.imageUrl && <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera size={24} className="text-white" /></div>}
                                </button>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1">Produit</label>
                                <input
                                    type="text"
                                    value={formData.productName}
                                    onChange={e => setFormData({ ...formData, productName: e.target.value })}
                                    placeholder="EX: Saumon Fumé tranché"
                                    className="w-full h-14 bg-bg-tertiary border border-border rounded-2xl px-4 text-sm font-black outline-none focus:border-accent-gold transition-colors"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1">N° de Lot</label>
                                    <input
                                        type="text"
                                        value={formData.batchNumber}
                                        onChange={e => setFormData({ ...formData, batchNumber: e.target.value })}
                                        placeholder="EX: L-239401"
                                        className="w-full h-14 bg-bg-tertiary border border-border rounded-2xl px-4 text-sm font-mono font-black outline-none focus:border-accent-gold transition-colors"
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

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1">Fournisseur</label>
                                <input
                                    type="text"
                                    value={formData.supplier}
                                    onChange={e => setFormData({ ...formData, supplier: e.target.value })}
                                    placeholder="EX: METRO"
                                    className="w-full h-14 bg-bg-tertiary border border-border rounded-2xl px-4 text-sm font-black outline-none focus:border-accent-gold transition-colors"
                                />
                            </div>

                            <Button
                                onClick={handleSubmit}
                                disabled={isUploading}
                                className="w-full h-16 rounded-[24px] text-[10px] font-black uppercase tracking-widest shadow-xl transition-all bg-purple-500 text-white hover:bg-purple-600 border border-purple-500/20"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 size={16} className="mr-2 animate-spin" />
                                        Téléchargement...
                                    </>
                                ) : (
                                    'Valider la Traçabilité'
                                )}
                            </Button>

                        </>
                    ) : (
                        <CameraCapture 
                            onCapture={(img) => { setFormData({...formData, imageUrl: img}); setIsCapturing(false); }}
                            onClose={() => setIsCapturing(false)}
                            title="Capture de l'Étiquette"
                        />
                    )}
                </div>
            </BottomSheet>
        </div>
    );
}
