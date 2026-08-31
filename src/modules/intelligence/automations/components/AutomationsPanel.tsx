"use client";

import React, { useState } from 'react';
import { Zap, Plus, Trash2, Pause, Play, Edit3 } from 'lucide-react';
import { useAutomations } from '../hooks/useAutomations';
import { AUTOMATION_TRIGGER_WHITELIST, type AutomationRule } from '../domain/AutomationRule';
import { AutomationBuilder } from './AutomationBuilder';
import { ActionGuard } from '@/shared/components/rbac/ActionGuard';
import { Button } from '@/shared/components/ui/Button';

/**
 * AutomationsPanel — liste + création d'automatisations métier.
 * Accessible aux rôles admin/directeur (garde ActionGuard + page RBAC).
 */
export function AutomationsPanel() {
    const { automations, isLoading, create, toggle, remove } = useAutomations();
    const [builderOpen, setBuilderOpen] = useState(false);
    const [editing, setEditing] = useState<AutomationRule | null>(null);

    if (isLoading) {
        return <div className="p-8 text-text-muted">Chargement…</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-text-primary flex items-center gap-2">
                        <Zap className="w-5 h-5 text-brand" />
                        Mes automatisations
                    </h2>
                    <p className="text-sm text-text-muted mt-1">
                        {automations.length} règle{automations.length > 1 ? 's' : ''} — le socle réagit tout seul aux événements du service.
                    </p>
                </div>
                <ActionGuard page="automations" action="create_automation">
                    <Button variant="default" onClick={() => { setEditing(null); setBuilderOpen(true); }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Nouvelle règle
                    </Button>
                </ActionGuard>
            </div>

            {automations.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-border-subtle rounded-2xl bg-surface-card">
                    <Zap className="w-8 h-8 text-text-muted mx-auto mb-3" />
                    <p className="text-text-primary font-semibold">Aucune automatisation encore</p>
                    <p className="text-sm text-text-muted mt-2">{"Crée ta première règle pour que le socle réagisse à ta place."}</p>
                </div>
            ) : (
                <ul className="space-y-3">
                    {automations.map(rule => {
                        const triggerLabel = AUTOMATION_TRIGGER_WHITELIST.find(t => t.event === rule.trigger.event)?.label ?? rule.trigger.event;
                        return (
                            <li key={rule.id} className="p-4 border border-border-subtle rounded-2xl bg-surface-card flex items-center gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-text-primary truncate">{rule.name}</p>
                                        <span className={rule.enabled ? "px-2 py-0.5 rounded-full text-xs bg-status-success/15 text-status-success" : "px-2 py-0.5 rounded-full text-xs bg-status-warning/15 text-status-warning"}>
                                            {rule.enabled ? 'Active' : 'En pause'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-text-muted mt-1">
                                        Quand <span className="text-text-primary font-semibold">{triggerLabel}</span>
                                        {rule.conditions.length > 0 && <> · {rule.conditions.length} condition{rule.conditions.length > 1 ? 's' : ''}</>}
                                        {' · '}{rule.actions.length} action{rule.actions.length > 1 ? 's' : ''}
                                    </p>
                                    <p className="text-xs text-text-muted mt-1">
                                        Déclenchée {rule.executionCount ?? 0} fois
                                        {rule.lastExecutedAt && ` · dernière : ${new Date(rule.lastExecutedAt).toLocaleString('fr-FR')}`}
                                        {rule.lastError && <span className="text-status-danger ml-2">⚠ {rule.lastError}</span>}
                                    </p>
                                </div>
                                <ActionGuard page="automations" action="toggle_automation" disabledMode="disable">
                                    <button
                                        aria-label={rule.enabled ? "Mettre en pause" : "Activer"}
                                        onClick={() => toggle(rule.id, !rule.enabled)}
                                        className="p-2 rounded-lg hover:bg-surface-hover text-text-secondary hover:text-text-primary"
                                    >
                                        {rule.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                    </button>
                                </ActionGuard>
                                <ActionGuard page="automations" action="create_automation" disabledMode="disable">
                                    <button
                                        aria-label="Modifier"
                                        onClick={() => { setEditing(rule); setBuilderOpen(true); }}
                                        className="p-2 rounded-lg hover:bg-surface-hover text-text-secondary hover:text-text-primary"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                </ActionGuard>
                                <ActionGuard page="automations" action="delete_automation" disabledMode="disable">
                                    <button
                                        aria-label="Supprimer"
                                        onClick={() => { if (confirm(`Supprimer "${rule.name}" ?`)) remove(rule.id); }}
                                        className="p-2 rounded-lg hover:bg-status-danger/10 text-text-secondary hover:text-status-danger"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </ActionGuard>
                            </li>
                        );
                    })}
                </ul>
            )}

            {builderOpen && (
                <AutomationBuilder
                    initial={editing}
                    onClose={() => { setBuilderOpen(false); setEditing(null); }}
                    onSubmit={async (input) => {
                        if (editing) {
                            await import('../hooks/useAutomations'); // no-op — update non implémenté en MVP
                        } else {
                            await create({ ...input, createdBy: 'current_user' });
                        }
                        setBuilderOpen(false);
                        setEditing(null);
                    }}
                />
            )}
        </div>
    );
}
