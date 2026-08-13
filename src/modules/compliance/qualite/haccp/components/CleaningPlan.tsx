'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    CheckSquare,
    Square,
    Lock,
    BarChart3,
    ChefHat,
    Refrigerator,
    UtensilsCrossed,
    ShowerHead,
    Wine,
} from 'lucide-react';
import { toast } from 'sonner';
import { Nexus, buildTenantPath } from '@/lib/nexus';
import { useTenant } from '@/kernel/hooks';
import type { PlatformVariant } from '@nexus/contracts';
import { signCleaningTaskAction } from '../actions/haccp.action';

// ── Types ──────────────────────────────────────────────────────────────────────

interface CleaningRecord {
    id: string;
    zone: string;
    date: string;          // ISO date string YYYY-MM-DD
    taskKey: string;
    completedAt: number;   // timestamp ms
    signedByPin: string;   // SHA-256 hex of PIN
    signedByName: string;
}

interface PinDialogState {
    zone: string;
    dayIdx: number;
    taskKey: string;
    taskLabel: string;
}

// ── Configuration ──────────────────────────────────────────────────────────────

const BASE_ZONES = [
    { id: 'cuisine', label: 'Cuisine', icon: ChefHat, tasks: ['Désinfecter les plans de travail', 'Nettoyer les équipements de cuisson', 'Laver les sols'] },
    { id: 'stockage_froid', label: 'Stockage froid', icon: Refrigerator, tasks: ['Contrôler les T° chambres froides', 'Nettoyer les joints de portes', 'Ranger selon FIFO'] },
    { id: 'salle', label: 'Salle', icon: UtensilsCrossed, tasks: ['Nettoyer les tables', 'Aspirer/laver le sol', 'Désinfecter les menus & supports'] },
    { id: 'sanitaires', label: 'Sanitaires', icon: ShowerHead, tasks: ['Nettoyer WC & lavabos', 'Réapprovisionner consommables', 'Désinfecter les poignées'] },
];

const BAR_ZONE = { id: 'bar', label: 'Bar', icon: Wine, tasks: ['Nettoyer la machine à café', 'Désinfecter le plan de bar', 'Vidanger les bacs de rinçage'] };

const VARIANTS_WITH_BAR: PlatformVariant[] = ['restaurant', 'hotel', 'custom'];

function resolveCleaningZones(variant: PlatformVariant = 'restaurant') {
    return VARIANTS_WITH_BAR.includes(variant)
        ? [...BASE_ZONES, BAR_ZONE]
        : BASE_ZONES;
}


const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

// ── PIN hashing (Web Crypto API) ──────────────────────────────────────────────

async function hashPin(pin: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin + '_haccp_salt');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function getWeekDates(): string[] {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon...
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d.toISOString().split('T')[0];
    });
}

function taskKey(zone: string, dayIdx: number, task: string): string {
    return `${zone}__${dayIdx}__${task.slice(0, 20).replace(/\s/g, '_')}`;
}

function buildRecordPath(tenantId: string, id: string): string {
    return buildTenantPath(tenantId, 'cleaningRecords', id);
}

function buildQueryPath(tenantId: string): string {
    return buildTenantPath(tenantId, 'cleaningRecords');
}

// ── Composant principal ────────────────────────────────────────────────────────

