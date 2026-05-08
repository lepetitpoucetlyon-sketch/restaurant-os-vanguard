"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plug,
    Save,
    Loader2,
    Key,
    Globe,
    CreditCard,
    MessageSquare,
    Mail,
    Calendar,
    ShoppingCart,
    Check,
    ExternalLink,
    Zap,
    Cpu,
    Webhook,
    Eye,
    EyeOff,
    Link2,
    Network
} from "lucide-react";
import { cn } from "@/lib/ui.foundations";;
import { useSettings } from "@/context/SettingsContext";
import { IntegrationsConfig, IntegrationSettings as IntegrationType } from "@nexus/contracts";

const INTEGRATIONS_METADATA = [
    { id: 'stripe', name: 'Stripe', category: 'Payment Gateway', icon: CreditCard, description: 'Neural Payment Processing' },
    { id: 'paypal', name: 'PayPal', category: 'Payment Gateway', icon: CreditCard, description: 'Global Alternative Rails' },
    { id: 'thefork', name: 'TheFork', category: 'Reservation Grid', icon: Calendar, description: 'Bookings Synchronization' },
    { id: 'google', name: 'Google Business', category: 'Growth Matrix', icon: Globe, description: 'Global Maps Synchronization' },
    { id: 'mailchimp', name: 'Mailchimp', category: 'Growth Matrix', icon: Mail, description: 'Outbound Signal Campaigns' },
    { id: 'twilio', name: 'Twilio', category: 'Signal Protocol', icon: MessageSquare, description: 'SMS & Signal Dispatch' },
    { id: 'uber', name: 'Uber Eats', category: 'Logistics Node', icon: ShoppingCart, description: 'Remote Acquisitions' },
    { id: 'deliveroo', name: 'Deliveroo', category: 'Logistics Node', icon: ShoppingCart, description: 'Remote Acquisitions' },
];

