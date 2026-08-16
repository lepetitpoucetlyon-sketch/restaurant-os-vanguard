'use client';

import type { User } from "@nexus/contracts";

interface RoleUsersListProps {
    users: User[];
    role: string;
    allRoles: string[];
    reassigningUserId: string | null;
    getRoleLabel: (roleId: string) => string;
    onAssignRole: (userId: string, newRole: string) => void;
}

export function RoleUsersList({
    users,
    role,
    allRoles,
    reassigningUserId,
    getRoleLabel,
    onAssignRole,
}: RoleUsersListProps) {
    const roleUsers = users.filter(u => u.role === role);

    return (
        <div className="mb-6">
            <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">
                Utilisateurs avec ce rôle
            </h4>
            <div className="flex flex-wrap gap-2">
                {roleUsers.map((user: User) => (
                    <div
                        key={user.id}
                        className="flex items-center gap-2 bg-surface-bg dark:bg-bg-tertiary px-3 py-2 rounded-xl"
                    >
                        <div className="w-6 h-6 rounded-full bg-text-primary dark:bg-action-primary text-text-primary dark:text-bg-primary text-[10px] font-bold flex items-center justify-center">
                            {(user.name || '').charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-text-muted">{user.name}</span>
                        <select
                            disabled={reassigningUserId === user.id}
                            defaultValue={user.role}
                            onChange={e => onAssignRole(user.id, e.target.value)}
                            className="ml-1 text-[11px] bg-transparent border border-action-primary/20 rounded-lg px-2 py-1 text-text-muted cursor-pointer hover:border-action-primary/60 disabled:opacity-50 transition-colors"
                            title="Changer le rôle"
                        >
                            {allRoles.map(r => (
                                <option key={r} value={r}>{getRoleLabel(r)}</option>
                            ))}
                        </select>
                    </div>
                ))}
                {roleUsers.length === 0 && (
                    <span className="text-sm text-text-muted italic">Aucun utilisateur</span>
                )}
            </div>
        </div>
    );
}
