'use client';

import { Check, X } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import {
    ALL_CATEGORIES,
    CATEGORY_LABELS,
    CATEGORY_FEATURES,
    type CategoryKey,
} from "@/lib/AccessPolicyManager";

interface RoleCategoriesGridProps {
    role: string;
    categories: CategoryKey[];
    onToggleCategory: (role: string, category: CategoryKey) => void;
}

export function RoleCategoriesGrid({
    role,
    categories,
    onToggleCategory,
}: RoleCategoriesGridProps) {
    return (
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
                                onClick={() => onToggleCategory(role, category)}
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
                                                    onClick={() => onToggleCategory(role, feature.id)}
                                                    className={cn(
                                                        "w-4 h-4 mt-0.5 rounded flex items-center justify-center shrink-0 transition-colors border",
                                                        isFeatureEnabled
                                                            ? "bg-action-primary border-action-primary text-text-primary"
                                                            : "bg-transparent border-border-default dark:border-text-muted group-hover:border-action-primary"
                                                    )}
                                                >
                                                    {isFeatureEnabled && <Check className="w-3 h-3" />}
                                                </div>
                                                <div className="flex flex-col flex-1 min-w-0" onClick={() => onToggleCategory(role, feature.id)}>
                                                    <span className={cn(
                                                        "text-xs font-semibold truncate",
                                                        isFeatureEnabled ? "text-text-primary" : "text-text-muted"
                                                    )}>
                                                        {feature.label}
                                                    </span>
                                                    {feature.description && (
                                                        <span className="text-nano text-text-muted/70 leading-tight mt-0.5 whitespace-normal">
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
    );
}