export function CleaningPlan() {
    const { tenantId, activeTenantConfig } = useTenant();
    const variant = (activeTenantConfig?.variant ?? 'restaurant') as PlatformVariant;
    const ZONES = resolveCleaningZones(variant);
    const weekDates = getWeekDates();

    const [records, setRecords] = useState<CleaningRecord[]>([]);
    const [pinDialog, setPinDialog] = useState<PinDialogState | null>(null);
    const [pinInput, setPinInput] = useState('');
    const [nameInput, setNameInput] = useState('');
    const [showDashboard, setShowDashboard] = useState(false);
    const [loading, setLoading] = useState(true);

    // Charger les enregistrements de la semaine
    const loadRecords = useCallback(async () => {
        setLoading(true);
        try {
            const path = buildQueryPath(tenantId ?? '');
            const raw = await Nexus.adapter.query<CleaningRecord>(path, {
                where: [
                    { field: 'date', operator: '>=', value: weekDates[0] },
                    { field: 'date', operator: '<=', value: weekDates[6] },
                ],
            });
            setRecords(raw);
        } catch {
            // Silencieux — données non critiques
        } finally {
            setLoading(false);
        }
     
    }, [tenantId, weekDates[0]]);

    useEffect(() => {
        loadRecords();
    }, [loadRecords]);

    // Vérifier si une cellule est cochée
    const isChecked = (zone: string, dayIdx: number, task: string): boolean => {
        const key = taskKey(zone, dayIdx, task);
        return records.some(r => r.zone === zone && r.date === weekDates[dayIdx] && r.taskKey === key);
    };

    // Ouvrir le dialog PIN
    const handleCellClick = (zone: string, dayIdx: number, task: string) => {
        if (isChecked(zone, dayIdx, task)) return; // Déjà signé — immuable
        setPinDialog({ zone, dayIdx, taskKey: taskKey(zone, dayIdx, task), taskLabel: task });
        setPinInput('');
        setNameInput('');
    };

    // Soumettre la signature
    const handleSign = async () => {
        if (!pinDialog) return;
        if (pinInput.length < 4) {
            toast.error('Le PIN doit contenir au moins 4 chiffres');
            return;
        }
        if (!nameInput.trim()) {
            toast.error('Veuillez saisir votre nom');
            return;
        }

        try {
            const pinHash = await hashPin(pinInput);
            const id = crypto.randomUUID();
            const record: CleaningRecord = {
                id,
                zone: pinDialog.zone,
                date: weekDates[pinDialog.dayIdx],
                taskKey: pinDialog.taskKey,
                completedAt: Date.now(),
                signedByPin: pinHash,
                signedByName: nameInput.trim(),
            };

            await signCleaningTaskAction(tenantId ?? '', record);
            setRecords(prev => [...prev, record]);
            toast.success(`Tâche signée par ${nameInput.trim()}`);
            setPinDialog(null);
        } catch {
            toast.error('Erreur lors de la signature — veuillez réessayer');
        }
    };

    // Dashboard : taux de complétion par zone
    const completionByZone = ZONES.map(zone => {
        const totalTasks = zone.tasks.length * 7; // par semaine
        const done = weekDates.reduce((acc, date, dayIdx) =>
            acc + zone.tasks.filter(t => isChecked(zone.id, dayIdx, t)).length, 0
        );
        return { zone: zone.label, done, total: totalTasks, pct: totalTasks > 0 ? Math.round((done / totalTasks) * 100) : 0 };
    });

    return (
        <div className="space-y-4">
            {/* En-tête */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-text-primary">Plan de nettoyage hebdomadaire</h2>
                    <p className="text-xs text-text-muted mt-0.5">
                        Semaine du {new Date(weekDates[0]).toLocaleDateString('fr-FR')} au {new Date(weekDates[6]).toLocaleDateString('fr-FR')}
                    </p>
                </div>
                <button
                    onClick={() => setShowDashboard(s => !s)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-sidebar text-text-muted hover:text-text-primary text-sm transition-colors"
                >
                    <BarChart3 className="w-4 h-4" />
                    {showDashboard ? 'Masquer stats' : 'Voir stats'}
                </button>
            </div>

            {/* Dashboard manager */}
            {showDashboard && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 bg-surface-sidebar rounded-xl border border-border">
                    {completionByZone.map(z => (
                        <div key={z.zone} className="flex flex-col items-center gap-1">
                            <div className="text-xs font-medium text-text-muted">{z.zone}</div>
                            <div
                                className={`text-2xl font-black ${z.pct === 100 ? 'text-status-success' : z.pct >= 50 ? 'text-status-warning' : 'text-status-danger'}`}
                            >
                                {z.pct}%
                            </div>
                            <div className="text-xs text-text-muted">{z.done}/{z.total} tâches</div>
                            <div className="w-full bg-border rounded-full h-1.5 mt-1">
                                <div
                                    className={`h-1.5 rounded-full transition-all ${z.pct === 100 ? 'bg-status-success' : z.pct >= 50 ? 'bg-status-warning' : 'bg-status-danger'}`}
                                    style={{ width: `${z.pct}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {loading ? (
                <div className="text-sm text-text-muted animate-pulse p-4">Chargement des enregistrements...</div>
            ) : (
                /* Grille hebdomadaire */
                <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-xs border-collapse min-w-[720px]">
                        <thead>
                            <tr className="bg-surface-sidebar">
                                <th className="px-3 py-2 text-left text-text-muted font-medium border-b border-border w-40">Zone / Tâche</th>
                                {DAYS.map((day, i) => (
                                    <th key={day} className="px-2 py-2 text-center text-text-muted font-medium border-b border-border">
                                        <div>{day}</div>
                                        <div className="text-[10px] text-text-disabled mt-0.5">
                                            {new Date(weekDates[i]).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {ZONES.map((zone) => {
                                const ZoneIcon = zone.icon;
                                return (
                                    <>
                                        {/* Ligne zone */}
                                        <tr key={`zone-${zone.id}`} className="bg-surface-base">
                                            <td colSpan={8} className="px-3 py-1.5 border-b border-border">
                                                <div className="flex items-center gap-2 font-semibold text-text-primary">
                                                    <ZoneIcon className="w-3.5 h-3.5 text-action-primary" />
                                                    {zone.label}
                                                </div>
                                            </td>
                                        </tr>
                                        {/* Lignes tâches */}
                                        {zone.tasks.map((task) => (
                                            <tr key={`${zone.id}-${task}`} className="hover:bg-surface-sidebar/50 transition-colors border-b border-border/50">
                                                <td className="px-3 py-2 text-text-muted pl-7">{task}</td>
                                                {DAYS.map((_, dayIdx) => {
                                                    const checked = isChecked(zone.id, dayIdx, task);
                                                    const rec = records.find(
                                                        r => r.zone === zone.id && r.date === weekDates[dayIdx] && r.taskKey === taskKey(zone.id, dayIdx, task)
                                                    );
                                                    return (
                                                        <td key={dayIdx} className="px-2 py-2 text-center">
                                                            {checked ? (
                                                                <div className="flex flex-col items-center gap-0.5">
                                                                    <CheckSquare className="w-4 h-4 text-status-success mx-auto" />
                                                                    {rec && (
                                                                        <span className="text-[9px] text-text-muted leading-tight">{rec.signedByName.split(' ')[0]}</span>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleCellClick(zone.id, dayIdx, task)}
                                                                    className="hover:text-action-primary transition-colors"
                                                                    title="Cocher et signer"
                                                                >
                                                                    <Square className="w-4 h-4 text-text-disabled mx-auto" />
                                                                </button>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* PIN Dialog */}
            {pinDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-surface-base rounded-2xl border border-border shadow-2xl p-6 w-full max-w-sm mx-4">
                        <div className="flex items-center gap-2 mb-4">
                            <Lock className="w-5 h-5 text-action-primary" />
                            <h3 className="font-bold text-text-primary">Signature numérique</h3>
                        </div>
                        <p className="text-sm text-text-muted mb-1">Tâche :</p>
                        <p className="text-sm font-medium text-text-primary mb-4 bg-surface-sidebar rounded-lg px-3 py-2">
                            {pinDialog.taskLabel}
                        </p>
                        <label className="block text-xs text-text-muted mb-1">Votre nom</label>
                        <input
                            type="text"
                            value={nameInput}
                            onChange={e => setNameInput(e.target.value)}
                            placeholder="Prénom Nom"
                            className="w-full mb-3 px-3 py-2 rounded-lg border border-border bg-surface-sidebar text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-action-primary"
                        />
                        <label className="block text-xs text-text-muted mb-1">Code PIN (4+ chiffres)</label>
                        <input
                            type="password"
                            inputMode="numeric"
                            value={pinInput}
                            onChange={e => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 8))}
                            placeholder="••••"
                            className="w-full mb-4 px-3 py-2 rounded-lg border border-border bg-surface-sidebar text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-action-primary tracking-widest"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPinDialog(null)}
                                className="flex-1 px-4 py-2 rounded-lg border border-border text-text-muted text-sm hover:text-text-primary transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleSign}
                                disabled={pinInput.length < 4 || !nameInput.trim()}
                                className="flex-1 px-4 py-2 rounded-lg bg-action-primary text-text-primary text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
                            >
                                Signer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