export default function IntegrationSettings() {
    const { settings, updateConfig, updateList, isSaving: contextIsSaving } = useSettings();
    const [localIntegrations, setLocalIntegrations] = useState<IntegrationType[]>(settings.integrations || []);
    const [localConfig, setLocalConfig] = useState<IntegrationsConfig>(settings.integrationsConfig || {
        stripePublicKey: '',
        stripeSecretKey: '',
        stripeWebhookSecret: '',
        webhooks: []
    });
    const [isSaving, setIsSaving] = useState(false);
    const [showSecrets, setShowSecrets] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateConfig('integrationsConfig', localConfig);
            await updateList('integrations', localIntegrations);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const toggleConnection = (id: string) => {
        setLocalIntegrations(prev => prev.map(i =>
            i.id === id ? { ...i, isActive: !i.isActive } : i
        ));
    };

    const toggleWebhook = (id: string) => {
        setLocalConfig(prev => ({
            ...prev,
            webhooks: prev.webhooks.map(w => w.id === id ? { ...w, isActive: !w.isActive } : w)
        }));
    };

    const categories = Array.from(new Set(INTEGRATIONS_METADATA.map(i => i.category)));

    return (
        <div className="space-y-12 pb-20">
            {/* Cryptographic Keys (API Keys) */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-bg-secondary border border-border rounded-[2.5rem] shadow-premium p-6 md:p-10 overflow-hidden relative group"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-[100px] -mr-32 -mt-32 transition-opacity group-hover:opacity-100 opacity-50 pointer-events-none" />

                <div className="flex items-center gap-4 mb-10 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-bg-tertiary flex items-center justify-center border border-border text-accent">
                        <Key className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-serif text-text-primary uppercase tracking-tight italic">
                            Neural Access Keys
                        </h3>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Global Secret Management</p>
                    </div>
                </div>

                <div className="space-y-6 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] px-1 group-hover:text-accent transition-colors">Public Identifier</label>
                            <div className="relative">
                                <input
                                    type={showSecrets ? 'text' : 'password'}
                                    value={localConfig.stripePublicKey}
                                    onChange={(e) => setLocalConfig(prev => ({ ...prev, stripePublicKey: e.target.value }))}
                                    className="w-full px-6 py-5 bg-bg-primary border border-border rounded-2xl text-text-primary font-mono text-sm focus:bg-bg-primary/50 transition-all outline-none"
                                    data-tutorial="settings-1-0"
                                />
                                <button
                                    onClick={() => setShowSecrets(!showSecrets)}
                                    className="absolute right-6 top-1/2 -translate-y-1/2 text-text-muted hover:text-accent transition-colors"
                                >
                                    {showSecrets ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] px-1">Cryptographic Secret</label>
                            <input
                                type={showSecrets ? 'text' : 'password'}
                                value={localConfig.stripeSecretKey}
                                onChange={(e) => setLocalConfig(prev => ({ ...prev, stripeSecretKey: e.target.value }))}
                                className="w-full px-6 py-5 bg-bg-primary border border-border rounded-2xl text-text-primary font-mono text-sm focus:bg-bg-primary/50 transition-all outline-none"
                            />
                        </div>
                    </div>
                    <div className="space-y-3 pt-2">
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] px-1">Webhook Signature Secret</label>
                        <input
                            type={showSecrets ? 'text' : 'password'}
                            value={localConfig.stripeWebhookSecret}
                            onChange={(e) => setLocalConfig(prev => ({ ...prev, stripeWebhookSecret: e.target.value }))}
                            className="w-full px-6 py-5 bg-bg-primary border border-border rounded-2xl text-text-primary font-mono text-sm focus:bg-bg-primary/50 transition-all outline-none"
                        />
                    </div>
                </div>
            </motion.div>

            {/* Neural Bridges (Integrations) */}
            <div className="space-y-12">
                {categories.map((category, catIdx) => (
                    <motion.div
                        key={category}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: catIdx * 0.1 }}
                        className="bg-bg-secondary border border-border rounded-[2.5rem] shadow-premium p-6 md:p-10"
                    >
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-10 h-10 rounded-xl bg-bg-tertiary flex items-center justify-center text-text-muted">
                                <Link2 className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-xl font-serif text-text-primary uppercase tracking-tight italic">
                                    {category}
                                </h3>
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">External Node Bridge</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {INTEGRATIONS_METADATA.filter(i => i.category === category).map((meta) => {
                                const integration = localIntegrations.find(li => li.id === meta.id) || {
                                    id: meta.id,
                                    name: meta.name,
                                    provider: meta.id,
                                    isActive: false,
                                    environment: 'sandbox'
                                };
                                const Icon = meta.icon;
                                return (
                                    <motion.div
                                        key={meta.id}
                                        whileHover={{ scale: 1.02, y: -4 }}
                                        className={cn(
                                            "p-8 rounded-[2rem] border transition-all duration-500 relative group overflow-hidden",
                                            integration.isActive
                                                ? "bg-bg-primary border-accent/40 shadow-lg"
                                                : "bg-bg-primary border-border opacity-80"
                                        )}
                                    >
                                        <div className="flex items-start justify-between mb-8 relative z-10">
                                            <div className="flex items-center gap-6">
                                                <div
                                                    className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500 bg-bg-tertiary text-accent"
                                                >
                                                    <Icon className="w-8 h-8" />
                                                </div>
                                                <div>
                                                    <p className="font-serif text-text-primary uppercase tracking-tight text-lg italic">{meta.name}</p>
                                                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{meta.description}</p>
                                                </div>
                                            </div>
                                            <AnimatePresence>
                                                {integration.isActive && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        className="flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full border border-accent/20"
                                                    >
                                                        <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                                                        <span className="text-[9px] font-bold text-accent uppercase tracking-widest">Linked</span>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        <div className="flex gap-4 relative z-10">
                                            <button
                                                onClick={() => toggleConnection(meta.id)}
                                                className={cn(
                                                    "flex-1 py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all duration-500 border",
                                                    integration.isActive
                                                        ? "bg-bg-tertiary border-border text-text-muted hover:bg-status-danger/10 hover:text-status-danger hover:border-rose-500/20"
                                                        : "bg-accent text-bg-primary border-accent hover:brightness-110 shadow-lg"
                                                )}
                                            >
                                                {integration.isActive ? 'Terminate Link' : 'Initialize Session'}
                                            </button>
                                            {integration.isActive && (
                                                <button className="w-12 h-12 bg-bg-tertiary border border-border text-text-muted rounded-xl flex items-center justify-center hover:bg-bg-primary hover:text-text-primary transition-all transform hover:rotate-12">
                                                    <ExternalLink className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Neural Webhooks (URLs) */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-bg-secondary border border-border rounded-[2.5rem] shadow-premium p-6 md:p-10 overflow-hidden relative"
            >
                <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-[100px] -mr-48 -mt-48 pointer-events-none" />

                <div className="flex items-center justify-between mb-10 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-bg-tertiary flex items-center justify-center border border-border text-accent">
                            <Webhook className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-serif text-text-primary uppercase tracking-tight italic">
                                Neural Signals (Webhooks)
                            </h3>
                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Inbound & Outbound Data Projections</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full border border-accent/20">
                        <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                        <span className="text-[9px] font-bold text-accent uppercase tracking-widest">Active Dispatch</span>
                    </div>
                </div>

                <div className="space-y-4 relative z-10 font-mono">
                    {localConfig.webhooks.map((webhook) => (
                        <div key={webhook.id} className="flex items-center justify-between p-6 bg-bg-primary rounded-2xl border border-border border-dashed hover:border-accent/30 transition-all group">
                            <div className="flex items-center gap-6">
                                <div className={cn("w-3 h-3 rounded-full shadow-[0_0_10px_currentcolor]", webhook.isActive ? "text-accent" : "text-text-muted")} />
                                <div>
                                    <p className={cn("text-xs font-bold uppercase tracking-[0.2em] mb-1", webhook.isActive ? "text-accent" : "text-text-muted")}>{webhook.event}</p>
                                    <p className="text-[10px] text-text-muted group-hover:text-text-primary transition-colors">{webhook.url}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => toggleWebhook(webhook.id)}
                                className={cn(
                                    "w-14 h-7 rounded-full relative transition-all duration-500 border border-border",
                                    webhook.isActive ? "bg-accent" : "bg-bg-tertiary"
                                )}
                            >
                                <motion.div
                                    animate={{ x: webhook.isActive ? 28 : 2 }}
                                    className={cn("absolute top-1 left-1 w-4.5 h-4.5 rounded-full shadow-md bg-surface-card")}
                                />
                            </button>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Global Dispatch */}
            <div className="flex justify-end pt-4">
                <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-4 px-12 py-6 bg-text-primary text-bg-primary rounded-[2rem] font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all disabled:opacity-50 group border border-border"
                >
                    {isSaving ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                        <div className="relative">
                            <Zap className="w-6 h-6 transition-transform group-hover:scale-110" />
                            <div className="absolute inset-0 bg-surface-card/40 blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    )}
                    Commit Signal Matrix
                </motion.button>
            </div>
        </div>
    );
}
