'use client';

import { useState, useEffect, useCallback } from 'react';
import { BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { useTenant } from '@/shared/hooks/useTenant';

import {
    ZONES,
    hashPin,
    getWeekDates,
    taskKey,
    buildRecordPath,
    buildQueryPath,
    type CleaningRecord,
    type PinDialogState,
} from './cleaning-plan/cleaningPlanConstants';
import { CleaningCompletionStats } from './cleaning-plan/CleaningCompletionStats';
import { CleaningGridTable } from './cleaning-plan/CleaningGridTable';
import { CleaningPinDialog } from './cleaning-plan/CleaningPinDialog';

export function CleaningPlan() {
    const { tenantId } = useTenant();
    const weekDates = getWeekDates();

    const [records, setRecords] = useState<CleaningRecord[]>([]);
    const [pinDialog, setPinDialog] = useState<PinDialogState | null>(null);
    const [pinInput, setPinInput] = useState('');
    const [nameInput, setNameInput] = useState('');
    const [showDashboard, setShowDashboard] = useState(false);
    const [loading, setLoading] = useState(true);

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
    }, [tenantId, weekDates]);

    useEffect(() => {
        loadRecords();
    }, [loadRecords]);

    const isChecked = (zone: string, dayIdx: number, task: string): boolean => {
        const key = taskKey(zone, dayIdx, task);
        return records.some(r => r.zone === zone && r.date === weekDates[dayIdx] && r.taskKey === key);
    };

    const handleCellClick = (zone: string, dayIdx: number, task: string) => {
        if (isChecked(zone, dayIdx, task)) return; // Déjà signé — immuable
        setPinDialog({ zone, dayIdx, taskKey: taskKey(zone, dayIdx, task), taskLabel: task });
        setPinInput('');
        setNameInput('');
    };

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

            const path = buildRecordPath(tenantId ?? '', id);
            await Nexus.adapter.set(path, record);
            setRecords(prev => [...prev, record]);
            toast.success(`Tâche signée par ${nameInput.trim()}`);
            setPinDialog(null);
        } catch {
            toast.error('Erreur lors de la signature — veuillez réessayer');
        }
    };

    const completionByZone = ZONES.map(zone => {
        const totalTasks = zone.tasks.length * 7;
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
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-glass text-text-muted hover:text-text-primary text-sm transition-colors"
                >
                    <BarChart3 className="w-4 h-4" />
                    {showDashboard ? 'Masquer stats' : 'Voir stats'}
                </button>
            </div>

            {/* Dashboard manager */}
            {showDashboard && <CleaningCompletionStats completionByZone={completionByZone} />}

            {loading ? (
                <div className="text-sm text-text-muted animate-pulse p-4">Chargement des enregistrements...</div>
            ) : (
                <CleaningGridTable
                    weekDates={weekDates}
                    records={records}
                    isChecked={isChecked}
                    handleCellClick={handleCellClick}
                />
            )}

            {/* PIN Dialog */}
            {pinDialog && (
                <CleaningPinDialog
                    pinDialog={pinDialog}
                    onClose={() => setPinDialog(null)}
                    nameInput={nameInput}
                    setNameInput={setNameInput}
                    pinInput={pinInput}
                    setPinInput={setPinInput}
                    onSign={handleSign}
                />
            )}
        </div>
    );
}
