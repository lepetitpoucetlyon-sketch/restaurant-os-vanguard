'use client';

import { Unlock, ChevronDown, ChevronUp, Save, Trash } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { ROLE_LABELS, type CategoryKey } from "@/lib/AccessPolicyManager";
import { ROLE_TEMPLATES, type RoleTemplate } from "@/lib/RoleTemplates";
import type { UserRole, User } from "@nexus/contracts";
import { RoleUsersList } from "./RoleUsersList";
import { RoleCategoriesGrid } from "./RoleCategoriesGrid";

interface RoleCardProps {
    role: string;
    isExpanded: boolean;
    userCount: number;
    categories: CategoryKey[];
    hasChanges: boolean;
    allRoles: string[];
    users: User[];
    baseRoles: string[];
    reassigningUserId: string | null;
    getRoleLabel: (roleId: string) => string;
    onToggleExpand: () => void;
    onToggleCategory: (role: string, category: CategoryKey) => void;
    onApplyTemplate: (role: UserRole, template: RoleTemplate) => void;
    onSaveRolePermissions: (role: UserRole) => void;
    onDeleteRole: (roleId: string) => void;
    onAssignRole: (userId: string, newRole: string) => void;
}

export function RoleCard({
    role,
    isExpanded,
    userCount,
    categories,
    hasChanges,
    allRoles,
    users,
    baseRoles,
    reassigningUserId,
    getRoleLabel,
    onToggleExpand,
    onToggleCategory,
    onApplyTemplate,
    onSaveRolePermissions,
    onDeleteRole,
    onAssignRole,
}: RoleCardProps) {
    const isAdmin = role === 'admin';

    return (
        <div
            className={cn(
                "bg-surface-card dark:bg-bg-secondary rounded-3xl border transition-all duration-300 overflow-hidden",
                isExpanded ? "border-action-primary shadow-xl shadow-[var(--action-primary)]/5" : "border-border-default dark:border-border hover:border-border-default dark:hover:border-text-muted"
            )}
        >
            {/* Role Header */}
            <button
                onClick={onToggleExpand}
                className="w-full flex items-center justify-between p-6 text-left"
            >
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center text-text-primary dark:text-bg-primary font-black text-lg",
                        isAdmin ? "bg-gradient-to-br from-status-warning to-status-warning" : "bg-text-primary"
                    )}>
                        {(ROLE_LABELS[role as UserRole] || '').charAt(0)}
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-text-primary">{getRoleLabel(role)}</h3>
                        <p className="text-sm text-text-muted">
                            {userCount} utilisateur{userCount > 1 ? 's' : ''} • {categories.length} catégories accessibles
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {hasChanges && (
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
                            <RoleUsersList
                                users={users}
                                role={role}
                                allRoles={allRoles}
                                reassigningUserId={reassigningUserId}
                                getRoleLabel={getRoleLabel}
                                onAssignRole={onAssignRole}
                            />

                            {/* Role Templates */}
                            <div className="mb-6">
                                <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">
                                    Appliquer un template
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {ROLE_TEMPLATES.map((tpl: RoleTemplate) => (
                                        <button
                                            key={tpl.id}
                                            onClick={() => onApplyTemplate(role as UserRole, tpl)}
                                            className="px-4 py-2 rounded-xl border border-action-primary/30 bg-action-primary/5 text-action-primary text-sm font-semibold hover:bg-action-primary/10 transition-colors"
                                            title={tpl.description}
                                        >
                                            {tpl.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Categories Grid */}
                            <RoleCategoriesGrid
                                role={role}
                                categories={categories}
                                onToggleCategory={onToggleCategory}
                            />

                            {/* Save & Delete Buttons */}
                            <div className="flex items-center gap-4">
                                {hasChanges && (
                                    <button
                                        onClick={() => onSaveRolePermissions(role as UserRole)}
                                        className="flex items-center gap-2 bg-success text-text-primary px-6 py-3 rounded-xl font-bold hover:bg-success/90 transition-colors shadow-lg shadow-success/20"
                                    >
                                        <Save className="w-5 h-5" />
                                        Sauvegarder les modifications
                                    </button>
                                )}
                                {!baseRoles.includes(role) && (
                                    <button
                                        onClick={() => onDeleteRole(role)}
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
}
