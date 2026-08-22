"use client";

import { User, Mail, Phone } from "lucide-react";
import { PremiumSelect } from "@ui/PremiumSelect";
import type { Candidate, CandidateStatus } from "@nexus/contracts";

export const ROLES = [
    { value: 'server', label: 'Serveur(se)' },
    { value: 'bartender', label: 'Barman/Barmaid' },
    { value: 'kitchen_chef', label: 'Chef de cuisine' },
    { value: 'kitchen_line', label: 'Commis de cuisine' },
    { value: 'manager', label: 'Directeur/Manager' },
    { value: 'host', label: 'Hôte(sse) d\'accueil' },
];

export const STATUS_OPTIONS = [
    { value: 'new', label: 'Nouveau' },
    { value: 'interview', label: 'Entretien' },
    { value: 'trial', label: 'Essai' },
    { value: 'hired', label: 'Embauché' },
    { value: 'refused', label: 'Refusé' },
];

interface CandidateFormFieldsProps {
    formData: Partial<Candidate>;
    setFormDraft: React.Dispatch<React.SetStateAction<Partial<Candidate> | null>>;
    initialFormData: Partial<Candidate>;
}

export function CandidateFormFields({
    formData,
    setFormDraft,
    initialFormData,
}: CandidateFormFieldsProps) {
    return (
        <>
            {/* Personal Info */}
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                        <User className="w-3 h-3 text-accent" /> Prénom
                    </label>
                    <input
                        className="w-full h-12 px-5 bg-bg-tertiary rounded-xl border border-border focus:border-accent outline-none font-bold text-[14px]"
                        value={formData.firstName}
                        onChange={(e) => setFormDraft(p => ({ ...(p ?? initialFormData), firstName: e.target.value }))}
                        placeholder="Jean"
                    />
                </div>
                <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                        <User className="w-3 h-3 text-accent" /> Nom
                    </label>
                    <input
                        className="w-full h-12 px-5 bg-bg-tertiary rounded-xl border border-border focus:border-accent outline-none font-bold text-[14px]"
                        value={formData.lastName}
                        onChange={(e) => setFormDraft(p => ({ ...(p ?? initialFormData), lastName: e.target.value }))}
                        placeholder="Dupont"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                        <Mail className="w-3 h-3 text-accent" /> Email
                    </label>
                    <input
                        className="w-full h-12 px-5 bg-bg-tertiary rounded-xl border border-border focus:border-accent outline-none font-bold text-[14px]"
                        value={formData.email}
                        onChange={(e) => setFormDraft(p => ({ ...(p ?? initialFormData), email: e.target.value }))}
                        placeholder="jean.dupont@email.com"
                    />
                </div>
                <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                        <Phone className="w-3 h-3 text-accent" /> Téléphone
                    </label>
                    <input
                        className="w-full h-12 px-5 bg-bg-tertiary rounded-xl border border-border focus:border-accent outline-none font-bold text-[14px]"
                        value={formData.phone}
                        onChange={(e) => setFormDraft(p => ({ ...(p ?? initialFormData), phone: e.target.value }))}
                        placeholder="06 12 34 56 78"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                    <PremiumSelect
                        label="Poste"
                        value={formData.appliedRole || 'server'}
                        onChange={(val) => setFormDraft(p => ({ ...(p ?? initialFormData), appliedRole: val }))}
                        options={ROLES}
                    />
                </div>
                <div className="space-y-3">
                    <PremiumSelect
                        label="Statut"
                        value={formData.status || 'new'}
                        onChange={(val) => setFormDraft(p => ({ ...(p ?? initialFormData), status: val as CandidateStatus }))}
                        options={STATUS_OPTIONS}
                    />
                </div>
            </div>
        </>
    );
}
