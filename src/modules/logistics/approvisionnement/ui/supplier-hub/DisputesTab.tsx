'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, X, AlertCircle, FileCheck2 } from 'lucide-react';
import { SupplierHubService, eurosToMicrounits } from '../../../services/SupplierHubService';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { useAuth } from '@/shared/hooks';
import { toError } from '@/lib/toError';
import type { SupplierDispute, SupplierDisputeReason, SupplierDisputeStatus } from '@nexus/contracts';

const REASONS: Array<{ value: SupplierDisputeReason; label: string }> = [
    { value: 'missing', label: 'Colis manquant' },
    { value: 'damaged', label: 'Marchandise abîmée' },
    { value: 'non_conforme', label: 'Produit non conforme' },
    { value: 'temperature', label: 'Rupture chaîne du froid' },
    { value: 'price_gap', label: 'Écart de prix BL / tarif' },
    { value: 'expired', label: 'DLC insuffisante' },
];

const STATUS_META: Record<SupplierDisputeStatus, { label: string; tone: string }> = {
    declared: { label: 'Déclaré', tone: 'bg-surface-glass text-text-secondary border-border-default' },
    claimed: { label: 'Avoir en attente', tone: 'bg-status-warning/10 text-status-warning border-status-warning/20' },
    credited: { label: 'Avoir reçu', tone: 'bg-status-info/10 text-status-info border-status-info/20' },
    settled: { label: 'Avoir déduit', tone: 'bg-status-success/10 text-status-success border-status-success/20' },
    rejected: { label: 'Refusé', tone: 'bg-status-danger/10 text-status-danger border-status-danger/20' },
};

const eur = (mu: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(mu / 1_000_000);

interface SupplierOption { id: string; name: string }

export function DisputesTab() {
    const { currentUser } = useAuth();
    const [disputes, setDisputes] = useState<SupplierDispute[]>([]);
    const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDeclaring, setIsDeclaring] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [settling, setSettling] = useState<SupplierDispute | null>(null);

    const [draft, setDraft] = useState({ supplierId: '', blNumber: '', reason: 'missing' as SupplierDisputeReason, details: '', amountEuros: '' });
    const [credit, setCredit] = useState({ creditNoteNumber: '', amountEuros: '', settlementReference: '' });

    const load = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [rows, supplierRows] = await Promise.all([
                SupplierHubService.listDisputes(),
                Nexus.adapter.query<SupplierOption>('suppliers'),
            ]);
            setDisputes(rows);
            setSuppliers(supplierRows ?? []);
        } catch (err) {
            setError(`Chargement impossible : ${toError(err).message}`);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { void load(); }, [load]);

    const openCount = useMemo(
        () => disputes.filter(d => d.status === 'claimed' || d.status === 'declared').length,
        [disputes],
    );
    const pendingAmount = useMemo(
        () => disputes
            .filter(d => d.status === 'claimed' || d.status === 'declared')
            .reduce((sum, d) => sum + d.claimedAmountInMicrounits, 0),
        [disputes],
    );

