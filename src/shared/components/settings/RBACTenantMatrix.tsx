"use client";

import React, { useState, useEffect } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { 
    Shield, 
    Check, 
    X, 
    Lock, 
    Save, 
    RotateCcw, 
    Info,
    Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

import { rbacConfigAtom, fetchRbacConfigAtom } from '@/store/pillars/rbac';
import { tenantIdAtom, currentUserAtom } from '@/store/pillars/sovereign';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { 
    DEFAULT_PAGE_ACCESS, 
    type TenantRBACConfig 
} from '@/modules/compliance';
import { 
    PERMISSION_ROLE_LEVELS, 
    type TenantRole, 
    type PermissionRole 
} from '@/kernel/contracts/rbac';

interface PageAccessRow {
    key: string;
    label: string;
    description: string;
    category: 'service' | 'management' | 'finance_admin';
}

const PAGES_CONFIG: PageAccessRow[] = [
    { key: 'pos', label: 'Caisse (POS)', description: 'Prise de commande, encaissement, split addition', category: 'service' },
    { key: 'kds', label: 'Écran Cuisine (KDS)', description: 'Affichage des bons de commande, tir des plats', category: 'service' },
    { key: 'kitchen', label: 'Fiches Recettes & Cuisine', description: 'Consultation des recettes et mise en place', category: 'service' },
    { key: 'floor_plan', label: 'Plan de Salle', description: 'Placement des tables et statut des couverts', category: 'service' },
    { key: 'reservations', label: 'Réservations & Waitlist', description: 'Gestion des arrivées et réservations clients', category: 'service' },
    { key: 'bar', label: 'Bar & Boissons', description: 'Poste bar et stocks boissons', category: 'service' },
    { key: 'timeclock', label: 'Pointage Horaire', description: 'Badgeuse numérique et pointage de shift', category: 'service' },
    
    { key: 'staff', label: 'Gestion Équipe', description: 'Fiches collaborateurs et documents', category: 'management' },
    { key: 'planning', label: 'Plannings & Horaires', description: 'Création et publication des plannings', category: 'management' },
    { key: 'leaves', label: 'Congés & Absences', description: 'Demandes et validation des congés', category: 'management' },
    { key: 'haccp', label: 'Hygiène & HACCP', description: 'Relevés de températures et traçabilité', category: 'management' },
    { key: 'inventory', label: 'Stocks & Inventaires', description: 'Comptage de stock et réceptions marchandises', category: 'management' },
    { key: 'crm', label: 'Fidélité & CRM', description: 'Base clients, segmentation et campagnes', category: 'management' },
    
    { key: 'finance', label: 'Finance & Clôtures Z', description: 'Chiffre d\'affaires, TVA et export comptable', category: 'finance_admin' },
    { key: 'analytics', label: 'Analytique & Rapports', description: 'Statistiques avancées et rentabilité', category: 'finance_admin' },
    { key: 'settings', label: 'Paramètres Restaurant', description: 'Configuration globale et imprimantes', category: 'finance_admin' },
];

const TENANT_ROLES_LIST: { role: TenantRole; label: string; level: number }[] = [
    { role: 'admin', label: 'Propriétaire (Admin)', level: 100 },
    { role: 'directeur', label: 'Directeur', level: 90 },
    { role: 'manager', label: 'Manager', level: 70 },
    { role: 'comptable', label: 'Comptable', level: 60 },
    { role: 'chef_rang', label: 'Chef de Rang', level: 50 },
    { role: 'chef_cuisinier', label: 'Chef Cuisinier', level: 45 },
    { role: 'serveur', label: 'Serveur', level: 40 },
    { role: 'cuisinier', label: 'Cuisinier', level: 35 },
    { role: 'barman', label: 'Barman', level: 35 },
    { role: 'hotesse', label: 'Hôtesse', level: 30 },
    { role: 'plongeur', label: 'Plongeur', level: 10 },
];

/**
 * 🛡️ RBACTenantMatrix — Matrice des Permissions & Rôles Équipe (Chantier γ-3)
 *
 * Réservé exclusivement à l'administrateur du restaurant (Admin / Propriétaire).
 * 100% étanche : aucun rôle MCC ou Super Admin n'apparaît dans cette matrice.
 */
export const RBACTenantMatrix: React.FC = () => {
    const tenantId = useAtomValue(tenantIdAtom);
    const currentUser = useAtomValue(currentUserAtom);
    const [rbacConfig, setRbacConfig] = useAtom(rbacConfigAtom);
    const [, fetchRbacConfig] = useAtom(fetchRbacConfigAtom);
    const [selectedCategory, setSelectedCategory] = useState<'all' | 'service' | 'management' | 'finance_admin'>('all');
    const [isSaving, setIsSaving] = useState(false);
    const [localOverrides, setLocalOverrides] = useState<Record<string, { allowed: PermissionRole[] }>>({});

    const isOwner = currentUser?.role === 'admin' || (currentUser?.role && PERMISSION_ROLE_LEVELS[currentUser.role as TenantRole] === 100);

    useEffect(() => {
        if (tenantId) {
            fetchRbacConfig(tenantId);
        }
    }, [tenantId, fetchRbacConfig]);

    useEffect(() => {
        if (rbacConfig?.pageOverrides) {
            const current: Record<string, { allowed: PermissionRole[] }> = {};
            Object.entries(rbacConfig.pageOverrides).forEach(([page, config]) => {
                if (config.allowed) {
                    current[page] = { allowed: config.allowed as PermissionRole[] };
                }
            });
            setLocalOverrides(current);
        } else {
            // Initialiser depuis DEFAULT_PAGE_ACCESS
            const defaults: Record<string, { allowed: PermissionRole[] }> = {};
            Object.entries(DEFAULT_PAGE_ACCESS).forEach(([page, roles]) => {
                defaults[page] = { allowed: roles };
            });
            setLocalOverrides(defaults);
        }
    }, [rbacConfig]);

    const isRoleAllowed = (pageKey: string, role: TenantRole): boolean => {
        // L'admin propriétaire a toujours tous les accès
        if (role === 'admin') return true;

        const pageConfig = localOverrides[pageKey];
        if (pageConfig?.allowed) {
            return pageConfig.allowed.includes(role);
        }
        const defaultRoles = DEFAULT_PAGE_ACCESS[pageKey] || [];
        return defaultRoles.includes(role);
    };

    const togglePermission = (pageKey: string, role: TenantRole) => {
        if (!isOwner) {
            toast.error('Seul le propriétaire (Admin) peut modifier les permissions de l\'équipe.');
            return;
        }
        if (role === 'admin') {
            toast.info('Le rôle Propriétaire conserve un accès complet permanent.');
            return;
        }

        setLocalOverrides(prev => {
            const currentAllowed = prev[pageKey]?.allowed 
                ? [...prev[pageKey].allowed] 
                : [...(DEFAULT_PAGE_ACCESS[pageKey] || [])];

            const exists = currentAllowed.includes(role);
            const newAllowed = exists 
                ? currentAllowed.filter(r => r !== role) 
                : [...currentAllowed, role];

            return {
                ...prev,
                [pageKey]: { allowed: newAllowed as PermissionRole[] }
            };
        });
    };

    const handleSave = async () => {
        if (!tenantId) {
            toast.error('Tenant non identifié.');
            return;
        }
        setIsSaving(true);
        try {
            const newConfig: TenantRBACConfig = {
                version: (rbacConfig?.version || 1) + 1,
                pageOverrides: localOverrides,
                tabOverrides: rbacConfig?.tabOverrides || {},
                actionOverrides: rbacConfig?.actionOverrides || {},
            };

            await Nexus.adapter.update(`tenants/${tenantId}/config/rbac`, newConfig);
            setRbacConfig(newConfig);
            toast.success('Matrice des permissions enregistrée avec succès !');
        } catch (err) {
            toast.error('Erreur lors de l\'enregistrement : ' + (err instanceof Error ? err.message : String(err)));
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        const defaults: Record<string, { allowed: PermissionRole[] }> = {};
        Object.entries(DEFAULT_PAGE_ACCESS).forEach(([page, roles]) => {
            defaults[page] = { allowed: roles };
        });
        setLocalOverrides(defaults);
        toast.info('Permissions réinitialisées aux valeurs par défaut.');
    };

    const filteredPages = PAGES_CONFIG.filter(p => selectedCategory === 'all' || p.category === selectedCategory);

    return (
        <div className="space-y-6">
            {/* Bannière Sécurité */}
            <div className="bg-surface-elevated/40 border border-border-base/60 rounded-xl p-6 backdrop-blur-md">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-accent-gold/10 border border-accent-gold/20 text-accent-gold flex items-center justify-center shrink-0">
                            <Shield className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-serif font-bold text-text-primary flex items-center gap-2">
                                Matrice des Permissions & Rôles Équipe
                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-accent-gold/20 text-accent-gold border border-accent-gold/30 flex items-center gap-1 font-sans font-medium">
                                    <Sparkles className="w-3 h-3" /> Périmètre Restaurant
                                </span>
                            </h3>
                            <p className="text-xs text-text-muted mt-1 max-w-2xl">
                                Contrôlez précisément les écrans et fonctionnalités accessibles pour chaque collaborateur. 
                                Les permissions s'appliquent immédiatement en caisse, sur KDS et sur mobile.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border-base/70 bg-surface-base text-text-muted hover:text-text-primary text-xs font-medium transition-colors"
                        >
                            <RotateCcw className="w-3.5 h-3.5" /> Réinitialiser
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving || !isOwner}
                            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-accent-gold hover:bg-accent-gold/90 text-surface-base text-xs font-bold shadow-lg shadow-accent-gold/20 transition-all disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {isSaving ? 'Enregistrement...' : 'Enregistrer les Droits'}
                        </button>
                    </div>
                </div>

                {/* Filtres par catégorie */}
                <div className="flex items-center gap-2 mt-6 pt-6 border-t border-border-base/40 overflow-x-auto pb-1">
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            selectedCategory === 'all' 
                                ? 'bg-accent-gold text-surface-base font-bold' 
                                : 'bg-surface-base/60 text-text-muted hover:text-text-primary border border-border-base/40'
                        }`}
                    >
                        Toutes les sections ({PAGES_CONFIG.length})
                    </button>
                    <button
                        onClick={() => setSelectedCategory('service')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            selectedCategory === 'service' 
                                ? 'bg-accent-gold text-surface-base font-bold' 
                                : 'bg-surface-base/60 text-text-muted hover:text-text-primary border border-border-base/40'
                        }`}
                    >
                        Service & Caisse
                    </button>
                    <button
                        onClick={() => setSelectedCategory('management')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            selectedCategory === 'management' 
                                ? 'bg-accent-gold text-surface-base font-bold' 
                                : 'bg-surface-base/60 text-text-muted hover:text-text-primary border border-border-base/40'
                        }`}
                    >
                        Management & Cuisine
                    </button>
                    <button
                        onClick={() => setSelectedCategory('finance_admin')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            selectedCategory === 'finance_admin' 
                                ? 'bg-accent-gold text-surface-base font-bold' 
                                : 'bg-surface-base/60 text-text-muted hover:text-text-primary border border-border-base/40'
                        }`}
                    >
                        Finance & Administration
                    </button>
                </div>
            </div>

            {/* Tableau Matriciel */}
            <div className="bg-surface-base border border-border-base/70 rounded-xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-surface-elevated/70 border-b border-border-base/80">
                                <th className="p-4 font-serif font-bold text-text-primary min-w-[13.75rem] sticky left-0 bg-surface-elevated z-10">
                                    Écran / Fonctionnalité
                                </th>
                                {TENANT_ROLES_LIST.map(({ role, label, level }) => (
                                    <th key={role} className="p-3 font-semibold text-text-primary text-center min-w-[90px]">
                                        <div className="font-bold">{label}</div>
                                        <div className="text-nano text-text-muted font-normal mt-0.5">Niv. {level}</div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-base/40">
                            {filteredPages.map((page) => (
                                <tr key={page.key} className="hover:bg-surface-hover/30 transition-colors">
                                    <td className="p-4 sticky left-0 bg-surface-base z-10 border-r border-border-base/30">
                                        <div className="font-bold text-text-primary">{page.label}</div>
                                        <div className="text-micro text-text-muted mt-0.5">{page.description}</div>
                                    </td>
                                    {TENANT_ROLES_LIST.map(({ role }) => {
                                        const allowed = isRoleAllowed(page.key, role);
                                        const isLockedAdmin = role === 'admin';

                                        return (
                                            <td key={role} className="p-3 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => togglePermission(page.key, role)}
                                                    disabled={isLockedAdmin || !isOwner}
                                                    title={isLockedAdmin ? 'Accès permanent pour l\'administrateur' : `Cliquer pour ${allowed ? 'bloquer' : 'autoriser'}`}
                                                    className={`w-8 h-8 rounded-lg inline-flex items-center justify-center transition-all ${
                                                        allowed
                                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                                                            : 'bg-surface-elevated text-text-muted/40 border border-border-base/40 hover:text-text-muted'
                                                    } ${isLockedAdmin ? 'cursor-default opacity-80' : 'cursor-pointer hover:scale-105'}`}
                                                >
                                                    {isLockedAdmin ? (
                                                        <Lock className="w-3.5 h-3.5 text-accent-gold" />
                                                    ) : allowed ? (
                                                        <Check className="w-4 h-4 text-emerald-400" />
                                                    ) : (
                                                        <X className="w-3.5 h-3.5 text-text-muted/40" />
                                                    )}
                                                </button>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Note d'information */}
            <div className="flex items-start gap-2.5 p-4 rounded-xl bg-surface-elevated/30 border border-border-base/40 text-xs text-text-muted">
                <Info className="w-4 h-4 text-accent-gold shrink-0 mt-0.5" />
                <div>
                    <strong>Règle de sécurité :</strong> Le rôle <em>Propriétaire (Admin)</em> possède un accès maître garanti par le protocole Grade X. 
                    Les rôles sont strictement étanches : aucune permission système ou MCC n'est exposée sur cet espace.
                </div>
            </div>
        </div>
    );
};
