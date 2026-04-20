// @ts-nocheck
"use client";

import React, { useState } from "react";
import { Upload, FileText, CheckCircle2, AlertTriangle, Play, Loader2, Save, Download, Database, Users, Menu as MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/Toast";
import { useDataMigration } from "@/hooks/useDataMigration";
import { NexusSphere } from "@/components/layout/NexusSphere";


export default function MigrationSettings() {
    const { showToast } = useToast();
    const { parseCSV, analyzeMenuWithAI, injectToDB, seedProduction, isMigrating, progress } = useDataMigration();
    
    const [activeTab, setActiveTab] = useState<'menu' | 'staff' | 'crm' | 'seed'>('menu');
    const [rawMenuText, setRawMenuText] = useState("");
    const [parsedMenuData, setParsedMenuData] = useState<any>(null);

    // AI MENU DETECTION HANDLER
    const handleMenuAnalysis = async () => {
        if (!rawMenuText.trim()) return showToast("Veuillez coller le texte de votre menu.", "warning");
        try {
            const data = await analyzeMenuWithAI(rawMenuText);
            setParsedMenuData(data);
            showToast("Menu analysé avec succès. Veuillez vérifier les données.", "success");
        } catch (err: any) {
            showToast(`Erreur d'analyse: ${err.message}`, "error");
        }
    };

    const handleInjectMenu = async () => {
        if (!parsedMenuData) return;
        try {
            await injectToDB('menu', parsedMenuData);
            showToast("Menu injecté dans la base de données !", "success");
            setParsedMenuData(null);
            setRawMenuText("");
        } catch (err: any) {
            showToast(`Erreur d'injection: ${err.message}`, "error");
        }
    };

    // CSV UPLOAD HANDLER
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, entity: 'staff' | 'crm') => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const data = await parseCSV(file);
            if (data && data.length > 0) {
                await injectToDB(entity, data);
                showToast(`Import réussi : ${data.length} enregistrements ajoutés.`, "success");
            } else {
                showToast("Fichier vide ou mal formaté.", "warning");
            }
        } catch (err: any) {
            showToast(`Erreur de lecture CSV: ${err.message}`, "error");
        }
        
        // Reset input
        e.target.value = '';
    };

    const handleResurrect = async () => {
        try {
            await seedProduction();
            showToast("Système ressuscité ! Les données de production sont en ligne.", "success");
        } catch (err: any) {
            showToast(`Échec de la résurrection: ${err.message}`, "error");
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl">
            <header className="mb-10">
                <h1 className="text-4xl font-serif font-light tracking-tight text-text-primary">
                    Migration <span className="italic text-accent">& Import</span>
                </h1>
                <p className="text-text-muted mt-2 text-lg">
                    Digitalisez votre restaurant instantanément grâce à l'intelligence unifiée de **NEXUS**.
                </p>

            </header>

            {/* PROGRESS INDICATOR */}
            {isMigrating && (
                 <div className="bg-bg-tertiary p-4 rounded-xl border border-accent/20 flex items-center justify-between shadow-lg">
                     <div className="flex items-center gap-4">
                         <Loader2 className="w-5 h-5 text-accent animate-spin" />
                         <span className="font-bold text-sm text-text-primary">Traitement en cours...</span>
                     </div>
                     <div className="w-1/2 h-2 bg-bg-secondary rounded-full overflow-hidden">
                         <div className="h-full bg-accent transition-all duration-300" style={{ width: `${progress}%` }} />
                     </div>
                 </div>
            )}

            {/* TABS */}
            <div className="flex bg-bg-secondary p-1 rounded-xl w-fit border border-border">
                {[
                    { id: 'menu', label: 'Scanner de Menu IA', icon: MenuIcon },
                    { id: 'staff', label: 'Import Équipe', icon: Users },
                    { id: 'crm', label: 'Import Clients', icon: Database },
                    { id: 'seed', label: 'Ressusciter le Système', icon: Play }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${activeTab === tab.id ? 'bg-bg-primary text-text-primary shadow-sm border border-border' : 'text-text-muted hover:text-text-primary'}`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* TAB CONTENT: MENU AI SCANNER */}
            {activeTab === 'menu' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Input Block */}
                    <div className="bg-bg-secondary p-8 rounded-2xl border border-border shadow-sm flex flex-col h-[600px]">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                                <FileText strokeWidth={1.5} className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-serif font-semibold">1. Coller le texte brut</h3>
                                <p className="text-xs text-text-muted">Extrait OCR d'un PDF, Word ou image de votre carte.</p>
                            </div>
                        </div>
                        <textarea
                            value={rawMenuText}
                            onChange={(e) => setRawMenuText(e.target.value)}
                            placeholder="Ex:&#10;ENTRÉES&#10;Oeuf Mayonnaise Maison ... 8.50€&#10;Salade César ... 12€&#10;&#10;PLATS&#10;Entrecôte 300g frites ... 24€"
                            className="flex-1 w-full bg-bg-tertiary border border-border rounded-xl p-4 text-sm font-mono focus:border-accent focus:ring-1 focus:ring-accent outline-none resize-none elegant-scrollbar text-text-primary"
                        />
                        <Button 
                            onClick={handleMenuAnalysis} 
                            disabled={isMigrating || !rawMenuText.trim()}
                            className={`mt-6 h-12 w-full font-bold uppercase tracking-widest flex items-center justify-center gap-3 ${(!rawMenuText.trim() || isMigrating) ? 'opacity-50' : 'bg-accent hover:bg-accent/90 text-bg-primary'}`}
                        >
                           <NexusSphere isActive={isMigrating} isProcessing={isMigrating} className="w-6 h-6" />
                           {isMigrating ? "Analyse NEXUS..." : "Consulter NEXUS"}
                        </Button>

                    </div>

                    {/* Output Block */}
                    <div className="bg-bg-secondary p-8 rounded-2xl border border-border shadow-sm flex flex-col h-[600px]">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center text-success">
                                <CheckCircle2 strokeWidth={1.5} className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-serif font-semibold">2. Validation des Données</h3>
                                <p className="text-xs text-text-muted">Vérifiez les catégories et prix détectés avant injection.</p>
                            </div>
                        </div>
                        
                        <div className="flex-1 bg-bg-tertiary rounded-xl border border-border overflow-auto elegant-scrollbar p-4 space-y-6">
                            {!parsedMenuData ? (
                                <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-50">
                                    <Database strokeWidth={1} className="w-16 h-16 mb-4" />
                                    <p className="font-serif text-lg">En attente d'analyse...</p>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
                                         <h4 className="font-bold text-sm uppercase tracking-widest text-text-primary">Aperçu Base de Données</h4>
                                         <span className="text-xs bg-success/20 text-success px-2 py-1 rounded font-bold">{parsedMenuData.products?.length} Plats trouvés</span>
                                    </div>
                                    {parsedMenuData.categories?.map((cat: any) => (
                                        <div key={cat.id} className="mb-6">
                                            <h5 className="font-bold text-accent text-sm mb-3 uppercase tracking-wider">{cat.name}</h5>
                                            <div className="space-y-2">
                                                {parsedMenuData.products?.filter((p: any) => p.categoryId === cat.id).map((prod: any, idx: number) => (
                                                    <div key={idx} className="flex justify-between items-center bg-bg-secondary p-3 rounded-lg border border-border text-sm">
                                                        <div>
                                                            <p className="font-bold text-text-primary">{prod.name}</p>
                                                            <p className="text-xs text-text-muted truncate max-w-xs">{prod.description}</p>
                                                        </div>
                                                        <span className="font-mono text-success font-bold">{(prod.priceInCents / 100).toFixed(2)}€</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <Button 
                            onClick={handleInjectMenu}
                            disabled={!parsedMenuData || isMigrating}
                            className="mt-6 h-12 w-full font-bold uppercase tracking-widest bg-success hover:bg-success/90 text-white"
                        >
                            Confirmer & Injecter <Save strokeWidth={2} className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: CSV UPLOADS */}
            {(activeTab === 'staff' || activeTab === 'crm') && (
                <div className="bg-bg-secondary rounded-2xl border border-border p-8 md:p-16 max-w-4xl mx-auto shadow-sm text-center border-dashed border-2">
                    <div className="w-24 h-24 bg-accent/5 rounded-full flex items-center justify-center mx-auto mb-8">
                        <Upload strokeWidth={1} className="w-10 h-10 text-accent" />
                    </div>
                    <h3 className="text-2xl font-serif font-semibold mb-2 text-text-primary">
                        Importer {activeTab === 'staff' ? "l'Équipe RH" : "la Base Clients"}
                    </h3>
                    <p className="text-text-muted mb-10 max-w-lg mx-auto">
                        Sélectionnez un fichier .CSV structuré. Notre algorithme mappera automatiquement les colonnes vers notre base de données locale.
                    </p>
                    
                    <div className="flex flex-col items-center gap-6">
                        <label className="cursor-pointer">
                            <input 
                                type="file" 
                                accept=".csv" 
                                className="hidden" 
                                onChange={(e) => handleFileUpload(e, activeTab)}
                            />
                            <div className="bg-text-primary hover:bg-black dark:hover:bg-neutral-800 text-bg-secondary dark:text-bg-primary h-14 px-10 rounded-xl font-bold text-[13px] uppercase tracking-[0.2em] shadow-xl transition-all flex items-center gap-3">
                                <Upload strokeWidth={2} className="w-4 h-4" />
                                Sélectionner un fichier
                            </div>
                        </label>
                        
                        <div className="flex items-center gap-2 text-xs font-bold text-accent uppercase tracking-widest mt-4">
                            <Download strokeWidth={2} className="w-4 h-4" />
                            <a href={`/templates/import_${activeTab}_template.csv`} download className="hover:underline">Télécharger le modèle CSV</a>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: SYSTEM RESURRECTOR */}
            {activeTab === 'seed' && (
                <div className="bg-bg-secondary rounded-[2.5rem] border border-border p-12 md:p-20 max-w-4xl mx-auto shadow-premium text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-accent-gold/5 blur-[100px] rounded-full pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-success/5 blur-[80px] rounded-full pointer-events-none" />
                    
                    <div className="w-28 h-28 bg-bg-tertiary rounded-[2rem] flex items-center justify-center mx-auto mb-10 border border-border shadow-inner">
                        <Play strokeWidth={1} className="w-12 h-12 text-accent-gold fill-accent-gold/10" />
                    </div>
                    
                    <h3 className="text-3xl font-serif font-black mb-4 text-text-primary uppercase tracking-tight">
                        Ressusciter <span className="text-accent-gold italic">la Base de Données</span>
                    </h3>
                    
                    <p className="text-text-muted mb-12 max-w-xl mx-auto font-medium leading-relaxed">
                        Cette action va injecter instantanément les catégories et les produits fondamentaux de **Restaurant OS** directement dans votre instance Firebase Cloud. Idéal après une purge pour repartir sur une base propre et fonctionnelle.
                    </p>
                    
                    <div className="flex flex-col items-center gap-8">
                        <Button 
                            onClick={handleResurrect}
                            disabled={isMigrating}
                            className="bg-text-primary dark:bg-accent-gold text-bg-primary h-18 px-14 rounded-2xl font-black text-sm uppercase tracking-[0.3em] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4 group disabled:opacity-50"
                        >
                            {isMigrating ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Injection en cours...
                                </>
                            ) : (
                                <>
                                    <Database strokeWidth={2} className="w-5 h-5" />
                                    Démarrer l'Injection Directe
                                </>
                            )}
                        </Button>
                        
                        <div className="flex items-center gap-3 text-[10px] font-black text-success uppercase tracking-widest bg-success/5 px-6 py-3 rounded-full border border-success/20">
                            <CheckCircle2 strokeWidth={2} className="w-4 h-4" />
                            Connexion Firebase État : Opérationnel
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
