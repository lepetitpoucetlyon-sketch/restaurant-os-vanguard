"use client";

import { useState } from "react";
import { useAuth } from "@/shared/hooks";
import {
    ROLE_LABELS,
    type CategoryKey,
} from "@/lib/AccessPolicyManager";
import type { UserRole } from "@nexus/contracts";
import {
    Shield,
    X,
    Users,
    AlertTriangle,
    Plus,
} from "lucide-react";
import { useToast } from "@ui/Toast";
import { PageHeaderWithDocs } from "@ui/PageHeaderWithDocs";
import type { RoleTemplate } from "@/lib/RoleTemplates";

import { AccountAccessDenied } from "./account/AccountAccessDenied";
import { RoleCard } from "./account/RoleCard";

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
        return <AccountAccessDenied />;
    }

    // Merge hardcoded roles and dynamic custom roles
    const baseRoles = Object.keys(ROLE_LABELS);
    const allRoles = [...baseRoles, ...(customRoles || []).map((r: Record<string, unknown>) => r.id as string)];

    const getRoleLabel = (roleId: string) => {
        if (ROLE_LABELS[roleId as UserRole]) return ROLE_LABELS[roleId as UserRole];
        const custom = customRoles?.find((r: Record<string, unknown>) => r.id === roleId);
        return custom ? (custom.label as string) : roleId;
    };

    const toggleCategory = (role: UserRole | string, category: CategoryKey) => {
        const currentCategories = pendingChanges[role] || rolePermissions[role as UserRole] || [];
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

    const hasChanges = (role: UserRole | string) => {
        return !!pendingChanges[role];
    };

    const getCategories = (role: UserRole | string): CategoryKey[] => {
        return pendingChanges[role] || rolePermissions[role as UserRole] || [];
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
                {allRoles.map(role => (
                    <RoleCard
                        key={role}
                        role={role}
                        isExpanded={expandedRole === role}
                        userCount={getUserCountByRole(role)}
                        categories={getCategories(role)}
                        hasChanges={hasChanges(role)}
                        allRoles={allRoles}
                        users={users}
                        baseRoles={baseRoles}
                        reassigningUserId={reassigningUserId}
                        getRoleLabel={getRoleLabel}
                        onToggleExpand={() => setExpandedRole(expandedRole === role ? null : role)}
                        onToggleCategory={toggleCategory}
                        onApplyTemplate={applyTemplate}
                        onSaveRolePermissions={saveRolePermissions}
                        onDeleteRole={handleDeleteRole}
                        onAssignRole={handleAssignRole}
                    />
                ))}
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
