'use client';

/**
 * 🎨 CustomFieldRenderer — Rendu automatique des champs personnalisés.
 *
 * Composant React universel qui rend un champ personnalisé en fonction de sa
 * définition (type, contraintes, display). Inséré automatiquement dans les
 * formulaires et fiches de synthèse via le layout engine.
 *
 * Gère la conversion affichage ↔ stockage pour les champs `currency`
 * (euros affichés → centimes stockés).
 */

import React from 'react';
import {
    type CustomFieldDef,
    type CustomFieldValue,
    currencyToMicrounits,
    microunitsToCurrency,
} from './types';
import { cn } from '@/lib/ui.foundations';

interface CustomFieldRendererProps {
    /** Définition du champ. */
    field: CustomFieldDef;
    /** Valeur courante. */
    value: CustomFieldValue;
    /** Callback de mise à jour. */
    onChange: (key: string, value: CustomFieldValue) => void;
    /** Mode lecture seule (fiche de synthèse). */
    readOnly?: boolean;
    className?: string;
}

export function CustomFieldRenderer({
    field,
    value,
    onChange,
    readOnly = false,
    className,
}: CustomFieldRendererProps) {
    const handleChange = (newValue: CustomFieldValue) => {
        onChange(field.key, newValue);
    };

    const widthClass =
        field.display?.width === 'half' ? 'col-span-1' :
        field.display?.width === 'third' ? 'col-span-1' :
        'col-span-full';

    return (
        <div className={cn(widthClass, className)}>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
                {field.label}
                {field.required && <span className="text-status-danger ml-0.5">*</span>}
            </label>

            {renderInput(field, value, handleChange, readOnly)}

            {field.display?.helpText && (
                <p className="text-[10px] text-text-muted mt-1">{field.display.helpText}</p>
            )}
        </div>
    );
}

function renderInput(
    field: CustomFieldDef,
    value: CustomFieldValue,
    onChange: (v: CustomFieldValue) => void,
    readOnly: boolean,
) {
    const inputClass = 'w-full px-3 py-2 text-xs rounded-lg border border-border-default bg-surface-bg';

    switch (field.type) {
        case 'text':
        case 'email':
        case 'phone':
        case 'url':
            return (
                <input
                    type={field.type === 'text' ? 'text' : field.type}
                    value={(value as string) ?? ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={field.display?.placeholder}
                    readOnly={readOnly}
                    className={inputClass}
                    maxLength={field.constraints?.maxLength}
                />
            );

        case 'number':
            return (
                <input
                    type="number"
                    value={(value as number) ?? ''}
                    onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
                    min={field.constraints?.min}
                    max={field.constraints?.max}
                    readOnly={readOnly}
                    className={inputClass}
                />
            );

        case 'currency': {
            // Afficher en euros, stocker en centimes
            const displayVal = typeof value === 'number' ? microunitsToCurrency(value) : '';
            return (
                <div className="relative">
                    <input
                        type="number"
                        step="0.01"
                        value={displayVal}
                        onChange={(e) => {
                            const parsed = parseFloat(e.target.value);
                            onChange(isNaN(parsed) ? null : currencyToMicrounits(parsed));
                        }}
                        readOnly={readOnly}
                        className={cn(inputClass, 'pr-8')}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted font-mono">
                        {field.constraints?.currency ?? '€'}
                    </span>
                </div>
            );
        }

        case 'date':
            return (
                <input
                    type="date"
                    value={(value as string) ?? ''}
                    onChange={(e) => onChange(e.target.value || null)}
                    readOnly={readOnly}
                    className={inputClass}
                />
            );

        case 'datetime':
            return (
                <input
                    type="datetime-local"
                    value={(value as string) ?? ''}
                    onChange={(e) => onChange(e.target.value || null)}
                    readOnly={readOnly}
                    className={inputClass}
                />
            );

        case 'boolean':
            return (
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={Boolean(value)}
                        onChange={(e) => onChange(e.target.checked)}
                        disabled={readOnly}
                        className="w-4 h-4 rounded border-border-default text-action-primary focus:ring-action-primary"
                    />
                    <span className="text-xs text-text-primary">{field.label}</span>
                </label>
            );

        case 'select':
            return (
                <select
                    value={(value as string) ?? ''}
                    onChange={(e) => onChange(e.target.value || null)}
                    disabled={readOnly}
                    className={inputClass}
                >
                    <option value="">— Sélectionner —</option>
                    {field.constraints?.options?.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            );

        case 'multiselect': {
            const selected = Array.isArray(value) ? value : [];
            return (
                <div className="flex flex-wrap gap-1.5">
                    {field.constraints?.options?.map((opt) => {
                        const isSelected = selected.includes(opt);
                        return (
                            <button
                                key={opt}
                                type="button"
                                onClick={() => {
                                    if (readOnly) return;
                                    const next = isSelected
                                        ? selected.filter((s) => s !== opt)
                                        : [...selected, opt];
                                    onChange(next);
                                }}
                                className={cn(
                                    'px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all',
                                    isSelected
                                        ? 'border-action-primary bg-action-primary/10 text-action-primary'
                                        : 'border-border-default bg-surface-card text-text-secondary',
                                )}
                            >
                                {opt}
                            </button>
                        );
                    })}
                </div>
            );
        }

        case 'color':
            return (
                <div className="flex items-center gap-2">
                    <input
                        type="color"
                        value={(value as string) ?? '#000000'}
                        onChange={(e) => onChange(e.target.value)}
                        disabled={readOnly}
                        className="w-10 h-10 rounded-lg cursor-pointer border border-border-default"
                    />
                    <input
                        type="text"
                        value={(value as string) ?? ''}
                        onChange={(e) => onChange(e.target.value)}
                        readOnly={readOnly}
                        className={cn(inputClass, 'flex-1 font-mono')}
                    />
                </div>
            );

        case 'rating': {
            const stars = typeof value === 'number' ? value : 0;
            return (
                <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => !readOnly && onChange(star)}
                            className={cn(
                                'text-lg transition-all',
                                star <= stars ? 'text-accent-gold' : 'text-text-muted/40',
                                !readOnly && 'hover:scale-110 cursor-pointer',
                            )}
                        >
                            ★
                        </button>
                    ))}
                </div>
            );
        }

        default:
            return <div className="text-xs text-text-muted">Type non supporté : {field.type}</div>;
    }
}
