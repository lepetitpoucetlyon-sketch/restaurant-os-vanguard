"use client";

import { useState } from "react";
import { useAuth } from "@/hooks";
import {
    ALL_CATEGORIES,
    CATEGORY_LABELS,
    ROLE_LABELS,
    type CategoryKey,
} from "@domain/services/AccessPolicyManager";
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
} from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { useToast } from "@ui/Toast";
import { PageHeaderWithDocs } from "@ui/PageHeaderWithDocs";

export default function AccountSettingsPage() {
    const { currentUser, users, rolePermissions, updateRolePermissions, hasAccess } = useAuth();
    const { showToast } = useToast();
    const [expandedRole, setExpandedRole] = useState<UserRole | null>(null);
    const [pendingChanges, setPendingChanges] = useState<Record<UserRole, CategoryKey[]>>({} as Record<UserRole, CategoryKey[]>);

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

    const roles = Object.keys(ROLE_LABELS) as UserRole[];

    const toggleCategory = (role: UserRole, category: CategoryKey) => {
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

    const getUserCountByRole = (role: UserRole) => {
        return users.filter(u => u.role === role).length;
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

                <div className="flex items-center gap-2 bg-status-warning dark:bg-status-warning border border-amber-200 dark:border-amber-500/30 rounded-xl px-4 py-3 mt-4">
                    <AlertTriangle className="w-5 h-5 text-status-warning dark:text-status-warning shrink-0" />
                    <p className="text-sm text-status-warning dark:text-status-warning">
                        <strong>Attention :</strong> Les modifications affectent tous les utilisateurs du rôle sélectionné.
                    </p>
                </div>
            </div>

            {/* Roles List */}
            <div className="space-y-4">
                {roles.map(role => {
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
                                                        "w-12 h-12 rounded-2xl flex items-center justify-center text-white dark:text-bg-primary font-black text-lg",
                                                        isAdmin ? "bg-gradient-to-br from-amber-500 to-orange-600" : "bg-text-primary"
                                                    )}>
                                                        {(ROLE_LABELS[role] || '').charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-lg text-text-primary">{ROLE_LABELS[role]}</h3>
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
                                                                            <div className="w-6 h-6 rounded-full bg-text-primary dark:bg-action-primary text-white dark:text-bg-primary text-[10px] font-bold flex items-center justify-center">
                                                                                {(user.name || '').charAt(0)}
                                                                            </div>
                                                                            <span className="text-sm font-medium text-text-muted">{user.name}</span>
                                                                        </div>
                                                                    ))}
                                                                    {userCount === 0 && (
                                                                        <span className="text-sm text-text-muted italic">Aucun utilisateur</span>
                                                                    )}
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
                                                                        return (
                                                                            <button
                                                                                key={category}
                                                                                onClick={() => toggleCategory(role, category)}
                                                                                className={cn(
                                                                                    "flex items-center gap-3 p-4 rounded-2xl border transition-all duration-300",
                                                                                    isEnabled
                                                                                        ? "bg-success/10 border-success text-success"
                                                                                        : "bg-surface-bg dark:bg-bg-tertiary border-border-default dark:border-border text-text-muted hover:border-border-default dark:hover:border-text-muted"
                                                                                )}
                                                                            >
                                                                                <div className={cn(
                                                                                    "w-6 h-6 rounded-lg flex items-center justify-center",
                                                                                    isEnabled ? "bg-success text-white dark:text-bg-primary" : "bg-surface-bg dark:bg-bg-primary text-text-primary dark:text-text-muted"
                                                                                )}>
                                                                                    {isEnabled ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                                                                </div>
                                                                                <span className="text-sm font-semibold">{CATEGORY_LABELS[category]}</span>
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>

                                                            {/* Save Button */}
                                                            {hasChanges(role) && (
                                                                <button
                                                                    onClick={() => saveRolePermissions(role)}
                                                                    className="flex items-center gap-2 bg-success text-white px-6 py-3 rounded-xl font-bold hover:bg-success/90 transition-colors shadow-lg shadow-success/20"
                                                                >
                                                                    <Save className="w-5 h-5" />
                                                                    Sauvegarder les modifications
                                                                </button>
                                                            )}
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
