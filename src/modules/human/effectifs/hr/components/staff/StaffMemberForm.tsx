"use client";

import React, { useState } from "react";
import { useAuth } from "@/shared/providers/NexusCoreContext";
import { User, UserRole } from "@nexus/contracts";
import { Button } from "@ui/Button";
import { Modal } from "@ui/Modal";
import { PremiumSelect } from "@ui/PremiumSelect";
import { SecurityPinModal } from "@ui/SecurityPinModal";
import { useToast } from "@ui/Toast";
import { ContractorSelfBillingService } from "../../../../services/ContractorSelfBillingService";
import { Briefcase, UserCheck, ShieldCheck, FileCheck } from "lucide-react";
import { cn } from "@/lib/ui.foundations";

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

const CONTRACT_TYPES = [
    { value: 'cdi_39h', label: 'CDI 39h (Convention HCR)' },
    { value: 'cdi_35h', label: 'CDI 35h' },
    { value: 'cdd', label: 'CDD Saisonnier / Renfort' },
    { value: 'extra_cddu', label: 'Extra Salarié (CDDU HCR)' },
    { value: 'apprenti', label: 'Apprenti / Alternant' },
    { value: 'stage', label: 'Stagiaire' },
];

const VAT_REGIMES = [
    { value: 'franchise_art_293b', label: 'Franchise en base (Art. 293 B du CGI - Sans TVA)' },
    { value: 'vat_standard_20', label: 'Assujetti TVA standard (20%)' },
    { value: 'vat_exempt', label: 'Exonéré de TVA' },
];

interface StaffMemberFormProps {
    isOpen: boolean;
    onClose: () => void;
    editingUser?: User | null;
    prefillData?: { name?: string; role?: UserRole };
}

interface StaffFormData {
    name: string;
    role: UserRole;
    pin: string;
    avatar: string;
    hourlyRate: number;
    contractType: string;
    employmentStatus: string;
    companyName: string;
    siret: string;
    vatRegime: 'franchise_art_293b' | 'vat_standard_20' | 'vat_exempt';
    vatNumber: string;
    iban: string;
    selfBillingAgreed: boolean;
    urssafVigilanceCertificateUrl: string;
}

