'use client';

import { useCallback, useEffect, useState } from 'react';
import { Award, Loader2, AlertCircle, Plus, X, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { SupplierHubService, eurosToMicrounits } from '../../../services/SupplierHubService';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { COLLECTIONS } from '@nexus/constants/collections';
import { toError } from '@/lib/toError';
import type { SupplierRebateScheme, SupplierRebateTier } from '@nexus/contracts';

const eur = (mu: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(mu / 1_000_000);

interface SupplierOption { id: string; name: string }

export function RfaTab() {
    const [schemes, setSchemes] = useState<SupplierRebateScheme[]>([]);
    const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const [draft, setDraft] = useState({
        supplierId: '',
        year: String(new Date().getFullYear()),
        purchasedEuros: '0',
        tiers: [
            { thresholdEuros: '10000', ratePercent: '2' },
            { thresholdEuros: '25000', ratePercent: '4' },
            { thresholdEuros: '50000', ratePercent: '6' },
        ],
    });

    const load = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [rows, supplierRows] = await Promise.all([
                SupplierHubService.listRebates(),
                Nexus.adapter.query<SupplierOption>('suppliers'),
            ]);
            setSchemes(rows);
            setSuppliers(supplierRows ?? []);
        } catch (err) {
            setError(`Chargement impossible : ${toError(err).message}`);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { void load(); }, [load]);

    const handleCreate = async () => {
        const supplier = suppliers.find(s => s.id === draft.supplierId);
        if (!supplier) { setError('Choisissez le fournisseur du contrat.'); return; }

        const tiers: SupplierRebateTier[] = draft.tiers
            .map(t => ({
                thresholdInMicrounits: eurosToMicrounits(Number.parseFloat(t.thresholdEuros.replace(',', '.')) || 0),
                ratePercent: Number.parseFloat(t.ratePercent.replace(',', '.')) || 0,
            }))
            .filter(t => t.thresholdInMicrounits > 0 && t.ratePercent > 0)
            .sort((a, b) => a.thresholdInMicrounits - b.thresholdInMicrounits);

        if (tiers.length === 0) { setError('Renseignez au moins un palier (seuil et taux).'); return; }

        setIsSaving(true);
        setError(null);
        try {
            const id = Nexus.adapter.generateId(COLLECTIONS.supplierRebates);
            const scheme: SupplierRebateScheme = {
                id,
                supplierId: supplier.id,
                supplierName: supplier.name,
                year: Number.parseInt(draft.year, 10) || new Date().getFullYear(),
                tiers,
                purchasedToDateInMicrounits: eurosToMicrounits(Number.parseFloat(draft.purchasedEuros.replace(',', '.')) || 0),
                updatedAt: new Date().toISOString(),
            };
            await Nexus.adapter.set(`${COLLECTIONS.supplierRebates}/${id}`, scheme);
            setSchemes(prev => [...prev, scheme]);
            setIsCreating(false);
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
                <h3 className="font-bold text-text-primary text-sm flex items-center gap-2">
                    <Award className="w-4 h-4 text-status-warning" />
                    Remises de fin d&apos;année
                </h3>
                <button
                    type="button"
                    onClick={() => { setIsCreating(v => !v); setError(null); }}
                    disabled={suppliers.length === 0}
                    className="px-3 py-2 min-h-[44px] rounded-xl bg-action-primary text-text-on-primary font-bold text-xs uppercase disabled:opacity-40 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                    {isCreating ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {isCreating ? 'Annuler' : 'Nouveau contrat RFA'}
                </button>
            </div>

            {error && (
                <div role="alert" className="flex items-center gap-2 px-4 py-3 rounded-xl bg-status-danger/10 border border-status-danger/20 text-status-danger text-xs font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                </div>
            )}

            {isCreating && (
                <div className="p-5 rounded-2xl bg-surface-card border border-border-default space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <label className="flex flex-col gap-1.5">
                            <span className={labelCls}>Fournisseur</span>
                            <select value={draft.supplierId} onChange={e => setDraft(d => ({ ...d, supplierId: e.target.value }))} className={inputCls}>
                                <option value="">— Choisir —</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </label>
                        <label className="flex flex-col gap-1.5">
                            <span className={labelCls}>Exercice</span>
                            <input type="number" value={draft.year} onChange={e => setDraft(d => ({ ...d, year: e.target.value }))} className={inputCls} />
                        </label>
                        <label className="flex flex-col gap-1.5">
                            <span className={labelCls}>Achats cumulés (€ HT)</span>
                            <input type="text" inputMode="decimal" value={draft.purchasedEuros} onChange={e => setDraft(d => ({ ...d, purchasedEuros: e.target.value }))} className={inputCls} />
                        </label>
                    </div>

                    <div className="space-y-2">
                        <span className={labelCls}>Paliers du barème</span>
                        {draft.tiers.map((t, i) => (
                            <div key={i} className="grid grid-cols-2 gap-2">
                                <input
                                    type="text" inputMode="decimal" value={t.thresholdEuros}
                                    onChange={e => setDraft(d => ({ ...d, tiers: d.tiers.map((x, j) => j === i ? { ...x, thresholdEuros: e.target.value } : x) }))}
                                    aria-label={`Seuil du palier ${i + 1} en euros`}
                                    placeholder="Seuil € HT" className={inputCls}
                                />
                                <input
                                    type="text" inputMode="decimal" value={t.ratePercent}
                                    onChange={e => setDraft(d => ({ ...d, tiers: d.tiers.map((x, j) => j === i ? { ...x, ratePercent: e.target.value } : x) }))}
                                    aria-label={`Taux du palier ${i + 1} en pourcentage`}
                                    placeholder="Taux %" className={inputCls}
                                />
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => setDraft(d => ({ ...d, tiers: [...d.tiers, { thresholdEuros: '', ratePercent: '' }] }))}
                            className="text-xs font-bold text-text-muted hover:text-text-primary flex items-center gap-1.5"
                        >
                            <Plus className="w-3.5 h-3.5" /> Ajouter un palier
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => void handleCreate()}
                        disabled={isSaving}
                        className="px-4 py-2 min-h-[44px] rounded-xl bg-action-primary text-text-on-primary font-bold text-xs uppercase disabled:opacity-40 flex items-center gap-2"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Enregistrer le contrat
                    </button>
                </div>
            )}

            {isLoading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-text-muted text-xs">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Chargement des contrats…
                </div>
            ) : schemes.length === 0 ? (
                <div className="py-16 text-center space-y-2">
                    <Award className="w-10 h-10 mx-auto text-text-muted/40" />
                    <p className="text-sm text-text-muted max-w-md mx-auto">
                        Aucun contrat de remise enregistré. Saisissez le barème négocié avec un fournisseur
                        pour suivre la remise acquise au fil de l&apos;exercice.
                    </p>
                </div>
            ) : (
                schemes.map(scheme => {
                    const calc = SupplierHubService.computeRebate(scheme);
                    const target = calc.nextTier?.thresholdInMicrounits
                        ?? calc.currentTier?.thresholdInMicrounits
                        ?? scheme.purchasedToDateInMicrounits;
                    const progress = target > 0
                        ? Math.min(100, (scheme.purchasedToDateInMicrounits / target) * 100)
                        : 0;
                    const isOpen = expanded === scheme.id;

                    // Gain si le palier suivant est franchi, à achats égaux au seuil.
                    const gainAtNext = calc.nextTier
                        ? Math.round(calc.nextTier.thresholdInMicrounits * (calc.nextTier.ratePercent / 100)) - calc.earnedInMicrounits
                        : 0;

                    return (
                        <div key={scheme.id} className="p-5 rounded-2xl bg-surface-card border border-border-default space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                <div>
                                    <h3 className="font-bold text-text-primary text-base flex items-center gap-2">
                                        <Award className="w-5 h-5 text-status-warning" />
                                        Contrat RFA — {scheme.supplierName} ({scheme.year})
                                    </h3>
                                    <p className="text-xs text-text-muted mt-0.5">
                                        Période : 01/01/{scheme.year} au 31/12/{scheme.year} · {scheme.tiers.length} palier{scheme.tiers.length > 1 ? 's' : ''}
                                    </p>
                                </div>
                                <div className="sm:text-right shrink-0">
                                    <div className="text-xs text-text-muted">RFA acquise à date</div>
                                    <div className="text-lg font-black text-status-success tabular-nums">{eur(calc.earnedInMicrounits)}</div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                    <span className="text-text-secondary">
                                        Achats cumulés : <strong className="text-text-primary tabular-nums">{eur(scheme.purchasedToDateInMicrounits)} HT</strong>
                                    </span>
                                    <span className="text-status-warning font-bold">
                                        {calc.currentTier
                                            ? `Palier ${calc.currentTier.ratePercent} % atteint`
                                            : 'Aucun palier atteint'}
                                    </span>
                                </div>

                                <div
                                    className="w-full h-3 rounded-full bg-surface-glass border border-border-default overflow-hidden"
                                    role="progressbar"
                                    aria-valuenow={Math.round(progress)}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    aria-label={`Progression vers le palier suivant chez ${scheme.supplierName}`}
                                >
                                    <div className="h-full bg-action-primary rounded-full transition-[width] duration-500" style={{ width: `${progress}%` }} />
                                </div>

                                {calc.nextTier ? (
                                    <p className="text-micro text-text-muted">
                                        Palier suivant à {eur(calc.nextTier.thresholdInMicrounits)} ({calc.nextTier.ratePercent} %) —
                                        manque <strong className="text-text-primary">{eur(calc.missingForNextInMicrounits)}</strong>
                                        {gainAtNext > 0 && <> pour <strong className="text-status-success">+{eur(gainAtNext)}</strong> de remise</>}
                                    </p>
                                ) : (
                                    <p className="text-micro text-status-success">Palier maximal atteint.</p>
                                )}
                            </div>

                            <div className="pt-3 border-t border-border-default">
                                <button
                                    type="button"
                                    onClick={() => setExpanded(isOpen ? null : scheme.id)}
                                    aria-expanded={isOpen}
                                    className="text-xs text-status-warning hover:underline font-bold flex items-center gap-1.5"
                                >
                                    {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                    {isOpen ? 'Masquer le barème' : 'Voir barème détaillé'}
                                </button>

                                {isOpen && (
                                    <div className="mt-3 overflow-x-auto">
                                        <table className="w-full text-left text-xs min-w-[26.25rem]">
                                            <thead className="text-text-muted uppercase tracking-wider text-nano border-b border-border-default">
                                                <tr>
                                                    <th className="py-2">Palier</th>
                                                    <th className="py-2">Seuil d&apos;achats HT</th>
                                                    <th className="py-2">Taux</th>
                                                    <th className="py-2 text-right">Remise au seuil</th>
                                                    <th className="py-2 text-right">État</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border-default text-text-secondary">
                                                {scheme.tiers.map((tier, i) => {
                                                    const reached = scheme.purchasedToDateInMicrounits >= tier.thresholdInMicrounits;
                                                    return (
                                                        <tr key={i}>
                                                            <td className="py-2 font-bold text-text-primary">{i + 1}</td>
                                                            <td className="py-2 tabular-nums">{eur(tier.thresholdInMicrounits)}</td>
                                                            <td className="py-2 tabular-nums">{tier.ratePercent} %</td>
                                                            <td className="py-2 text-right tabular-nums">
                                                                {eur(Math.round(tier.thresholdInMicrounits * (tier.ratePercent / 100)))}
                                                            </td>
                                                            <td className={`py-2 text-right font-bold ${reached ? 'text-status-success' : 'text-text-muted'}`}>
                                                                {reached ? 'Atteint' : 'À atteindre'}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
}
