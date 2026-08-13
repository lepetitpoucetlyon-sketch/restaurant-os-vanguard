"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/kernel/providers/NexusCoreProvider";
import { useTenant } from "@/kernel/hooks";
import { Loader2, Save } from "lucide-react";
import { useAtom } from "jotai";
import { rbacConfigAtom, fetchRbacConfigAtom } from "@/store/pillars/rbac";
import { resolveRoleLabels } from "@/verticals/_shared/roles";
import { logger } from "@/lib/logger";

export function RolesPermissionsPanel() {
    const { currentUser } = useAuth();
    const { activeTenantConfig } = useTenant();
    const [config, setConfig] = useAtom(rbacConfigAtom);
    const [, fetchConfig] = useAtom(fetchRbacConfigAtom);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const variant = activeTenantConfig?.variant ?? 'restaurant';
    const roleLabels = useMemo(() => resolveRoleLabels(variant), [variant]);
    const sortedLevels = useMemo(
        () => Object.keys(roleLabels).map(Number).sort((a, b) => b - a),
        [roleLabels]
    );

    useEffect(() => {
        if (currentUser?.tenantId) {
            setIsLoading(true);
            fetchConfig(currentUser.tenantId).finally(() => setIsLoading(false));
        }
    }, [currentUser?.tenantId, fetchConfig]);

    const handleSave = async () => {
        if (!currentUser?.tenantId || !config) return;

        setIsSaving(true);
        try {
            const res = await fetch(`/api/admin/rbac?tenantId=${currentUser.tenantId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(config),
            });

            if (!res.ok) {
                throw new Error("Failed to save RBAC config");
            }

            await fetchConfig(currentUser.tenantId);
        } catch (error) {
            logger.error("Error saving RBAC config:", error);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-32 w-full items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
            </div>
        );
    }

    return (
        <div className="bg-surface-card rounded-2xl border border-border p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-text-primary">Rôles & Permissions (RBAC)</h2>
                    <p className="text-sm text-text-muted mt-1">
                        Libellés adaptés à la verticale <strong>{variant}</strong>. Les niveaux numériques sont invariants.
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-xl hover:bg-brand-secondary transition-colors disabled:opacity-50"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Sauvegarder
                </button>
            </div>

            <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-bg-tertiary text-text-secondary">
                        <tr>
                            <th className="px-4 py-2 text-left font-medium w-24">Niveau</th>
                            <th className="px-4 py-2 text-left font-medium">Libellé ({variant})</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedLevels.map((level) => (
                            <tr key={level} className="border-t border-border/50 hover:bg-bg-tertiary/40">
                                <td className="px-4 py-2 tabular-nums font-mono text-text-muted">{level}</td>
                                <td className="px-4 py-2 text-text-primary">{roleLabels[level]}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <details className="p-4 bg-bg-tertiary rounded-xl border border-border/50 text-sm text-text-secondary">
                <summary className="cursor-pointer font-medium">Configuration RBAC brute (Delta JSON)</summary>
                <p className="mt-2 text-xs">
                    L'interface détaillée (matrice visuelle) est en cours de développement.
                    Actuellement, la configuration est stockée dans Sovereign Nexus et chargée dynamiquement.
                </p>
                <pre className="mt-4 p-4 bg-black/50 rounded-lg overflow-auto max-h-[400px] text-xs">
                    {JSON.stringify(config, null, 2)}
                </pre>
            </details>
        </div>
    );
}
