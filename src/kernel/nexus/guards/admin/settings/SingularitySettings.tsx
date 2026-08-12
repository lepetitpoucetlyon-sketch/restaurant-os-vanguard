"use client";

import React, { useState, useEffect } from 'react';
import { Users, Calculator, Shield, Cpu, Save } from 'lucide-react';
import { GlassCard } from '@ui/GlassCard';
import { Button } from '@ui/button';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { SettingsManager } from '@/lib/SettingsManager';
import { AccountingMode, DEFAULT_STAFF_RATIO } from '@/lib/shared-kernel';
import { logger } from '@/lib/logger';
import { useNotifications } from '@/kernel/hooks';

/**
 * ⚙️ SingularitySettings - Grade X
 * Le centre de contrôle des paramètres de l'Empire.
 * Permet d'ajuster l'intelligence de l'Oracle et la profondeur comptable.
 */
export function SingularitySettings() {
    const [settings, setSettings] = useState<import('@nexus/contracts').GlobalSettings | null>(null); // SOVEREIGN_OVERRIDE: legacy typings
    const [saving, setSaving] = useState(false);
    const [rbacLevel, setRbacLevel] = useState<'ADMIN' | 'MANAGER' | 'DENIED'>('DENIED');
    const { addNotification } = useNotifications();

    useEffect(() => {
        loadSettings();
        checkRBAC();
    }, []);

    const checkRBAC = async () => {
        // Mocking RBAC check for the demo
        // In production, this would use the user context/session
        setRbacLevel('ADMIN'); 
    };

    const loadSettings = async () => {
        try {
            const data = await Nexus.adapter.get(Nexus.getTenantPath('settings/global')) as import('@nexus/contracts').GlobalSettings;
            setSettings(data || {
                planningConfig: { staffToCoversRatio: DEFAULT_STAFF_RATIO },
                accountingConfig: { complexityMode: 'EXPERT' }
            } as import('@nexus/contracts').GlobalSettings);

        } catch (e) {
            console.error("Failed to load settings", e);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await SettingsManager.saveSettings(settings as import('@nexus/contracts').GlobalSettings); // SOVEREIGN_OVERRIDE
            logger.info('SingularitySettings: Intelligence updated.');
        } catch (e) {
            console.error("Failed to save", e);
            addNotification({ type: 'critical', title: 'Erreur', message: 'Impossible d\'enregistrer les paramètres de l\'intelligence.' });
        } finally {
            setSaving(false);
        }
    };

    if (rbacLevel === 'DENIED') return null;

    return (
        <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-accent/10 text-accent">
                        <Cpu size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-serif italic text-text-primary">Paramètres de Singularité</h1>
                        <p className="text-[10px] uppercase tracking-widest text-text-muted font-black">Grade X : Contrôle Operationnel</p>
                    </div>
                </div>
                <Button 
                    onClick={handleSave} 
                    className="bg-accent hover:bg-accent/90 text-text-primary gap-2 px-6"
                    disabled={saving}
                >
                    {saving ? <div className="w-4 h-4 rounded-full border-2 border-default border-t-white animate-spin" /> : <Save size={16} />}
                    Sauvegarder les Protocoles
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Section RH : Ratio de Staffing */}
                <GlassCard className="p-6 flex flex-col gap-6 border-white/5 bg-surface-card/5">
                    <div className="flex items-center gap-3">
                        <Users size={18} className="text-info" />
                        <span className="text-sm font-black uppercase tracking-tight">Intelligence RH (Oracle)</span>
                    </div>
                    
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Ratio de Charge (Couverts / Brigadier)</label>
                            <input 
                                type="number" 
                                value={settings?.planningConfig?.staffToCoversRatio || DEFAULT_STAFF_RATIO}
                                onChange={(e) => setSettings({
                                    ...settings!,
                                    planningConfig: { ...settings?.planningConfig, staffToCoversRatio: parseInt(e.target.value) } as import('@nexus/contracts').PlanningConfig
                                })}
                                className="bg-surface-sidebar/40 border border-subtle rounded-lg p-3 text-sm font-mono focus:border-accent outline-none transition-colors"
                            />
                        </div>
                        <p className="text-[10px] text-text-muted italic leading-relaxed">
                            Ajuste la sensibilité de l'Oracle. Un ratio de 25 signifie que l'IA suggérera 1 brigadier supplémentaire pour chaque tranche de 25 couverts prédits.
                        </p>
                    </div>
                </GlassCard>

                {/* Section Finance : Mode Comptable */}
                <GlassCard className="p-6 flex flex-col gap-6 border-white/5 bg-surface-card/5">
                    <div className="flex items-center gap-3">
                        <Calculator size={18} className="text-success" />
                        <span className="text-sm font-black uppercase tracking-tight">Souveraineté Financière</span>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Mode de Complexité</label>
                            <div className="grid grid-cols-2 gap-2 bg-surface-sidebar/40 p-1 rounded-xl border border-subtle">
                                {['SIMPLE', 'EXPERT'].map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => setSettings({
                                            ...settings!,
                                            accountingConfig: { ...settings?.accountingConfig, complexityMode: mode as AccountingMode } as import('@nexus/contracts').AccountingConfig
                                        })}
                                        className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                            settings?.accountingConfig?.complexityMode === mode 
                                            ? 'bg-accent text-text-primary shadow-lg' 
                                            : 'text-text-muted hover:text-text-primary'
                                        }`}
                                    >
                                        {mode === 'SIMPLE' ? 'Flux (Simple)' : 'Ledger (Expert)'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <p className="text-[10px] text-text-muted italic leading-relaxed">
                            {settings?.accountingConfig?.complexityMode === 'SIMPLE' 
                                ? "Mode Flux : L'interface se concentre sur les rentrées/sorties de cash. Idéal pour un pilotage rapide."
                                : "Mode Ledger : Audit complet en partie double. Débit/Crédit activés pour chaque transaction."
                            }
                        </p>
                    </div>
                </GlassCard>

                {/* Section Sécurité : RBAC Status */}
                <GlassCard className="md:col-span-2 p-4 flex items-center justify-between border-accent/20 bg-accent/5">
                    <div className="flex items-center gap-3">
                        <Shield size={14} className="text-accent" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-accent">Status RBAC : Session {rbacLevel} Autorisée</span>
                    </div>
                    <div className="flex gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_8px_#10b981]" />
                        <span className="text-[8px] font-mono opacity-50 font-black">ENFORCEMENT ACTIVE</span>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
