'use client';

import { useState } from 'react';
import { ArrowLeftRight, Combine, UserRoundCog, ScanEye, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/ui.foundations';

interface TableLike {
    id: string;
    number?: string | number | null;
    activeOrderId?: string;
}

interface Props {
    currentTable: TableLike | null | undefined;
    allTables: TableLike[];
    onTransferTable: (toTableId: string, orderId: string) => Promise<void>;
    onMergeTable: (secondaryTableId: string, secondaryOrderId: string, primaryOrderId: string) => Promise<void>;
    onHandoffTable: (orderId: string, toOperatorId: string) => Promise<void>;
    onScanDineAndDash: () => Promise<Array<{ orderId?: string; tableNumber?: string | number }>>;
}

type Mode = null | 'transfer' | 'merge' | 'handoff';

/**
 * Menu d'actions sur la table active — câble bout-en-bout les services de salle :
 * TableTransferService · TableMergeService · TableHandoffService · DineAndDashDetectorService
 * (tous appelés via les handlers de `usePOSController`).
 */
export function TableActionsMenu({
    currentTable,
    allTables,
    onTransferTable,
    onMergeTable,
    onHandoffTable,
    onScanDineAndDash,
}: Props) {
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<Mode>(null);
    const [operatorId, setOperatorId] = useState('');
    const [busy, setBusy] = useState(false);

    const orderId = currentTable?.activeOrderId;
    const otherTables = allTables.filter(t => t.id !== currentTable?.id && !!t.activeOrderId === (mode === 'merge'));

    const close = () => { setOpen(false); setMode(null); setOperatorId(''); };

    const guard = (): string | null => {
        if (!currentTable) return 'Aucune table active';
        if (!orderId) return 'Aucune commande ouverte sur cette table';
        return null;
    };

    const doTransfer = async (toTableId: string) => {
        const err = guard(); if (err) return toast.error(err);
        setBusy(true);
        try { await onTransferTable(toTableId, orderId!); close(); } finally { setBusy(false); }
    };

    const doMerge = async (secondary: TableLike) => {
        const err = guard(); if (err) return toast.error(err);
        if (!secondary.activeOrderId) return toast.error('La table cible n’a pas de commande à fusionner');
        setBusy(true);
        try { await onMergeTable(secondary.id, secondary.activeOrderId, orderId!); close(); } finally { setBusy(false); }
    };

    const doHandoff = async () => {
        const err = guard(); if (err) return toast.error(err);
        if (!operatorId.trim()) return toast.error('Saisir le code du collaborateur');
        setBusy(true);
        try { await onHandoffTable(orderId!, operatorId.trim()); close(); } finally { setBusy(false); }
    };

    const doScan = async () => {
        setBusy(true);
        try {
            const open = await onScanDineAndDash();
            toast.info(open.length === 0
                ? 'Aucun départ sans paiement détecté'
                : `${open.length} table(s) potentiellement parties sans payer`);
            close();
        } finally { setBusy(false); }
    };

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label="Actions de table"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border-default text-text-muted hover:text-text-primary hover:bg-surface-hover"
            >
                <MoreVertical className="h-4 w-4" />
            </button>

            {open && (
                <div
                    role="menu"
                    className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-border-default bg-surface-card p-1.5 shadow-2xl"
                >
                    {mode === null && (
                        <>
                            <MenuItem icon={ArrowLeftRight} label="Transférer la table" onClick={() => setMode('transfer')} />
                            <MenuItem icon={Combine} label="Fusionner avec…" onClick={() => setMode('merge')} />
                            <MenuItem icon={UserRoundCog} label="Passer le rang" onClick={() => setMode('handoff')} />
                            <MenuItem icon={ScanEye} label="Contrôle départs sans paiement" onClick={doScan} disabled={busy} />
                        </>
                    )}

                    {(mode === 'transfer' || mode === 'merge') && (
                        <div className="max-h-64 overflow-auto">
                            <p className="px-2 py-1.5 text-xs text-text-muted">
                                {mode === 'transfer' ? 'Transférer vers' : 'Fusionner la commande de'}
                            </p>
                            {otherTables.length === 0 && (
                                <p className="px-2 py-2 text-xs text-text-muted italic">Aucune table éligible</p>
                            )}
                            {otherTables.map(t => (
                                <MenuItem
                                    key={t.id}
                                    label={`Table ${t.number ?? t.id}`}
                                    disabled={busy}
                                    onClick={() => (mode === 'transfer' ? doTransfer(t.id) : doMerge(t))}
                                />
                            ))}
                        </div>
                    )}

                    {mode === 'handoff' && (
                        <div className="p-2 space-y-2">
                            <label className="block text-xs text-text-muted">Code du collaborateur repreneur</label>
                            <input
                                value={operatorId}
                                onChange={e => setOperatorId(e.target.value)}
                                inputMode="numeric"
                                className="w-full rounded-lg border border-border-default bg-surface-bg px-2.5 py-1.5 text-sm"
                                placeholder="ex: 4821"
                            />
                            <button
                                type="button"
                                onClick={doHandoff}
                                disabled={busy}
                                className="w-full rounded-lg bg-action-primary px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                            >
                                Confirmer la passation
                            </button>
                        </div>
                    )}

                    {mode !== null && (
                        <button
                            type="button"
                            onClick={() => setMode(null)}
                            className="mt-1 w-full rounded-lg px-2 py-1.5 text-left text-xs text-text-muted hover:bg-surface-hover"
                        >
                            ← Retour
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

function MenuItem({
    icon: Icon,
    label,
    onClick,
    disabled,
}: {
    icon?: typeof ArrowLeftRight;
    label: string;
    onClick: () => void;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            role="menuitem"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                'text-text-primary hover:bg-surface-hover disabled:opacity-40 disabled:hover:bg-transparent',
            )}
        >
            {Icon && <Icon className="h-4 w-4 text-text-muted" />}
            {label}
        </button>
    );
}
