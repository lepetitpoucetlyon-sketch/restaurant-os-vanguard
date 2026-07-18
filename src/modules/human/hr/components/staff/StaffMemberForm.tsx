"use client";

import React, { useState } from "react";
import { useAuth } from "@/hooks";
import { User, UserRole } from "@nexus/contracts";
import { Button } from "@ui/button";
import { Modal, PremiumSelect, SecurityPinModal } from "@ui";
import { useToast } from "@ui/Toast";

const ROLES = [
    { value: 'admin', label: 'Administrateur' },
    { value: 'manager', label: 'Directeur' },
    { value: 'floor_manager', label: 'Responsable de salle' },
    { value: 'server', label: 'Serveur(se)' },
    { value: 'bartender', label: 'Barman/Barmaid' },
    { value: 'kitchen_chef', label: 'Chef de cuisine' },
    { value: 'kitchen_line', label: 'Commis de cuisine' },
    { value: 'host', label: 'Hôte(sse) d\'accueil' },
    { value: 'cashier', label: 'Caissier(ère)' },
];

interface StaffMemberFormProps {
    isOpen: boolean;
    onClose: () => void;
    editingUser?: User | null;
    /** Pre-fill fields when creating a new user (e.g. promoted from recruitment) */
    prefillData?: { name?: string; role?: UserRole };
}

export const StaffMemberForm = ({ isOpen, onClose, editingUser, prefillData }: StaffMemberFormProps) => {
    const { updateUser, addUser, deleteUser, canDo, logAction } = useAuth();
    const { showToast } = useToast();
    const [showSecurityModal, setShowSecurityModal] = useState(false);
    
    // ✅ Grade VI: Form data initialized from editingUser.
    // Parent should use key={editingUser?.id ?? 'new'} to reset this
    // component when the target changes, avoiding setState-in-effect.
    const defaultFormData = React.useMemo(() => editingUser ? {
        name: editingUser.name,
        role: editingUser.role,
        pin: '',
        avatar: editingUser.avatar || '',
        hourlyRate: editingUser.hourlyRate || 15,
    } : {
        name: prefillData?.name ?? '',
        role: prefillData?.role ?? ('server' as UserRole),
        pin: '',
        avatar: '',
        hourlyRate: 15,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editingUser, prefillData?.name, prefillData?.role]);

    const [formData, setFormData] = useState(defaultFormData);

    const handleSaveStaff = async () => {
        if (!formData.name) {
            showToast("Le nom est requis", "error");
            return;
        }
        if (editingUser && formData.pin && formData.pin.length !== 4) {
            showToast("Le nouveau code PIN doit contenir exactement 4 chiffres.", "error");
            return;
        }
        if (!editingUser && formData.pin.length !== 4) {
            showToast("Un code PIN à 4 chiffres est requis pour créer un collaborateur.", "error");
            return;
        }
        
        try {
            if (editingUser) {
                await updateUser?.(editingUser.id, {
                    name: formData.name,
                    role: formData.role,
                    avatar: formData.avatar,
                    hourlyRate: formData.hourlyRate,
                    ...(formData.pin ? { pin: formData.pin } : {}),
                });
                await logAction?.('modify_employee', { name: formData.name });
                showToast("Collaborateur mis à jour", "success");
            } else {
                await addUser?.({
                    ...formData,
                    performanceScore: 5.0,
                    accessLevel: 3,
                });
                await logAction?.('create_employee', { name: formData.name });
                showToast("Nouveau collaborateur ajouté", "success");
            }
            onClose();
        } catch (_error) {
            showToast("Erreur lors de l'enregistrement", "error");
        }
    };
 
    const confirmDeleteStaff = async () => {
        if (editingUser) {
            await deleteUser?.(editingUser.id);
            await logAction?.('delete_employee', { name: editingUser.name });
            showToast("Profil supprimé", "success");
            onClose();
        }
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title={editingUser ? "Édition Collaborateur" : "Ajout Collaborateur"}
            >
                <div className="space-y-6">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Nom Complet</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                            className="w-full h-14 px-6 bg-bg-tertiary rounded-xl border border-border focus:border-accent outline-none font-bold"
                            placeholder="Identification requise"
                        />
                    </div>
                    <div className="space-y-4">
                        <PremiumSelect
                            label="Rôle & Responsabilités"
                            value={formData.role}
                            onChange={(val) => setFormData(p => ({ ...p, role: val as UserRole }))}
                            options={ROLES}
                        />
                    </div>
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Code PIN (4 chiffres)</label>
                        <input
                            type="password"
                            maxLength={4}
                            value={formData.pin}
                            onChange={(e) => setFormData(p => ({ ...p, pin: e.target.value }))}
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className="w-full h-14 px-6 bg-bg-tertiary rounded-xl border border-border focus:border-accent outline-none font-mono text-2xl tracking-[0.5em] font-bold"
                            placeholder={editingUser ? "Laisser vide pour conserver" : "4 chiffres requis"}
                        />
                    </div>
                    <div className="pt-6 flex gap-4">
                        {editingUser && canDo('delete_employee') && (
                            <Button
                                variant="outline"
                                className="flex-1 h-14 border-error text-error hover:bg-error/5"
                                onClick={() => setShowSecurityModal(true)}
                            >
                                Supprimer
                            </Button>
                        )}
                        <Button
                            className="flex-[2] h-14 bg-accent hover:bg-surface-sidebar text-white rounded-xl font-bold uppercase text-[11px] tracking-widest transition-all"
                            onClick={handleSaveStaff}
                        >
                            {editingUser ? "Mettre à jour" : "Recruter"}
                        </Button>
                    </div>
                </div>
            </Modal>

            <SecurityPinModal
                isOpen={showSecurityModal}
                onClose={() => setShowSecurityModal(false)}
                onSuccess={confirmDeleteStaff}
                title="Validation Suppression"
                description={`La suppression de ${editingUser?.name} nécessite une validation manager.`}
            />
        </>
    );
};
