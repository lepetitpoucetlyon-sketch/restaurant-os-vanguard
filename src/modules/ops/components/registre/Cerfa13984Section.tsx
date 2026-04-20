"use client";

import { useRegistre } from "@/context/RegistreContext";
import { ShieldCheck, Calendar, Clock, Building2, FileText, Download, Send, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Cerfa13984Section() {
    const { cerfa } = useRegistre();

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div className="bg-white dark:bg-bg-secondary rounded-[2.5rem] border border-border p-10 relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 -mr-24 -mt-24 rounded-full blur-3xl" />
                <div className="relative z-10 flex flex-col md:flex-row items-start justify-between gap-6">
                    <div className="flex items-start gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/10 shadow-sm">
                            <ShieldCheck strokeWidth={1.5} className="w-8 h-8 text-purple-500" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-serif font-black italic text-text-primary tracking-tight">Cerfa 13984</h2>
                            <p className="text-[10px] font-black text-purple-500 uppercase tracking-[0.3em] mt-1">Déclaration de manipulation de denrées alimentaires d'origine animale</p>
                            <p className="text-text-muted text-sm mt-3 max-w-xl leading-relaxed">{cerfa.description}</p>
                            <div className="flex items-center gap-6 mt-4">
                                <div className="flex items-center gap-2 text-text-muted">
                                    <Calendar strokeWidth={1.5} className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-mono font-bold">Déclaration : {cerfa.lastUpdated}</span>
                                </div>
                                <div className="flex items-center gap-2 text-text-muted">
                                    <Clock strokeWidth={1.5} className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-mono font-bold">Prochaine vérification : {cerfa.nextReview}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" className="h-11 rounded-xl border-border px-5 font-bold text-[10px] uppercase tracking-widest">
                            <Download strokeWidth={1.5} className="w-4 h-4 mr-2" /> Télécharger PDF
                        </Button>
                    </div>
                </div>
            </div>

            {/* Informations de l'établissement */}
            <div className="bg-white dark:bg-bg-secondary rounded-2xl border border-border p-8 shadow-sm space-y-6">
                <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] flex items-center gap-3">
                    <Building2 strokeWidth={1.5} className="w-3.5 h-3.5" />
                    Informations de l'Établissement (pré-remplies)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                        { label: 'Raison sociale', value: 'Restaurant OS' },
                        { label: 'N° SIRET', value: '123 456 789 00012' },
                        { label: 'Adresse', value: '15 Rue de la Gastronomie, 69001 Lyon' },
                        { label: 'Responsable légal', value: 'Représentant Légal' },
                        { label: 'Activité déclarée', value: 'Restauration traditionnelle — Manipulation et transformation de denrées animales' },
                        { label: 'DD(CS)PP compétente', value: 'Direction Départementale du Rhône' },
                    ].map((field, i) => (
                        <div key={i} className="space-y-1.5">
                            <label className="text-[9px] font-black text-text-muted uppercase tracking-widest">{field.label}</label>
                            <div className="h-12 px-5 bg-bg-tertiary/50 rounded-xl border border-border flex items-center">
                                <span className="text-sm font-medium text-text-primary">{field.value}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Catégories de denrées */}
            <div className="bg-white dark:bg-bg-secondary rounded-2xl border border-border p-8 shadow-sm space-y-6">
                <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] flex items-center gap-3">
                    <FileText strokeWidth={1.5} className="w-3.5 h-3.5" />
                    Catégories de Denrées Manipulées
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                        { category: 'Viandes fraîches', details: 'Bœuf, veau, agneau, volaille', declared: true },
                        { category: 'Produits de la mer', details: 'Poissons, crustacés, coquillages', declared: true },
                        { category: 'Produits laitiers', details: 'Fromages, beurre, crème', declared: true },
                        { category: 'Charcuterie', details: 'Terrines, rillettes (fabrication maison)', declared: true },
                        { category: 'Ovoproduits', details: 'Œufs frais, préparations à base d\'œufs', declared: true },
                        { category: 'Gibier', details: 'Non manipulé actuellement', declared: false },
                    ].map((cat, i) => (
                        <div key={i} className={`p-5 rounded-xl border ${cat.declared ? 'bg-purple-500/5 border-purple-500/10' : 'bg-bg-tertiary/30 border-border opacity-60'}`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-[13px] text-text-primary">{cat.category}</span>
                                <span className={`text-[9px] font-black uppercase tracking-widest ${cat.declared ? 'text-purple-500' : 'text-text-muted'}`}>
                                    {cat.declared ? '✓ Déclaré' : 'Non déclaré'}
                                </span>
                            </div>
                            <p className="text-[11px] text-text-muted">{cat.details}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Rappel */}
            <div className="bg-purple-50 dark:bg-purple-500/5 rounded-2xl border border-purple-200 dark:border-purple-500/10 p-8">
                <div className="flex items-start gap-4">
                    <AlertTriangle strokeWidth={1.5} className="w-5 h-5 text-purple-500 mt-0.5 shrink-0" />
                    <div>
                        <h4 className="font-serif font-bold text-purple-900 dark:text-purple-300 mb-2">Obligations légales</h4>
                        <ul className="text-sm text-purple-800 dark:text-purple-200/80 space-y-2 leading-relaxed">
                            <li>• La déclaration Cerfa 13984 doit être effectuée avant le début de l'activité auprès de la DD(CS)PP</li>
                            <li>• Toute modification d'activité (nouvelle catégorie de denrées) doit faire l'objet d'une mise à jour</li>
                            <li>• L'établissement doit disposer d'un agrément sanitaire si livraison à d'autres professionnels</li>
                            <li>• Ce document doit être présenté lors de tout contrôle sanitaire</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
                <Button className="h-14 flex-1 bg-text-primary hover:bg-black text-white rounded-xl font-bold uppercase text-[10px] tracking-widest">
                    <Send strokeWidth={1.5} className="w-4 h-4 mr-3" />
                    Envoyer à la DD(CS)PP
                </Button>
            </div>
        </div>
    );
}
