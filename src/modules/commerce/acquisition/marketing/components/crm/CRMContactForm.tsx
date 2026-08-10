"use client";

import React from 'react';
import { useAtom } from 'jotai';
import { crmFormAtom, crmNewCRMModalAtom } from '../../store/crmAtoms';
import { motion } from 'framer-motion';
import { useLanguage } from '@/shared/hooks';
import { Button } from '@ui/button';
import { BottomSheet } from '@ui/BottomSheet';
import { useIsMobile } from '@/shared/hooks';
import { JsonObject } from "@/shared/types/json";

export function CRMContactForm() {
    const { t } = useLanguage();
    const isMobile = useIsMobile();
    const [showModal, setShowModal] = useAtom(crmNewCRMModalAtom);
    const [formState, setFormState] = useAtom(crmFormAtom);

    const updateField = (field: keyof typeof formState, value: string) => {
        setFormState(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!formState.name) return;
        try {
            const { Nexus } = await import('@/lib/nexus/NexusAdapter');
            const { activeTenantIdAtom } = await import('@/store/tenantAtoms');
            const { getDefaultStore } = await import('jotai');
            const tenantId = getDefaultStore().get(activeTenantIdAtom);
            const { createCustomerAction } = await import('../../../../actions/marketing.action');
            
            const id = `crm_${Date.now()}`;
            await createCustomerAction(tenantId ?? '', id, {
                id,
                name: formState.name,
                phone: formState.phone,
                notes: formState.notes,
                tags: (formState as { tags?: string[] }).tags as string[] || [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            setShowModal(false);
            setFormState(prev => ({ ...prev, name: '', phone: '', notes: '' }));
        } catch {
            setShowModal(false);
        }
    };

    const formContent = (
        <div className="space-y-8 py-6">
            <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-text-muted px-2">
                    {t('crm.full_name') || 'Nom Complet'}
                </label>
                <input 
                    type="text" 
                    className="w-full h-14 bg-bg-tertiary rounded-2xl px-6 font-bold text-text-primary outline-none focus:ring-2 ring-accent-gold/20 transition-all" 
                    placeholder="JEAN DUPONT" 
                    value={formState.name} 
                    onChange={e => updateField('name', e.target.value)} 
                />
            </div>
            <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-text-muted px-2">
                    {t('crm.phone') || 'Téléphone'}
                </label>
                <input 
                    type="tel" 
                    className="w-full h-14 bg-bg-tertiary rounded-2xl px-6 font-bold text-text-primary outline-none focus:ring-2 ring-accent-gold/20 transition-all" 
                    placeholder="+33 6..." 
                    value={formState.phone} 
                    onChange={e => updateField('phone', e.target.value)} 
                />
            </div>
            <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-text-muted px-2">
                    {t('crm.notes') || 'Commentaires'}
                </label>
                <textarea 
                    className="w-full h-32 bg-bg-tertiary rounded-2xl p-6 font-bold text-text-primary outline-none focus:ring-2 ring-accent-gold/20 transition-all resize-none" 
                    placeholder="Allergies, Préférences..." 
                    value={formState.notes} 
                    onChange={e => updateField('notes', e.target.value)} 
                />
            </div>
            <Button 
                onClick={handleSave} 
                className="w-full h-16 bg-success hover:bg-success/90 text-text-primary rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all"
            >
                {t('crm.approve_profile') || 'Homologuer Profil'}
            </Button>
        </div>
    );

    if (isMobile) {
        return (
            <BottomSheet
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={t('crm.new_profile') || 'Nouveau Profil'}
                size="full"
            >
                {formContent}
            </BottomSheet>
        );
    }

    // Modal logic for desktop can be wrapped here or managed by the parent
    // For now, we return null if not mobile and let the page handle the modal wrapper if needed
    // But actually, it's better to keep it consistent.
    if (!showModal) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 md:p-12">
            <div className="absolute inset-0 bg-surface-sidebar/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-bg-secondary w-full max-w-lg rounded-[3rem] p-12 relative z-10 shadow-3xl border border-subtle"
            >
                <h2 className="text-4xl font-serif italic text-text-primary mb-8 tracking-tight">
                    {t('crm.new_profile') || 'Nouveau Profil'}
                </h2>
                {formContent}
            </motion.div>
        </div>
    );
}
