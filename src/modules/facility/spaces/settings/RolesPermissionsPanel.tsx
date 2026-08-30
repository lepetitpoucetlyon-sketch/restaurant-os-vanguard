// @wip owner:facility-team échéance:2026-Q4 — composant orphelin à intégrer ou supprimer (audit orphelins 2026-08-30)
"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/shared/providers/NexusCoreProvider";
import { Loader2, Save } from "lucide-react";
import { useAtom } from "jotai";
import { rbacConfigAtom, fetchRbacConfigAtom } from "@/store/pillars/rbac";

export function RolesPermissionsPanel() {
    const { currentUser } = useAuth();
    const [config, setConfig] = useAtom(rbacConfigAtom);
    const [, fetchConfig] = useAtom(fetchRbacConfigAtom);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

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
            
            // Reload config
            await fetchConfig(currentUser.tenantId);
        } catch (error) {
            console.error("Error saving RBAC config:", error);
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
                    <h2 className="text-xl font-bold text-text-primary">Roles & Permissions (RBAC)</h2>
                    <p className="text-sm text-text-muted mt-1">
                        Configure page and tab access overrides for this tenant.
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

            <div className="p-4 bg-bg-tertiary rounded-xl border border-border/50 text-sm text-text-secondary">
                <p>
                    <strong>Note:</strong> L'interface détaillée (matrice visuelle) est en cours de développement. 
                    Actuellement, la configuration (Delta JSON) est stockée dans Sovereign Nexus et chargée dynamiquement.
                </p>
                <pre className="mt-4 p-4 bg-black/50 rounded-lg overflow-auto max-h-[400px] text-xs">
                    {JSON.stringify(config, null, 2)}
                </pre>
            </div>
        </div>
    );
}
