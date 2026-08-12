"use client";

import { useState } from "react";
import { useAuth } from "@/kernel/hooks";
import {
    ALL_CATEGORIES,
    CATEGORY_LABELS,
    CATEGORY_FEATURES,
    ROLE_LABELS,
    type CategoryKey,
} from "@/lib/AccessPolicyManager";
import type { UserRole } from "@nexus/contracts";
import {
    Shield,
    Check,
    X,
    Users,
    Lock,
    Unlock,
    Save,
    AlertTriangle,
    ChevronDown,
    ChevronUp,
    Plus,
    Trash,
} from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { useToast } from "@ui/Toast";
import { PageHeaderWithDocs } from "@ui/PageHeaderWithDocs";
import { ROLE_TEMPLATES, type RoleTemplate } from "@/lib/RoleTemplates";

export function AccountSettingsDashboard() {
    const { currentUser: _currentUser, users, rolePermissions, customRoles, updateRolePermissions, createCustomRole, deleteCustomRole, assignRoleToUser, hasAccess } = useAuth();
    const { showToast } = useToast();
    const [expandedRole, setExpandedRole] = useState<UserRole | string | null>(null);
    const [pendingChanges, setPendingChanges] = useState<Record<UserRole | string, CategoryKey[]>>({});
    const [isCreatingRole, setIsCreatingRole] = useState(false);
    const [newRoleName, setNewRoleName] = useState("");
    const [reassigningUserId, setReassigningUserId] = useState<string | null>(null);

    // Only admins can access this page
    if (!hasAccess('account-settings')) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-20 h-20 bg-status-danger dark:bg-status-danger rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-10 h-10 text-status-danger" />
                    </div>
                    <h1 className="text-2xl font-black text-text-primary mb-2">Accès Refusé</h1>
                    <p className="text-text-muted">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
                </div>
            </div>
        );
    }

    // Merge hardcoded roles and dynamic custom roles
    const baseRoles = Object.keys(ROLE_LABELS);
    const allRoles = [...baseRoles, ...(customRoles || []).map((r: Record<string, unknown>) => r.id as string)];

    const getRoleLabel = (roleId: string) => {
        if (ROLE_LABELS[roleId]) return ROLE_LABELS[roleId];
        const custom = customRoles?.find((r: Record<string, unknown>) => r.id === roleId);
        return custom ? (custom.label as string) : roleId;
    };

    const toggleCategory = (role: UserRole | string, category: CategoryKey) => {
        const currentCategories = pendingChanges[role] || rolePermissions[role] || [];
        let newCategories: CategoryKey[];

        if (currentCategories.includes(category)) {
            newCategories = currentCategories.filter(c => c !== category);
        } else {
            newCategories = [...currentCategories, category];
        }

        setPendingChanges(prev => ({ ...prev, [role]: newCategories }));
    };

    const saveRolePermissions = async (role: UserRole) => {
        const categories = pendingChanges[role];
        if (categories) {
            try {
                await updateRolePermissions(role, categories);
                setPendingChanges(prev => {
                    const newPending = { ...prev };
                    delete newPending[role];
                    return newPending;
                });
                showToast(`Permissions mises à jour pour ${ROLE_LABELS[role]}`, "success");
            } catch (error) {
                console.error('Failed to update role permissions', error);
                showToast("Impossible d'enregistrer ces permissions.", "error");
            }
        }
    };

    const hasChanges = (role: UserRole) => {
        return !!pendingChanges[role];
    };

    const getCategories = (role: UserRole): CategoryKey[] => {
        return pendingChanges[role] || rolePermissions[role] || [];
    };

    const applyTemplate = (role: UserRole, template: RoleTemplate) => {
        setPendingChanges(prev => ({ ...prev, [role]: template.categories as CategoryKey[] }));
        showToast(`Template « ${template.name} » appliqué — sauvegardez pour confirmer`, "info");
    };

    const getUserCountByRole = (role: UserRole | string) => {
        return users.filter(u => u.role === role).length;
    };

    const handleCreateRole = async () => {
        if (!newRoleName.trim()) return;
        try {
            const roleId = await createCustomRole(newRoleName.trim());
            showToast(`Rôle personnalisé "${newRoleName}" créé.`, "success");
            setNewRoleName("");
            setIsCreatingRole(false);
            setExpandedRole(roleId);
        } catch (error) {
            console.error('Failed to create custom role', error);
            showToast("Erreur lors de la création du rôle.", "error");
        }
    };

    const handleAssignRole = async (userId: string, newRole: string) => {
        setReassigningUserId(userId);
        try {
            await assignRoleToUser(userId, newRole);
            showToast(`Rôle mis à jour.`, "success");
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Erreur inconnue";
            showToast(`Impossible d'assigner le rôle : ${msg}`, "error");
        } finally {
            setReassigningUserId(null);
        }
    };

    const handleDeleteRole = async (roleId: string) => {
        if (getUserCountByRole(roleId) > 0) {
            showToast("Impossible de supprimer un rôle assigné à des utilisateurs.", "error");
            return;
        }
        try {
            await deleteCustomRole(roleId);
            showToast(`Rôle supprimé avec succès.`, "success");
            if (expandedRole === roleId) setExpandedRole(null);
        } catch (error) {
            console.error('Failed to delete custom role', error);
            showToast("Erreur lors de la suppression.", "error");
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-10">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-success/10 rounded-2xl flex items-center justify-center">
                        <Shield className="w-7 h-7 text-success" />
                    </div>
                    <div>
                        <PageHeaderWithDocs categoryId="staff" title="Gestion des Accès" className="text-3xl font-black text-text-primary tracking-tight" />
                        <p className="text-text-muted text-sm">Configurez les permissions d'accès par rôle</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-status-warning dark:bg-status-warning border border-amber-200 dark:border-action-primary/30 rounded-xl px-4 py-3 mt-4">
                    <AlertTriangle className="w-5 h-5 text-status-warning dark:text-status-warning shrink-0" />
                    <p className="text-sm text-status-warning dark:text-status-warning">
                        <strong>Attention :</strong> Les modifications affectent tous les utilisateurs du rôle sélectionné.
                    </p>
                </div>
            </div>

            {/* Create Custom Role Banner */}
            <div className="mb-8 flex justify-end">
                {isCreatingRole ? (
                    <div className="flex items-center gap-3 bg-surface-card dark:bg-bg-secondary p-2 pr-4 rounded-full border border-action-primary shadow-lg animate-in fade-in slide-in-from-right-4">
                        <input
                            autoFocus
                            type="text"
                            placeholder="Nom du rôle (ex: Stagiaire)"
                            className="bg-transparent border-none focus:ring-0 text-sm px-4 py-2 w-48 text-text-primary placeholder:text-text-muted"
                            value={newRoleName}
                            onChange={e => setNewRoleName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCreateRole()}
                        />
                        <button onClick={() => setIsCreatingRole(false)} className="p-2 text-text-muted hover:text-text-primary transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                        <button onClick={handleCreateRole} className="bg-action-primary text-bg-primary px-4 py-2 rounded-full text-sm font-bold shadow-md hover:bg-action-primary/90 transition-all">
                            Créer
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsCreatingRole(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-surface-card dark:bg-bg-secondary border border-border-default hover:border-action-primary/50 text-action-primary font-bold rounded-2xl shadow-sm hover:shadow-md transition-all group"
                    >
                        <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        Créer un Rôle Personnalisé
                    </button>
                )}
            </div>

            {/* Roles List */}
            <div className="space-y-4">
                {allRoles.map(role => {
                                    const isExpanded = expandedRole === role;
                                    const userCount = getUserCountByRole(role);
                                    const categories = getCategories(role);
                                    const isAdmin = role === 'admin';

                                    return (
                                        <div
                                            key={role}
                                            className={cn(
                                                "bg-surface-card dark:bg-bg-secondary rounded-3xl border transition-all duration-300 overflow-hidden",
                                                isExpanded ? "border-action-primary shadow-xl shadow-[var(--action-primary)]/5" : "border-border-default dark:border-border hover:border-border-default dark:hover:border-text-muted"
                                            )}
                                        >
                                            {/* Role Header */}
                                            <button
                                                onClick={() => setExpandedRole(isExpanded ? null : role)}
                                                className="w-full flex items-center justify-between p-6 text-left"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "w-12 h-12 rounded-2xl flex items-center justify-center text-text-primary dark:text-bg-primary font-black text-lg",
                                                        isAdmin ? "bg-gradient-to-br from-status-warning to-status-warning" : "bg-text-primary"
                                                    )}>
                                                        {(ROLE_LABELS[role] || '').charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-lg text-text-primary">{getRoleLabel(role)}</h3>
                                                        <p className="text-sm text-text-muted">
                                                            {userCount} utilisateur{userCount > 1 ? 's' : ''} • {categories.length} catégories accessibles
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {hasChanges(role) && (
                                                        <span className="px-3 py-1 bg-status-warning dark:bg-status-warning text-status-warning dark:text-status-warning text-xs font-bold rounded-full">
                                                            Non sauvegardé
                                                        </span>
                                                    )}
                                                    {isExpanded ? (
                                                        <ChevronUp className="w-5 h-5 text-text-muted" />
                                                    ) : (
                                                        <ChevronDown className="w-5 h-5 text-text-muted" />
                                                    )}
                                                </div>
                                            </button>

                                            {/* Expanded Content */}
                                            {isExpanded && (
                                                <div className="px-6 pb-6 pt-2 border-t border-border-default dark:border-border">
                                                    {isAdmin ? (
                                                        <div className="flex items-center gap-3 bg-surface-bg dark:bg-bg-tertiary rounded-2xl p-4">
                                                            <Unlock className="w-5 h-5 text-action-primary" />
                                                            <p className="text-sm text-text-muted">
                                                                <strong>Accès total :</strong> Les administrateurs ont accès à toutes les catégories par défaut.
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {/* Users with this role */}
                                                            <div className="mb-6">
                                                                <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">
                                                                    Utilisateurs avec ce rôle
                                                                </h4>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {users.filter(u => u.role === role).map((user: import('@nexus/contracts').User) => (
                                                                        <div
                                                                            key={user.id}
                                                                            className="flex items-center gap-2 bg-surface-bg dark:bg-bg-tertiary px-3 py-2 rounded-xl"
                                                                        >
                                                                            <div className="w-6 h-6 rounded-full bg-text-primary dark:bg-action-primary text-text-primary dark:text-bg-primary text-[10px] font-bold flex items-center justify-center">
                                                                                {(user.name || '').charAt(0)}
                                                                            </div>
                                                                            <span className="text-sm font-medium text-text-muted">{user.name}</span>
                                                                            {/* Sélecteur de rôle inline — câble /api/admin/users/assign-role */}
                                                                            <select
                                                                                disabled={reassigningUserId === user.id}
                                                                                defaultValue={user.role}
                                                                                onChange={e => handleAssignRole(user.id, e.target.value)}
                                                                                className="ml-1 text-[11px] bg-transparent border border-action-primary/20 rounded-lg px-2 py-1 text-text-muted cursor-pointer hover:border-action-primary/60 disabled:opacity-50 transition-colors"
                                                                                title="Changer le rôle"
                                                                            >
                                                                                {allRoles.map(r => (
                                                                                    <option key={r} value={r}>{getRoleLabel(r)}</option>
                                                                                ))}
                                                                            </select>
                                                                        </div>
                                                                    ))}
                                                                    {userCount === 0 && (
                                                                        <span className="text-sm text-text-muted italic">Aucun utilisateur</span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Role Templates */}
                                                            <div className="mb-6">
                                                                <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">
                                                                    Appliquer un template
                                                                </h4>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {ROLE_TEMPLATES.map((tpl: RoleTemplate) => (
                                                                        <button
                                                                            key={tpl.id}
                                                                            onClick={() => applyTemplate(role, tpl)}
                                                                            className="px-4 py-2 rounded-xl border border-action-primary/30 bg-action-primary/5 text-action-primary text-sm font-semibold hover:bg-action-primary/10 transition-colors"
                                                                            title={tpl.description}
                                                                        >
                                                                            {tpl.name}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {/* Categories Grid */}
                                                            <div className="mb-6">
                                                                <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">
                                                                    Catégories accessibles
                                                                </h4>
                                                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                                                    {ALL_CATEGORIES.filter((c: CategoryKey) => c !== 'account-settings').map((category: CategoryKey) => {
                                                                        const isEnabled = categories.includes(category);
                                                                        const features = CATEGORY_FEATURES[category] || [];
                                                                        
                                                                        return (
                                                                            <div key={category} className="flex flex-col gap-2">
                                                                                <button
                                                                                    onClick={() => toggleCategory(role, category)}
                                                                                    className={cn(
                                                                                        "flex items-center gap-3 p-4 rounded-2xl border transition-all duration-300 w-full",
                                                                                        isEnabled
                                                                                            ? "bg-success/10 border-success text-success"
                                                                                            : "bg-surface-bg dark:bg-bg-tertiary border-border-default dark:border-border text-text-muted hover:border-border-default dark:hover:border-text-muted"
                                                                                    )}
                                                                                >
                                                                                    <div className={cn(
                                                                                        "w-6 h-6 rounded-lg flex items-center justify-center shrink-0",
                                                                                        isEnabled ? "bg-success text-text-primary dark:text-bg-primary" : "bg-surface-bg dark:bg-bg-primary text-text-primary dark:text-text-muted"
                                                                                    )}>
                                                                                        {isEnabled ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                                                                    </div>
                                                                                    <span className="text-sm font-semibold truncate text-left">{CATEGORY_LABELS[category]}</span>
                                                                                </button>
                                                                                
                                                                                {/* Sous-permissions (Features) */}
                                                                                {isEnabled && features.length > 0 && (
                                                                                    <div className="pl-4 border-l-2 border-border-default dark:border-border ml-3 mt-1 flex flex-col gap-2">
                                                                                        {features.map(feature => {
                                                                                            const isFeatureEnabled = categories.includes(feature.id);
                                                                                            return (
                                                                                                <label key={feature.id} className="flex items-start gap-2 cursor-pointer group">
                                                                                                    <div 
                                                                                                        onClick={() => toggleCategory(role, feature.id)}
                                                                                                        className={cn(
                                                                                                            "w-4 h-4 mt-0.5 rounded flex items-center justify-center shrink-0 transition-colors border",
                                                                                                            isFeatureEnabled 
                                                                                                                ? "bg-action-primary border-action-primary text-text-primary" 
                                                                                                                : "bg-transparent border-border-default dark:border-text-muted group-hover:border-action-primary"
                                                                                                        )}
                                                                                                    >
                                                                                                        {isFeatureEnabled && <Check className="w-3 h-3" />}
                                                                                                    </div>
                                                                                                    <div className="flex flex-col flex-1 min-w-0" onClick={() => toggleCategory(role, feature.id)}>
                                                                                                        <span className={cn(
                                                                                                            "text-xs font-semibold truncate",
                                                                                                            isFeatureEnabled ? "text-text-primary" : "text-text-muted"
                                                                                                        )}>
                                                                                                            {feature.label}
                                                                                                        </span>
                                                                                                        {feature.description && (
                                                                                                            <span className="text-[10px] text-text-muted/70 leading-tight mt-0.5 whitespace-normal">
                                                                                                                {feature.description}
                                                                                                            </span>
                                                                                                        )}
                                                                                                    </div>
                                                                                                </label>
                                                                                            );
                                                                                        })}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>

                                                            {/* Save & Delete Buttons */}
                                                            <div className="flex items-center gap-4">
                                                                {hasChanges(role) && (
                                                                    <button
                                                                        onClick={() => saveRolePermissions(role as UserRole)}
                                                                        className="flex items-center gap-2 bg-success text-text-primary px-6 py-3 rounded-xl font-bold hover:bg-success/90 transition-colors shadow-lg shadow-success/20"
                                                                    >
                                                                        <Save className="w-5 h-5" />
                                                                        Sauvegarder les modifications
                                                                    </button>
                                                                )}
                                                                {!baseRoles.includes(role) && (
                                                                    <button
                                                                        onClick={() => handleDeleteRole(role)}
                                                                        className="flex items-center gap-2 bg-status-danger/10 text-status-danger px-6 py-3 rounded-xl font-bold hover:bg-status-danger/20 transition-colors"
                                                                    >
                                                                        <Trash className="w-5 h-5" />
                                                                        Supprimer ce rôle
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
            </div>

            {/* Info Footer */}
            <div className="mt-10 bg-surface-bg dark:bg-bg-tertiary rounded-3xl p-6 border border-border-default dark:border-border">
                <div className="flex items-start gap-4">
                    <Users className="w-6 h-6 text-text-muted mt-1" />
                    <div>
                        <h4 className="font-bold text-text-primary mb-1">À propos des rôles</h4>
                        <p className="text-sm text-text-muted leading-relaxed">
                            Chaque membre du personnel se voit attribuer un rôle qui détermine les catégories auxquelles il peut accéder.
                            Les modifications prennent effet immédiatement après la sauvegarde. Pour changer le rôle d'un utilisateur,
                            contactez l'administrateur système.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
