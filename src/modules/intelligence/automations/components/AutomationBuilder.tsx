"use client";

import React, { useState } from 'react';
import { X, Zap, Plus, Trash2 } from 'lucide-react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { AUTOMATION_TRIGGER_WHITELIST, type AutomationRule, type AutomationCondition, type AutomationAction } from '../domain/AutomationRule';

interface AutomationBuilderProps {
    initial: AutomationRule | null;
    onClose: () => void;
    onSubmit: (input: Omit<AutomationRule, 'id' | 'tenantId' | 'createdAt' | 'updatedAt' | 'executionCount'>) => void | Promise<void>;
}

const OPS: Array<{ v: AutomationCondition['op']; l: string }> = [
    { v: 'eq', l: 'égal à' },
    { v: 'neq', l: 'différent de' },
    { v: 'gt', l: '>' },
    { v: 'gte', l: '≥' },
    { v: 'lt', l: '<' },
    { v: 'lte', l: '≤' },
    { v: 'includes', l: 'contient' },
];

export function AutomationBuilder({ initial, onClose, onSubmit }: AutomationBuilderProps) {
    const [name, setName] = useState(initial?.name ?? '');
    const [description, setDescription] = useState(initial?.description ?? '');
    const [event, setEvent] = useState<string>(initial?.trigger.event ?? AUTOMATION_TRIGGER_WHITELIST[0].event);
    const [conditions, setConditions] = useState<AutomationCondition[]>(initial?.conditions ?? []);
    const [actions, setActions] = useState<AutomationAction[]>(initial?.actions ?? [{ type: 'notify', title: '', message: '', priority: 'normal' }]);
    const [saving, setSaving] = useState(false);

    const addCondition = () => setConditions([...conditions, { field: '', op: 'eq', value: '' }]);
    const removeCondition = (i: number) => setConditions(conditions.filter((_, x) => x !== i));
    const updateCondition = (i: number, patch: Partial<AutomationCondition>) =>
        setConditions(conditions.map((c, x) => x === i ? { ...c, ...patch } : c));

    const addAction = () => setActions([...actions, { type: 'notify', title: '', message: '', priority: 'normal' }]);
    const removeAction = (i: number) => setActions(actions.filter((_, x) => x !== i));
    const updateAction = (i: number, patch: Partial<AutomationAction>) =>
        setActions(actions.map((a, x) => x === i ? { ...a, ...patch } as AutomationAction : a));

    const submit = async () => {
        if (!name.trim() || actions.length === 0) return;
        setSaving(true);
        try {
            await onSubmit({
                name: name.trim(),
                description: description.trim() || undefined,
                enabled: initial?.enabled ?? true,
                trigger: { event },
                conditions,
                actions,
                createdBy: initial?.createdBy ?? 'current_user',
            });
        } finally {
            setSaving(false);
        }
    };

    const selectedTrigger = AUTOMATION_TRIGGER_WHITELIST.find(t => t.event === event);

    return (
        <Modal isOpen={true} onClose={onClose} size="lg">
            <div className="p-6 space-y-6 max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-text-primary flex items-center gap-2">
                        <Zap className="w-5 h-5 text-brand" />
                        {initial ? 'Modifier la règle' : 'Nouvelle règle automatique'}
                    </h3>
                    <button aria-label="Fermer" onClick={onClose} className="p-2 rounded-lg hover:bg-surface-hover">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="space-y-2">
                    <label className="text-sm text-text-secondary font-semibold">{"Nom de la règle"}</label>
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex : Alerter le sommelier pour les grandes tables" />
                </div>

                <div className="space-y-2">
                    <label className="text-sm text-text-secondary font-semibold">Description (optionnelle)</label>
                    <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Contexte, pourquoi cette règle…" />
                </div>

                {/* WHEN */}
                <div className="space-y-2 p-4 rounded-2xl bg-surface-card border border-border-subtle">
                    <div className="flex items-center gap-2 text-sm text-text-secondary font-semibold uppercase tracking-wider">
                        <span className="px-2 py-0.5 rounded bg-brand/15 text-brand text-xs">Quand</span>
                    </div>
                    <select value={event} onChange={e => setEvent(e.target.value)} className="w-full h-11 rounded-xl border border-border-default bg-surface-card px-4 text-sm">
                        {AUTOMATION_TRIGGER_WHITELIST.map(t => (
                            <option key={t.event} value={t.event}>{t.label} — {t.event}</option>
                        ))}
                    </select>
                    {selectedTrigger && <p className="text-xs text-text-muted mt-1 italic">Exemple : {selectedTrigger.example}</p>}
                </div>

                {/* IF */}
                <div className="space-y-3 p-4 rounded-2xl bg-surface-card border border-border-subtle">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-text-secondary font-semibold uppercase tracking-wider">
                            <span className="px-2 py-0.5 rounded bg-status-info/15 text-status-info text-xs">Si (optionnel)</span>
                        </div>
                        <button aria-label="Ajouter condition" onClick={addCondition} className="text-xs text-brand hover:underline">+ condition</button>
                    </div>
                    {conditions.length === 0 && <p className="text-xs text-text-muted italic">{"Sans conditions, la règle se déclenche à chaque événement."}</p>}
                    {conditions.map((c, i) => (
                        <div key={i} className="flex gap-2 items-center">
                            <Input value={c.field} onChange={e => updateCondition(i, { field: e.target.value })} placeholder="Champ (ex: covers, totalInMicrounits)" />
                            <select value={c.op} onChange={e => updateCondition(i, { op: e.target.value as AutomationCondition['op'] })} className="h-11 rounded-xl border border-border-default bg-surface-card px-3 text-sm">
                                {OPS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                            </select>
                            <Input value={String(c.value)} onChange={e => updateCondition(i, { value: e.target.value })} placeholder="Valeur" />
                            <button aria-label="Retirer condition" onClick={() => removeCondition(i)} className="p-2 text-text-secondary hover:text-status-danger"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    ))}
                </div>

                {/* THEN */}
                <div className="space-y-3 p-4 rounded-2xl bg-surface-card border border-border-subtle">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-text-secondary font-semibold uppercase tracking-wider">
                            <span className="px-2 py-0.5 rounded bg-status-success/15 text-status-success text-xs">Alors</span>
                        </div>
                        <button aria-label="Ajouter action" onClick={addAction} className="text-xs text-brand hover:underline">+ action</button>
                    </div>
                    {actions.map((a, i) => (
                        <div key={i} className="p-3 rounded-xl bg-surface-hover space-y-2">
                            <div className="flex items-center justify-between">
                                <select value={a.type} onChange={e => {
                                    const t = e.target.value;
                                    if (t === 'notify') updateAction(i, { type: 'notify', title: '', message: '', priority: 'normal' } as AutomationAction);
                                    if (t === 'email')  updateAction(i, { type: 'email', to: '', subject: '', body: '' } as AutomationAction);
                                    if (t === 'webhook')updateAction(i, { type: 'webhook', url: 'https://', method: 'POST' } as AutomationAction);
                                }} className="h-9 rounded-lg border border-border-default bg-surface-card px-3 text-sm">
                                    <option value="notify">{"Notifier l'équipe"}</option>
                                    <option value="email">Envoyer email</option>
                                    <option value="webhook">Webhook externe</option>
                                </select>
                                <button aria-label="Retirer action" onClick={() => removeAction(i)} className="p-1 text-text-secondary hover:text-status-danger"><Trash2 className="w-4 h-4" /></button>
                            </div>
                            {a.type === 'notify' && (
                                <>
                                    <Input value={a.title} onChange={e => updateAction(i, { title: e.target.value } as Partial<AutomationAction>)} placeholder="Titre" />
                                    <Input value={a.message} onChange={e => updateAction(i, { message: e.target.value } as Partial<AutomationAction>)} placeholder="Message (tokens : {{payload.covers}})" />
                                </>
                            )}
                            {a.type === 'email' && (
                                <>
                                    <Input value={a.to} onChange={e => updateAction(i, { to: e.target.value } as Partial<AutomationAction>)} placeholder="Destinataire (ou {{payload.customerEmail}})" />
                                    <Input value={a.subject} onChange={e => updateAction(i, { subject: e.target.value } as Partial<AutomationAction>)} placeholder="Sujet" />
                                    <Input value={a.body} onChange={e => updateAction(i, { body: e.target.value } as Partial<AutomationAction>)} placeholder="Corps de l'email" />
                                </>
                            )}
                            {a.type === 'webhook' && (
                                <>
                                    <Input value={a.url} onChange={e => updateAction(i, { url: e.target.value } as Partial<AutomationAction>)} placeholder="https://votre-service.com/webhook" />
                                </>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-border-subtle">
                    <Button variant="ghost" onClick={onClose}>Annuler</Button>
                    <Button variant="default" onClick={submit} disabled={saving || !name.trim() || actions.length === 0}>
                        <Plus className="w-4 h-4 mr-2" />
                        {saving ? 'Enregistrement…' : 'Créer la règle'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
