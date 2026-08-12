"use client";

import { useState, Suspense, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "@/shared/hooks";
import { cn } from "@/lib/ui.foundations";
import { PageHeaderWithDocs } from "@ui/PageHeaderWithDocs";

// Panneaux lazy — extraits en registres pour garder ce fichier sous le seuil de fan-out.
import { SettingsLoading } from "./_SettingsLoading";
import { BrandScraper } from "./BrandScraper";
import { BrandUploader } from "./BrandUploader";
import {
    ProfileSettings, ExpertGovernanceHub, NexusSettings, HoursSettings,
    ReservationSettingsComponent, StaffSettings, MenuSettings, GoalsSettings,
} from "./panelsCore";
import {
    IntegrationSettings, ReviewsSettings, TablesSettings, MigrationHub,
    PrinterSettings, PaymentTerminalSettings, CashDrawerSettings, PayrollIntegrationPanel, ApiKeysPanel, CustomDomainPanel,
} from "./panelsSystem";

// Nexus-Sync Schema Orchestration
import { StandardSettingsEngine } from "@design/settings/ui/StandardSettingsEngine";
import { 
    IDENTITY_SCHEMA, 
    CONTACT_SCHEMA, 
    SOCIAL_SCHEMA, 
    POS_SCHEMA, 
    ACCOUNTING_SCHEMA, 
    HACCP_SCHEMA,
    THEME_SCHEMA,
    NOTIFICATIONS_SCHEMA,
    SECURITY_SCHEMA,
    DELIVERY_SCHEMA,
    Customer_SCHEMA,
    LEGAL_SCHEMA,
    STAFF_CONFIG_SCHEMA,
    RESERVATIONS_CONFIG_SCHEMA,
    INVENTORY_SCHEMA,
    SERVICE_SCHEMA
} from "@/config/settings-schemas";


import {
    Building2, Clock, UtensilsCrossed, Users, Bell, CreditCard, Scale, Truck, Database, FileText, UserCircle, Package, ChevronRight, LayoutGrid, Star, Palette, Shield, Target, Plug, RotateCcw, Download, BookOpen, Receipt, Heart, ChefHat, CalendarDays, Upload, Bot, Wallet
} from "lucide-react";

// Settings categories
const SETTINGS_CATEGORIES = [
    { id: 'profile', label: 'Mon Profil', icon: UserCircle, color: '#C5A059' },
    { id: 'governance', label: 'Gouvernance & Experts', icon: Scale, description: 'Pilotage de l\'intelligence logicielle' },
    { id: 'nexus', label: 'Nexus AI (Mère)', icon: Bot, color: '#C5A059' },

    { id: 'identity', label: 'Identité & Restaurant', icon: Building2, color: '#3B82F6' },
    { id: 'hours', label: 'Horaires & Disponibilités', icon: Clock, color: '#10B981' },
    { id: 'menu', label: 'Menu & Carte', icon: UtensilsCrossed, color: '#F59E0B' },
    { id: 'recipes', label: 'Recettes & Fiches', icon: ChefHat, color: '#EF4444' },
    { id: 'inventory', label: 'Inventaire & Stocks', icon: Package, color: '#8B5CF6' },
    { id: 'staff', label: 'Équipe & RH', icon: Users, color: '#EC4899' },
    { id: 'planning', label: 'Planning & Shifts', icon: CalendarDays, color: '#06B6D4' },
    { id: 'reservations', label: 'Réservations', icon: BookOpen, color: '#F97316' },
    { id: 'customer', label: 'Customer Clients', icon: Heart, color: '#DC2626' },
    { id: 'pos', label: 'Point de Vente', icon: CreditCard, color: '#C5A059' },
    { id: 'accounting', label: 'Comptabilité', icon: Receipt, color: '#6366F1' },
    { id: 'delivery', label: 'Livraison & Click-Collect', icon: Truck, color: '#14B8A6' },
    { id: 'reviews', label: 'Avis & Réputation', icon: Star, color: '#FBBF24' },
    { id: 'appearance', label: 'Apparence & Thème', icon: Palette, color: '#A855F7' },
    { id: 'notifications', label: 'Notifications & Alertes', icon: Bell, color: '#F43F5E' },
    { id: 'security', label: 'Sécurité & Permissions', icon: Shield, color: '#64748B' },
    { id: 'goals', label: 'Objectifs & KPIs', icon: Target, color: '#22C55E' },
    { id: 'integrations', label: 'Intégrations & API', icon: Plug, color: '#0EA5E9' },
    { id: 'legal', label: 'Documents & Légal', icon: FileText, color: '#78716C' },
    { id: 'haccp', label: 'HACCP & Hygiène', icon: Shield, color: '#00BCD4' },
    { id: 'migration', label: 'Migration & Import (IA)', icon: Database, color: '#3B82F6' },
    { id: 'tables', label: 'Tables & Zones', icon: LayoutGrid, color: '#7C3AED' },
    { id: 'printer', label: 'Imprimante', icon: Receipt, color: '#0D9488' },
    { id: 'tpe', label: 'Terminaux de paiement', icon: CreditCard, color: '#C5A059' },
    { id: 'cash-drawer', label: 'Tiroir-caisse', icon: Wallet, color: '#10B981' },
];

function SettingsPlaceholder({ category }: { category: typeof SETTINGS_CATEGORIES[0] }) {
    const Icon = category.icon;
    return (
        <div className="flex flex-col items-center justify-center py-20 bg-bg-secondary rounded-[2.5rem] border border-border h-[500px] shadow-premium">
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6 bg-bg-tertiary border border-border">
                <Icon className="w-12 h-12 text-text-muted" />
            </div>
            <h3 className="text-2xl font-brand text-text-primary mb-2 italic">{category.label}</h3>
            <p className="text-text-muted text-center max-w-sm font-medium">
                Configuration du module bientôt disponible.<br />Implémentation en cours.
            </p>
        </div>
    );
}

const DEFAULT_SETTINGS_CATEGORY = 'identity';

export function SettingsDashboard() {
    const [activeCategory, setActiveCategory] = useState(DEFAULT_SETTINGS_CATEGORY);
    const [isNavCollapsed, setIsNavCollapsed] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const { lastSaved, settings, updateSettings } = useSettings();
    const importInputRef = useRef<HTMLInputElement>(null);

    const handleExport = () => {
        if (!settings) { toast.error('Réglages non chargés'); return; }
        const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `restaurant-os-settings-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Réglages exportés');
    };

    const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        try {
            const parsed = JSON.parse(await file.text());
            if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
                throw new Error('format');
            }
            await updateSettings?.(parsed);
            toast.success('Réglages importés et synchronisés');
        } catch {
            toast.error('Fichier invalide — export JSON Restaurant OS attendu');
        }
    };

    const handleReset = () => {
        toast('Réinitialiser tous les réglages ?', {
            action: {
                label: 'Confirmer',
                onClick: async () => {
                    try {
                        const { defaultSettings } = await import('@/shared/contexts/settings/defaults');
                        await updateSettings?.(defaultSettings);
                        toast.success('Réglages réinitialisés aux valeurs par défaut');
                    } catch {
                        toast.error('Échec de la réinitialisation');
                    }
                },
            },
            cancel: { label: 'Annuler', onClick: () => {} },
        });
    };
    const activeConfig = useMemo(() => SETTINGS_CATEGORIES.find(c => c.id === activeCategory) || SETTINGS_CATEGORIES[0], [activeCategory]);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const settingsContent = useMemo(() => {
        switch (activeCategory) {
            case 'profile': return <ProfileSettings />;
            case 'governance': return <ExpertGovernanceHub />;
            case 'identity': return (
                <div className="space-y-12">
                    <StandardSettingsEngine schema={IDENTITY_SCHEMA} />
                    <StandardSettingsEngine schema={CONTACT_SCHEMA} />
                    <StandardSettingsEngine schema={SOCIAL_SCHEMA} />
                </div>
            );
            case 'nexus': return <NexusSettings />;

            case 'hours': return (
                <div className="space-y-12">
                    <HoursSettings />
                    <StandardSettingsEngine schema={SERVICE_SCHEMA} />
                </div>
            );
            case 'pos': return <StandardSettingsEngine schema={POS_SCHEMA} />;
            case 'reservations': return (
                <div className="space-y-12">
                    <ReservationSettingsComponent />
                    <StandardSettingsEngine schema={RESERVATIONS_CONFIG_SCHEMA} />
                </div>
            );
            case 'appearance': return (
                <div className="space-y-12">
                    <div className="p-6 rounded-2xl bg-surface-card border border-border space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-text-primary mb-1">Charte graphique</h3>
                            <p className="text-sm text-text-secondary">Importez votre logo, favicon et bannière. Toute la plateforme s'adapte automatiquement.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <BrandUploader slot="logo" label="Logo principal" hint="Recommandé : PNG 512×512 sur fond transparent" />
                            <BrandUploader slot="favicon" label="Favicon" hint="Recommandé : PNG 64×64 carré" />
                            <BrandUploader slot="banner" label="Bannière" hint="Recommandé : PNG 1200×400" />
                        </div>
                    </div>
                    <div className="p-6 rounded-2xl bg-surface-card border border-border space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold text-text-primary mb-1">Extraction automatique</h3>
                            <p className="text-sm text-text-secondary">Entrez l'URL de votre site ou de votre page Google — l'IA extrait vos couleurs et polices en un clic.</p>
                        </div>
                        <BrandScraper />
                    </div>
                    <StandardSettingsEngine schema={THEME_SCHEMA} />
                </div>
            );
            case 'notifications': return <StandardSettingsEngine schema={NOTIFICATIONS_SCHEMA} />;
            case 'goals': return <GoalsSettings />; // Goals has complex UI, keeping it for now
            case 'delivery': return <StandardSettingsEngine schema={DELIVERY_SCHEMA} />;
            case 'security': return <StandardSettingsEngine schema={SECURITY_SCHEMA} />;
            case 'staff': return (
                <div className="space-y-12">
                    <StaffSettings />
                    <StandardSettingsEngine schema={STAFF_CONFIG_SCHEMA} />
                    <div className="p-6 rounded-2xl bg-surface-card border border-border">
                        <PayrollIntegrationPanel />
                    </div>
                </div>
            );
            case 'customer': return <StandardSettingsEngine schema={Customer_SCHEMA} />;
            case 'integrations': return (
                <div className="space-y-12">
                    <IntegrationSettings />
                    <CustomDomainPanel />
                    <ApiKeysPanel />
                </div>
            );
            case 'reviews': return <ReviewsSettings />;
            case 'legal': return <StandardSettingsEngine schema={LEGAL_SCHEMA} />;
            case 'menu': return <MenuSettings />;
            case 'inventory': return <StandardSettingsEngine schema={INVENTORY_SCHEMA} />;
            case 'planning': return <SettingsPlaceholder category={activeConfig} />;
            case 'accounting': return <StandardSettingsEngine schema={ACCOUNTING_SCHEMA} />;
            case 'recipes': return <SettingsPlaceholder category={activeConfig} />;
            case 'haccp': return <StandardSettingsEngine schema={HACCP_SCHEMA} />;
            case 'migration': return <MigrationHub />;
            case 'tables': return <TablesSettings />;
            case 'printer': return <PrinterSettings />;
            case 'tpe': return <PaymentTerminalSettings />;
            case 'cash-drawer': return <CashDrawerSettings />;
            default: return <SettingsPlaceholder category={activeConfig} />;
        }
    }, [activeCategory, activeConfig]);

    return (
        <div className="flex h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] -m-4 md:-m-8 bg-bg-primary overflow-hidden">
            {isMobile && !isNavCollapsed && (
                <div className="fixed inset-0 bg-surface-bg backdrop-blur-sm z-20" onClick={() => setIsNavCollapsed(true)} />
            )}

            <main className="flex-1 flex overflow-hidden">
                <motion.div
                    animate={{ width: isMobile ? (isNavCollapsed ? 0 : '100%') : (isNavCollapsed ? 80 : 320), x: isMobile && isNavCollapsed ? -320 : 0 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className={cn("bg-bg-secondary border-r border-border flex flex-col z-30 shrink-0 h-full", isMobile ? "absolute" : "relative")}
                >
                    <div className={cn("p-6 flex items-center", isNavCollapsed ? "justify-center" : "justify-between")}>
                        <AnimatePresence mode="wait">
                            {!isNavCollapsed && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-action-primary flex items-center justify-center shadow-lg shadow-accent/20">
                                        <LayoutGrid className="w-5 h-5 text-bg-primary" />
                                    </div>
                                    <h2 className="text-xl font-brand text-text-primary tracking-tight italic">Paramètres</h2>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <button onClick={() => setIsNavCollapsed(!isNavCollapsed)} className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center text-text-muted hover:text-text-primary">
                            <ChevronRight className={cn("w-4 h-4 transition-transform", isNavCollapsed ? "" : "rotate-180")} />
                        </button>
                    </div>
                    <div className="h-px bg-border w-full mb-2" />
                    <div className="flex-1 overflow-y-auto px-3 pb-8 space-y-1 elegant-scrollbar">
                        {SETTINGS_CATEGORIES.map((category) => {
                            const isActive = activeCategory === category.id;
                            const Icon = category.icon;
                            return (
                                <button
                                    key={category.id}
                                    onClick={() => { setActiveCategory(category.id); if (isMobile) setIsNavCollapsed(true); }}
                                    className={cn("w-full flex items-center gap-4 py-4 rounded-xl transition-all group", isNavCollapsed ? "justify-center px-0" : "px-5", isActive ? "bg-text-primary text-bg-primary shadow-xl" : "text-text-muted hover:bg-bg-tertiary")}
                                >
                                    <Icon className={cn("w-5 h-5", isActive ? "text-action-primary" : "text-text-muted group-hover:text-text-primary")} strokeWidth={isActive ? 2 : 1.5} />
                                    {!isNavCollapsed && <span className="text-xs font-black uppercase tracking-widest">{category.label}</span>}
                                </button>
                            );
                        })}
                    </div>
                </motion.div>

                <div className="flex-1 bg-bg-primary relative flex flex-col h-full overflow-hidden min-w-0">
                    <div className="p-6 md:p-10 pb-0 flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <p className="text-text-muted text-[10px] font-black uppercase tracking-widest mb-2">Intelligence Système</p>
                            <PageHeaderWithDocs categoryId="settings" title="" className="text-2xl md:text-4xl font-brand text-text-primary uppercase italic">
                                PARAMÈTRES <span className="text-border">/</span> <span className="text-action-primary">{activeConfig.label.toUpperCase()}</span>
                            </PageHeaderWithDocs>
                        </div>
                        <div className="flex items-center gap-4">
                            {lastSaved && (
                                <div className="px-4 py-2 rounded-full bg-success/10 border border-success/20 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                                    <span className="text-[10px] font-bold text-success uppercase">Synchronisé {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            )}
                            <div className="flex gap-2">
                                <button onClick={handleExport} title="Exporter les réglages (JSON)" className="w-10 h-10 rounded-full bg-bg-secondary border border-border flex items-center justify-center text-text-muted hover:text-text-primary"><Download className="w-4 h-4" /></button>
                                <button onClick={() => importInputRef.current?.click()} title="Importer des réglages (JSON)" className="w-10 h-10 rounded-full bg-bg-secondary border border-border flex items-center justify-center text-text-muted hover:text-text-primary"><Upload className="w-4 h-4" /></button>
                                <button onClick={handleReset} title="Réinitialiser aux valeurs par défaut" className="w-10 h-10 rounded-full bg-bg-secondary border border-border flex items-center justify-center text-text-muted hover:text-error"><RotateCcw className="w-4 h-4" /></button>
                                <input ref={importInputRef} type="file" accept="application/json" onChange={handleImportFile} className="hidden" />
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 md:p-10 elegant-scrollbar relative">
                        <AnimatePresence mode="popLayout">
                            <motion.div key={activeCategory} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-7xl mx-auto pb-20">
                                <Suspense fallback={<SettingsLoading />}>{settingsContent}</Suspense>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </main>
        </div>
    );
}
