// @wip owner:ops-team échéance:2026-Q4 — composant orphelin à intégrer ou supprimer (audit orphelins 2026-08-30)
"use client";

import { Clock, Timer, Users } from "lucide-react";
import { PremiumSelect } from "@ui/PremiumSelect";
import { cn } from "@/lib/ui.foundations";
import { Recipe } from "@nexus/contracts";

interface RecipeBasicsTabProps {
    formData: Partial<Recipe>;
    setFormDraft: (data: Partial<Recipe> | ((prev: Partial<Recipe>) => Partial<Recipe>)) => void;
    initialFormData: Partial<Recipe>;
    categories: string[];
    colors: string[];
}

export function RecipeBasicsTab({
    formData,
    setFormDraft,
    initialFormData,
    categories,
    colors
}: RecipeBasicsTabProps) {
    return (
        <div className="space-y-10">
            <div className="grid grid-cols-2 gap-8">
                <div className="col-span-2 lg:col-span-1">
                    <label className="text-nano font-black text-text-muted uppercase tracking-[0.2em] mb-4 block">Dénomination Commerciale</label>
                    <input
                        type="text"
                        value={formData.name as string}
                        onChange={(e) => setFormDraft((prev: Partial<Recipe>) => ({ ...(prev ?? initialFormData), name: e.target.value } as Partial<Recipe>))}
                        className="w-full h-16 px-8 bg-surface-card rounded-3xl border-2 border-border focus:border-accent font-serif font-black text-xl outline-none transition-all placeholder:text-text-muted/30"
                        placeholder="Ex: Risotto aux Morilles & Truffe..."
                    />
                </div>
                <div>
                    <PremiumSelect
                        label="Catégorie du Menu"
                        value={(formData.category as string) || ''}
                        onChange={(val) => setFormDraft((prev: Partial<Recipe>) => ({ ...(prev ?? initialFormData), category: val } as Partial<Recipe>))}
                        options={categories.map(cat => ({ value: cat, label: cat.toUpperCase() }))}
                    />
                </div>
            </div>

            <div>
                <label className="text-nano font-black text-text-muted uppercase tracking-[0.2em] mb-4 block">Description Gastronomique</label>
                <textarea
                    value={String(formData.description || '')}
                    onChange={(e) => setFormDraft((prev: Partial<Recipe>) => ({ ...(prev ?? initialFormData), description: e.target.value } as Partial<Recipe>))}
                    className="w-full h-32 px-8 py-6 bg-surface-card rounded-[2rem] border-2 border-border focus:border-accent font-bold text-sm outline-none resize-none transition-all placeholder:text-text-muted/30"
                    placeholder="Texte court pour le menu ou le personnel de salle..."
                />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Préparation', value: formData.prepTime, key: 'prepTime' as const, icon: Clock, unit: 'MIN' },
                    { label: 'Cuisson', value: formData.cookTime, key: 'cookTime' as const, icon: Timer, unit: 'MIN' },
                    { label: 'Portions', value: formData.portions, key: 'portions' as const, icon: Users, unit: 'PAX' },
                ].map(item => (
                    <div key={item.key} className="bg-surface-card p-6 rounded-[2rem] border border-border/50">
                        <label className="text-nano font-black text-text-muted uppercase tracking-[0.2em] mb-3 block flex items-center gap-2">
                            <item.icon className="w-3.5 h-3.5" />
                            {item.label}
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="number"
                                value={Number(item.value || 0)}
                                onChange={(e) => setFormDraft((prev: Partial<Recipe>) => ({ ...(prev ?? initialFormData), [item.key]: parseInt(e.target.value) || 0 } as Partial<Recipe>))}
                                className="w-full h-12 px-4 bg-bg-tertiary rounded-xl font-black text-lg outline-none"
                            />
                            <span className="text-nano font-black text-text-muted">{item.unit}</span>
                        </div>
                    </div>
                ))}

                <div className="bg-surface-card p-6 rounded-[2rem] border border-border/50">
                    <PremiumSelect
                        label="Expertise"
                        value={(formData.difficulty as unknown as string) ?? "medium"}
                        onChange={(val) => setFormDraft((prev: Partial<Recipe>) => ({ ...(prev ?? initialFormData), difficulty: val as Recipe["difficulty"] }))}
                        options={[
                            { value: 'easy', label: 'FACILE' },
                            { value: 'medium', label: 'MAÎTRISÉ' },
                            { value: 'hard', label: 'EXPERT' }
                        ]}
                    />
                </div>
            </div>

            <div>
                <label className="text-nano font-black text-text-muted uppercase tracking-[0.2em] mb-4 block">Code Couleur Visuel</label>
                <div className="flex gap-4 p-4 bg-surface-card rounded-3xl border border-border/50 overflow-x-auto no-scrollbar">
                    {colors.map(color => (
                        <button
                            key={color}
                            onClick={() => setFormDraft((prev: Partial<Recipe>) => ({ ...(prev ?? initialFormData), color } as Partial<Recipe>))}
                            className={cn(
                                "w-12 h-12 rounded-2xl transition-all shrink-0 border-4",
                                formData.color === color ? "border-accent scale-110 shadow-lg shadow-black/10" : "border-transparent opacity-60 hover:opacity-100"
                            )}
                            style={{ backgroundColor: color }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