async function executeDisputeDeclaration(
    draft: { supplierId: string; blNumber: string; reason: SupplierDisputeReason; details: string; amountEuros: string },
    suppliers: SupplierOption[],
    currentUserName: string,
): Promise<SupplierDispute> {
    const supplier = suppliers.find(s => s.id === draft.supplierId);
    if (!supplier) throw new Error('Choisissez le fournisseur concerné.');
    const amount = Number.parseFloat(draft.amountEuros.replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('Indiquez le montant réclamé.');

    return SupplierHubService.declareDispute({
        supplierId: supplier.id,
        supplierName: supplier.name,
        blNumber: draft.blNumber,
        reason: draft.reason,
        details: draft.details,
        claimedAmountInMicrounits: eurosToMicrounits(amount),
        declaredBy: currentUserName,
    });
}

async function executeDisputeSettlement(
    settlingId: string,
    credit: { creditNoteNumber: string; amountEuros: string; settlementReference: string },
): Promise<number> {
    const amount = Number.parseFloat(credit.amountEuros.replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("Indiquez le montant de l'avoir reçu.");

    const creditedAmountInMicrounits = eurosToMicrounits(amount);
    await SupplierHubService.settleDispute({
        disputeId: settlingId,
        creditNoteNumber: credit.creditNoteNumber,
        creditedAmountInMicrounits,
        settlementReference: credit.settlementReference,
    });
    return creditedAmountInMicrounits;
}

    const handleDeclare = async () => {
        setIsSaving(true);
        setError(null);
        try {
            const created = await executeDisputeDeclaration(draft, suppliers, currentUser?.name ?? 'Inconnu');
            setDisputes(prev => [created, ...prev]);
            setDraft({ supplierId: '', blNumber: '', reason: 'missing', details: '', amountEuros: '' });
            setIsDeclaring(false);
        } catch (err) {
            setError(toError(err).message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSettle = async () => {
        if (!settling) return;
        setIsSaving(true);
        setError(null);
        try {
            const creditedAmount = await executeDisputeSettlement(settling.id, credit);
            setDisputes(prev => prev.map(d => (d.id === settling.id
                ? {
                    ...d,
                    status: 'settled' as const,
                    creditNoteNumber: credit.creditNoteNumber.trim(),
                    creditedAmountInMicrounits: creditedAmount,
                    settlementReference: credit.settlementReference.trim() || undefined,
                    settledAt: new Date().toISOString(),
                }
                : d)));
            setSettling(null);
            setCredit({ creditNoteNumber: '', amountEuros: '', settlementReference: '' });
        } catch (err) {
            setError(toError(err).message);
        } finally {
            setIsSaving(false);
        }
    };

    const inputCls = 'bg-surface-glass border border-border-default rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-border-focus w-full';
    const labelCls = 'text-nano font-bold uppercase tracking-wider text-text-muted';

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h3 className="font-bold text-text-primary text-sm flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-status-warning" />
                        Litiges Réception &amp; Demandes d&apos;Avoirs
                    </h3>
                    {!isLoading && openCount > 0 && (
                        <p className="text-micro text-text-muted mt-1">
                            {openCount} litige{openCount > 1 ? 's' : ''} en attente · {eur(pendingAmount)} réclamés
                        </p>
                    )}
                </div>
                <button
                    type="button"
                    onClick={() => { setIsDeclaring(v => !v); setError(null); }}
                    disabled={suppliers.length === 0}
                    className="px-3 py-2 min-h-[44px] rounded-xl bg-action-primary text-text-on-primary font-bold text-xs uppercase disabled:opacity-40 flex items-center justify-center gap-2 transition-opacity hover:opacity-90 cursor-pointer"
                >
                    {isDeclaring ? <X className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    {isDeclaring ? 'Annuler' : 'Déclarer une non-conformité BL'}
                </button>
            </div>

            {suppliers.length === 0 && !isLoading && (
                <p className="text-xs text-text-muted">
                    Aucun fournisseur enregistré : ajoutez-en un dans l&apos;annuaire avant de déclarer un litige.
                </p>
            )}

            {error && (
                <div role="alert" className="flex items-center gap-2 px-4 py-3 rounded-xl bg-status-danger/10 border border-status-danger/20 text-status-danger text-xs font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                </div>
            )}

            {isDeclaring && (
                <div className="p-5 rounded-2xl bg-surface-card border border-border-default space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <label className="flex flex-col gap-1.5">
                            <span className={labelCls}>Fournisseur</span>
                            <select
                                value={draft.supplierId}
                                onChange={e => setDraft(d => ({ ...d, supplierId: e.target.value }))}
                                className={inputCls}
                            >
                                <option value="">— Choisir —</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </label>
                        <label className="flex flex-col gap-1.5">
                            <span className={labelCls}>N° de bon de livraison</span>
                            <input type="text" value={draft.blNumber} onChange={e => setDraft(d => ({ ...d, blNumber: e.target.value }))} className={inputCls} />
                        </label>
                        <label className="flex flex-col gap-1.5">
                            <span className={labelCls}>Motif</span>
                            <select
                                value={draft.reason}
                                onChange={e => setDraft(d => ({ ...d, reason: e.target.value as SupplierDisputeReason }))}
                                className={inputCls}
                            >
                                {REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                            </select>
                        </label>
                        <label className="flex flex-col gap-1.5">
                            <span className={labelCls}>Montant réclamé (€ TTC)</span>
                            <input type="text" inputMode="decimal" value={draft.amountEuros} onChange={e => setDraft(d => ({ ...d, amountEuros: e.target.value }))} className={inputCls} />
                        </label>
                        <label className="flex flex-col gap-1.5 sm:col-span-2">
                            <span className={labelCls}>Détail du constat</span>
                            <input type="text" value={draft.details} onChange={e => setDraft(d => ({ ...d, details: e.target.value }))} placeholder="ex. 1 colis de beurre manquant sur 3 annoncés" className={inputCls} />
                        </label>
                    </div>
                    <button
                        type="button"
                        onClick={() => void handleDeclare()}
                        disabled={isSaving}
                        className="px-4 py-2 min-h-[44px] rounded-xl bg-action-primary text-text-on-primary font-bold text-xs uppercase disabled:opacity-40 flex items-center gap-2 cursor-pointer"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        Enregistrer le litige
                    </button>
                </div>
            )}

            {isLoading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-text-muted text-xs">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Chargement des litiges…
                </div>
            ) : disputes.length === 0 ? (
                <div className="py-16 text-center space-y-2">
                    <FileCheck2 className="w-10 h-10 mx-auto text-text-muted/40" />
                    <p className="text-sm text-text-muted">Aucun litige en cours. Les non-conformités déclarées à réception apparaîtront ici.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {disputes.map(d => (
                        <DisputeCard
                            key={d.id}
                            dispute={d}
                            isSettling={settling?.id === d.id}
                            credit={credit}
                            isSaving={isSaving}
                            inputCls={inputCls}
                            labelCls={labelCls}
                            onStartSettle={() => {
                                setSettling(d);
                                setCredit({ creditNoteNumber: '', amountEuros: (d.claimedAmountInMicrounits / 1_000_000).toFixed(2), settlementReference: '' });
                                setError(null);
                            }}
                            onCreditChange={setCredit}
                            onValidateSettle={() => void handleSettle()}
                            onCancelSettle={() => setSettling(null)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

interface DisputeCardProps {
    dispute: SupplierDispute;
    isSettling: boolean;
    credit: { creditNoteNumber: string; amountEuros: string; settlementReference: string };
    isSaving: boolean;
    inputCls: string;
    labelCls: string;
    onStartSettle: () => void;
    onCreditChange: React.Dispatch<React.SetStateAction<{ creditNoteNumber: string; amountEuros: string; settlementReference: string }>>;
    onValidateSettle: () => void;
    onCancelSettle: () => void;
}

function DisputeCard({
    dispute: d,
    isSettling,
    credit,
    isSaving,
    inputCls,
    labelCls,
    onStartSettle,
    onCreditChange,
    onValidateSettle,
    onCancelSettle,
}: DisputeCardProps) {
    const meta = STATUS_META[d.status];
    const reasonLabel = REASONS.find(r => r.value === d.reason)?.label ?? d.reason;
    const isSettled = d.status === 'settled';

    return (
        <div className="p-5 rounded-2xl bg-surface-card border border-border-default space-y-3">
            <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-bold text-text-primary">
                    {d.reference} — {d.supplierName}
                </span>
                <span className={`text-nano font-bold px-2 py-0.5 rounded border shrink-0 uppercase ${meta.tone}`}>
                    {meta.label}
                </span>
            </div>

            <div className="text-xs text-text-secondary space-y-1">
                <div>BL Fournisseur : <strong className="text-text-primary">{d.blNumber}</strong></div>
                <div>
                    Motif : <span className="text-status-danger font-semibold">{reasonLabel}</span>
                    {d.details && <span className="text-text-muted"> — {d.details}</span>}
                </div>
                <div>
                    Réclamé : <strong className="text-text-primary">{eur(d.claimedAmountInMicrounits)}</strong>
                    {d.creditedAmountInMicrounits !== undefined && (
                        <span className="text-status-success font-semibold"> · Avoir reçu : {eur(d.creditedAmountInMicrounits)}</span>
                    )}
                </div>
                {d.creditNoteNumber && <div className="text-text-muted">Avoir n° {d.creditNoteNumber}</div>}
                {d.settlementReference && <div className="text-text-muted">Déduit sur : {d.settlementReference}</div>}
            </div>

            <div className="pt-2 border-t border-border-default flex items-center justify-between gap-2 text-xs">
                <span className="text-text-muted">
                    Déclaré le {new Date(d.declaredAt).toLocaleDateString('fr-FR')} par {d.declaredBy}
                </span>
                {isSettled ? (
                    <CheckCircle2 className="w-4 h-4 text-status-success shrink-0" />
                ) : (
                    <button
                        type="button"
                        onClick={onStartSettle}
                        className="text-status-warning hover:underline font-bold shrink-0 cursor-pointer"
                    >
                        Rapprocher l&apos;avoir
                    </button>
                )}
            </div>

            {isSettling && (
                <div className="pt-3 border-t border-border-default space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <label className="flex flex-col gap-1.5">
                            <span className={labelCls}>N° d&apos;avoir</span>
                            <input
                                type="text"
                                value={credit.creditNoteNumber}
                                onChange={e => onCreditChange(c => ({ ...c, creditNoteNumber: e.target.value }))}
                                className={inputCls}
                            />
                        </label>
                        <label className="flex flex-col gap-1.5">
                            <span className={labelCls}>Montant (€)</span>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={credit.amountEuros}
                                onChange={e => onCreditChange(c => ({ ...c, amountEuros: e.target.value }))}
                                className={inputCls}
                            />
                        </label>
                        <label className="flex flex-col gap-1.5">
                            <span className={labelCls}>Règlement</span>
                            <input
                                type="text"
                                value={credit.settlementReference}
                                onChange={e => onCreditChange(c => ({ ...c, settlementReference: e.target.value }))}
                                placeholder="ex. virement 31/08"
                                className={inputCls}
                            />
                        </label>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onValidateSettle}
                            disabled={isSaving}
                            className="px-4 py-2 min-h-[44px] rounded-xl bg-status-success text-text-on-primary font-bold text-xs uppercase disabled:opacity-40 flex items-center gap-2 cursor-pointer"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            Valider
                        </button>
                        <button
                            type="button"
                            onClick={onCancelSettle}
                            className="px-4 py-2 min-h-[44px] rounded-xl border border-border-default text-text-muted hover:text-text-primary font-bold text-xs uppercase cursor-pointer"
                        >
                            Annuler
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