export const StaffMemberForm = ({ isOpen, onClose, editingUser, prefillData }: StaffMemberFormProps) => {
    const { updateUser, addUser, deleteUser, canDo, logAction } = useAuth();
    const { showToast } = useToast();
    const [showSecurityModal, setShowSecurityModal] = useState(false);
    
    const [statusType, setStatusType] = useState<'employee' | 'contractor'>(
        editingUser?.employmentStatus === 'contractor' || editingUser?.contractType === 'freelance'
            ? 'contractor'
            : 'employee'
    );

    const defaultFormData: StaffFormData = React.useMemo(() => editingUser ? {
        name: editingUser.name,
        role: editingUser.role as UserRole,
        pin: '',
        avatar: editingUser.avatar || '',
        hourlyRate: editingUser.hourlyRateInMicrounits ? (editingUser.hourlyRateInMicrounits / 1_000_000) : (editingUser.hourlyRate || 15),
        contractType: editingUser.contractType || 'cdi_39h',
        employmentStatus: editingUser.employmentStatus || 'employee',
        companyName: editingUser.contractorProfile?.companyName || '',
        siret: editingUser.contractorProfile?.siret || '',
        vatRegime: (editingUser.contractorProfile?.vatRegime as StaffFormData['vatRegime']) || 'franchise_art_293b',
        vatNumber: editingUser.contractorProfile?.vatNumber || '',
        iban: editingUser.contractorProfile?.iban || '',
        selfBillingAgreed: editingUser.contractorProfile?.selfBillingAgreed ?? true,
        urssafVigilanceCertificateUrl: editingUser.contractorProfile?.urssafVigilanceCertificateUrl || '',
    } : {
        name: prefillData?.name ?? '',
        role: prefillData?.role ?? ('server' as UserRole),
        pin: '',
        avatar: '',
        hourlyRate: 15,
        contractType: 'cdi_39h',
        employmentStatus: 'employee',
        companyName: '',
        siret: '',
        vatRegime: 'franchise_art_293b',
        vatNumber: '',
        iban: '',
        selfBillingAgreed: true,
        urssafVigilanceCertificateUrl: '',
    }, [editingUser, prefillData?.name, prefillData?.role]);

    const [formData, setFormData] = useState<StaffFormData>(defaultFormData);

    const isSiretValid = statusType === 'contractor' && formData.siret.length > 0
        ? ContractorSelfBillingService.validateSiretLuhn(formData.siret)
        : true;

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
        if (statusType === 'contractor' && formData.siret && !isSiretValid) {
            showToast("Le numéro SIRET saisi est invalide (clé de contrôle Luhn incorrecte).", "error");
            return;
        }
        
        try {
            const hourlyRateInMu = Math.round(formData.hourlyRate * 1_000_000);
            const userPayload: Partial<User> = {
                name: formData.name,
                role: formData.role,
                avatar: formData.avatar,
                hourlyRate: formData.hourlyRate,
                hourlyRateInMicrounits: hourlyRateInMu,
                employmentStatus: statusType,
                contractType: statusType === 'contractor' ? 'freelance' : (formData.contractType as User['contractType']),
                contractorProfile: statusType === 'contractor' ? {
                    companyName: formData.companyName || formData.name,
                    siret: formData.siret.replace(/\s+/g, ''),
                    vatRegime: formData.vatRegime,
                    vatNumber: formData.vatNumber,
                    billingRateType: 'hourly',
                    rateInMicrounits: hourlyRateInMu,
                    selfBillingAgreed: formData.selfBillingAgreed,
                    iban: formData.iban,
                    urssafVigilanceCertificateUrl: formData.urssafVigilanceCertificateUrl,
                } : undefined,
                ...(formData.pin ? { pin: formData.pin } : {}),
            };

            if (editingUser) {
                await updateUser?.(editingUser.id, userPayload);
                await logAction?.('modify_employee', { name: formData.name, statusType });
                showToast("Collaborateur mis à jour", "success");
            } else {
                await addUser?.({
                    ...userPayload,
                    performanceScore: 5.0,
                    accessLevel: 3,
                } as unknown as Parameters<NonNullable<typeof addUser>>[0]);
                await logAction?.('create_employee', { name: formData.name, statusType });
                showToast(statusType === 'contractor' ? "Nouveau prestataire freelance enregistré" : "Nouveau collaborateur ajouté", "success");
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
                title={editingUser ? "Édition Profil Collaborateur" : "Nouveau Collaborateur"}
            >
                <div className="space-y-6">
                    {/* Segmented Status Selector */}
                    <div className="flex bg-surface-card dark:bg-bg-secondary p-1 rounded-xl border border-border">
                        <button
                            type="button"
                            onClick={() => setStatusType('employee')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                                statusType === 'employee'
                                    ? "bg-action-primary text-text-on-primary shadow-sm"
                                    : "text-text-muted hover:text-text-primary"
                            )}
                        >
                            <UserCheck className="w-4 h-4" />
                            Salarié HCR
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusType('contractor')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                                statusType === 'contractor'
                                    ? "bg-action-primary text-text-on-primary shadow-sm"
                                    : "text-text-muted hover:text-text-primary"
                            )}
                        >
                            <Briefcase className="w-4 h-4" />
                            Auto-Entrepreneur / Freelance
                        </button>
                    </div>

                    {/* Basic Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-nano font-black text-text-muted uppercase tracking-[0.2em]">Nom Complet</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                                className="w-full h-12 px-4 bg-bg-tertiary rounded-xl border border-border focus:border-action-primary outline-none font-bold text-sm"
                                placeholder="ex: Julien Vendeur"
                            />
                        </div>
                        <div className="space-y-2">
                            <PremiumSelect
                                label="Rôle & Poste"
                                value={formData.role}
                                onChange={(val) => setFormData(p => ({ ...p, role: val as UserRole }))}
                                options={ROLES}
                            />
                        </div>
                    </div>

                    {/* Status Specific Section */}
                    {statusType === 'employee' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/40">
                            <div className="space-y-2">
                                <PremiumSelect
                                    label="Type de Contrat HCR"
                                    value={formData.contractType}
                                    onChange={(val) => setFormData(p => ({ ...p, contractType: val }))}
                                    options={CONTRACT_TYPES}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-nano font-black text-text-muted uppercase tracking-[0.2em]">Taux Horaire Brut (€ / h)</label>
                                <input
                                    type="number"
                                    step="0.10"
                                    value={formData.hourlyRate}
                                    onChange={(e) => setFormData(p => ({ ...p, hourlyRate: parseFloat(e.target.value) || 0 }))}
                                    className="w-full h-12 px-4 bg-bg-tertiary rounded-xl border border-border focus:border-action-primary outline-none font-mono font-bold text-sm"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 pt-2 border-t border-border/40">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-nano font-black text-text-muted uppercase tracking-[0.2em]">Raison Sociale / EI</label>
                                    <input
                                        type="text"
                                        value={formData.companyName}
                                        onChange={(e) => setFormData(p => ({ ...p, companyName: e.target.value }))}
                                        className="w-full h-12 px-4 bg-bg-tertiary rounded-xl border border-border focus:border-action-primary outline-none font-bold text-sm"
                                        placeholder="ex: Julien Events EI"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-nano font-black text-text-muted uppercase tracking-[0.2em]">{"Numéro SIRET (14 chiffres)"}</label>
                                        {formData.siret && (
                                            <span className={cn("text-nano font-bold", isSiretValid ? "text-status-success" : "text-status-danger")}>
                                                {isSiretValid ? "✓ SIRET Valide (Luhn)" : "✗ Invalide"}
                                            </span>
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        maxLength={14}
                                        value={formData.siret}
                                        onChange={(e) => setFormData(p => ({ ...p, siret: e.target.value.replace(/\s+/g, '') }))}
                                        className={cn(
                                            "w-full h-12 px-4 bg-bg-tertiary rounded-xl border focus:border-action-primary outline-none font-mono font-bold text-sm",
                                            !isSiretValid && formData.siret.length > 0 ? "border-status-danger text-status-danger" : "border-border"
                                        )}
                                        placeholder="73282932000074"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <PremiumSelect
                                        label="Régime de TVA"
                                        value={formData.vatRegime}
                                        onChange={(val) => setFormData(p => ({ ...p, vatRegime: val as typeof formData.vatRegime }))}
                                        options={VAT_REGIMES}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-nano font-black text-text-muted uppercase tracking-[0.2em]">Taux Horaire Prestation (€ HT / h)</label>
                                    <input
                                        type="number"
                                        step="0.50"
                                        value={formData.hourlyRate}
                                        onChange={(e) => setFormData(p => ({ ...p, hourlyRate: parseFloat(e.target.value) || 0 }))}
                                        className="w-full h-12 px-4 bg-bg-tertiary rounded-xl border border-border focus:border-action-primary outline-none font-mono font-bold text-sm"
                                        placeholder="25.00"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-nano font-black text-text-muted uppercase tracking-[0.2em]">IBAN pour Virement Factures</label>
                                <input
                                    type="text"
                                    value={formData.iban}
                                    onChange={(e) => setFormData(p => ({ ...p, iban: e.target.value.toUpperCase() }))}
                                    className="w-full h-12 px-4 bg-bg-tertiary rounded-xl border border-border focus:border-action-primary outline-none font-mono text-xs tracking-wider"
                                    placeholder="FR76 3000 6000 0112 3456 7890 189"
                                />
                            </div>

                            <div className="p-3.5 rounded-xl bg-action-primary/5 border border-action-primary/20 flex items-start gap-3 text-xs text-text-secondary">
                                <FileCheck className="w-4 h-4 text-action-primary shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-text-primary">Mandat d'Auto-Facturation B2B (Self-Billing)</p>
                                    <p className="text-nano mt-0.5 text-text-muted">
                                        Restaurant OS génèrera automatiquement la facture Factur-X au nom de l'auto-entrepreneur après chaque vacation validée.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PIN Code */}
                    <div className="space-y-2 pt-2 border-t border-border/40">
                        <label className="text-nano font-black text-text-muted uppercase tracking-[0.2em]">Code PIN Badgeuse (4 chiffres)</label>
                        <input
                            type="password"
                            maxLength={4}
                            value={formData.pin}
                            onChange={(e) => setFormData(p => ({ ...p, pin: e.target.value }))}
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className="w-full h-12 px-4 bg-bg-tertiary rounded-xl border border-border focus:border-action-primary outline-none font-mono text-xl tracking-[0.5em] font-bold text-center"
                            placeholder={editingUser ? "•••• (Inchangé)" : "4 chiffres requis"}
                        />
                    </div>

                    <div className="pt-4 flex gap-4">
                        {editingUser && canDo('delete_employee') && (
                            <Button
                                variant="outline"
                                className="flex-1 h-12 border-status-danger text-status-danger hover:bg-status-danger/5"
                                onClick={() => setShowSecurityModal(true)}
                            >
                                Supprimer
                            </Button>
                        )}
                        <Button
                            className="flex-[2] h-12 bg-action-primary hover:bg-action-primary-hover text-text-on-primary rounded-xl font-bold uppercase text-micro tracking-widest transition-all"
                            onClick={handleSaveStaff}
                        >
                            {editingUser ? "Enregistrer" : "Créer le profil"}
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
