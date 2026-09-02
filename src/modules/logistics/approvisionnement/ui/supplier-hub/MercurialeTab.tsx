'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, Loader2, AlertCircle, Upload, TableProperties } from 'lucide-react';
import { SupplierHubService, eurosToMicrounits } from '../../../services/SupplierHubService';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { toError } from '@/lib/toError';
import type { SupplierPriceEntry, IngredientUnit } from '@nexus/contracts';

const eur = (mu: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(mu / 1_000_000);

interface SupplierOption { id: string; name: string }

/** Colonnes acceptées, en français comme en anglais — les mercuriales arrivent des deux. */
const COLUMN_ALIASES: Record<string, string[]> = {
    name: ['ingredient', 'ingrédient', 'produit', 'designation', 'désignation', 'libelle', 'libellé', 'article', 'name'],
    price: ['prix', 'prix unitaire', 'prix/kg', 'prix unitaire ht', 'tarif', 'price', 'unit price'],
    unit: ['unite', 'unité', 'unit', 'uom'],
    packaging: ['conditionnement', 'colisage', 'packaging', 'format'],
    packPrice: ['prix colis', 'prix conditionnement', 'pack price', 'prix carton'],
};

function pick(header: string[], row: string[], key: keyof typeof COLUMN_ALIASES): string {
    const aliases = COLUMN_ALIASES[key];
    const idx = header.findIndex(h => aliases.includes(h.toLowerCase().trim()));
    return idx === -1 ? '' : (row[idx] ?? '').trim();
}

/** Découpe une ligne CSV en respectant les guillemets. */
function splitCsvLine(line: string, sep: string): string[] {
    const out: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
            if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
            else inQuotes = !inQuotes;
        } else if (c === sep && !inQuotes) {
            out.push(cur);
            cur = '';
        } else cur += c;
    }
    out.push(cur);
    return out;
}

function parseAmount(raw: string): number {
    // Les exports fournisseurs mélangent « 8,80 € », « 8.80 » et « 8 800,00 ».
    const cleaned = raw.replace(/[^\d,.-]/g, '').replace(/\s/g, '');
    const normalised = cleaned.includes(',') && cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')
        ? cleaned.replace(/\./g, '').replace(',', '.')
        : cleaned.replace(/,/g, '');
    const n = Number.parseFloat(normalised);
    return Number.isFinite(n) ? n : NaN;
}

function parseCsvEntry(
    header: string[],
    row: string[],
    today: string,
): Omit<SupplierPriceEntry, 'id' | 'supplierId' | 'supplierName' | 'updatedAt'> | null {
    const name = pick(header, row, 'name');
    const price = parseAmount(pick(header, row, 'price'));

    if (!name || !Number.isFinite(price) || price <= 0) return null;

    const packPriceRaw = pick(header, row, 'packPrice');
    const packPrice = packPriceRaw ? parseAmount(packPriceRaw) : NaN;

    return {
        ingredientName: name,
        pricePerUnitInMicrounits: eurosToMicrounits(price),
        unit: (pick(header, row, 'unit') || 'kg') as IngredientUnit,
        packaging: pick(header, row, 'packaging') || undefined,
        packPriceInMicrounits: Number.isFinite(packPrice) ? eurosToMicrounits(packPrice) : undefined,
        validFrom: today,
    };
}

function parseMercurialeCsv(text: string): {
    entries: Array<Omit<SupplierPriceEntry, 'id' | 'supplierId' | 'supplierName' | 'updatedAt'>>;
    rejected: number[];
} {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) throw new Error('Le fichier ne contient aucune ligne de tarif.');

    const sep = (lines[0].match(/;/g)?.length ?? 0) >= (lines[0].match(/,/g)?.length ?? 0) ? ';' : ',';
    const header = splitCsvLine(lines[0], sep);
    const today = new Date().toISOString();
    const entries: Array<Omit<SupplierPriceEntry, 'id' | 'supplierId' | 'supplierName' | 'updatedAt'>> = [];
    const rejected: number[] = [];

    for (let i = 1; i < lines.length; i++) {
        const row = splitCsvLine(lines[i], sep);
        const parsed = parseCsvEntry(header, row, today);
        if (parsed) {
            entries.push(parsed);
        } else {
            rejected.push(i + 1);
        }
    }

    if (entries.length === 0) {
        throw new Error(
            "Aucune ligne exploitable. Le fichier doit comporter au minimum une colonne « Ingrédient » et une colonne « Prix ».",
        );
    }

    return { entries, rejected };
}

function formatImportNotice(count: number, supplierName: string, rejected: number[]): string {
    if (rejected.length === 0) {
        return `${count} tarif${count > 1 ? 's' : ''} importé${count > 1 ? 's' : ''} pour ${supplierName}.`;
    }
    const sample = rejected.slice(0, 8).join(', ');
    const suffix = rejected.length > 8 ? '…' : '';
    return `${count} tarif${count > 1 ? 's' : ''} importé${count > 1 ? 's' : ''} pour ${supplierName}. ${rejected.length} ligne${rejected.length > 1 ? 's' : ''} ignorée${rejected.length > 1 ? 's' : ''} (n° ${sample}${suffix}) : nom ou prix illisible.`;
}

export function MercurialeTab() {
    const [prices, setPrices] = useState<SupplierPriceEntry[]>([]);
    const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isImporting, setIsImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [targetSupplier, setTargetSupplier] = useState('');
    const fileRef = useRef<HTMLInputElement>(null);

    const load = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [rows, supplierRows] = await Promise.all([
                SupplierHubService.listPrices(),
                Nexus.adapter.query<SupplierOption>('suppliers'),
            ]);
            setPrices(rows);
            setSuppliers(supplierRows ?? []);
            if (supplierRows?.length && !targetSupplier) setTargetSupplier(supplierRows[0].id);
        } catch (err) {
            setError(`Chargement impossible : ${toError(err).message}`);
        } finally {
            setIsLoading(false);
        }
    }, [targetSupplier]);

    useEffect(() => { void load(); }, [load]);

    const comparison = useMemo(() => SupplierHubService.compareByIngredient(prices), [prices]);

    const handleFile = async (file: File) => {
        const supplier = suppliers.find(s => s.id === targetSupplier);
        if (!supplier) { setError('Choisissez le fournisseur dont vous importez la mercuriale.'); return; }

        setIsImporting(true);
        setError(null);
        setNotice(null);
        try {
            const text = await file.text();
            const { entries, rejected } = parseMercurialeCsv(text);
            const count = await SupplierHubService.importPrices(supplier.id, supplier.name, entries);
            await load();
            setNotice(formatImportNotice(count, supplier.name, rejected));
        } catch (err) {
            setError(toError(err).message);
        } finally {
            setIsImporting(false);
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    return (
        <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-status-warning/10 border border-status-warning/20 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-status-warning shrink-0" />
                    <div>
                        <div className="text-xs font-bold text-status-warning">
                            COMPARATEUR DE MERCURIALES
                        </div>
                        <div className="text-micro text-text-secondary">
                            Écart de prix par unité entre fournisseurs, calculé sur vos tarifs importés.
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <select
                        value={targetSupplier}
                        onChange={e => setTargetSupplier(e.target.value)}
                        aria-label="Fournisseur de la mercuriale à importer"
                        className="bg-surface-glass border border-border-default rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-border-focus"
                    >
                        {suppliers.length === 0 && <option value="">Aucun fournisseur</option>}
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>

                    <input
                        ref={fileRef}
                        type="file"
                        accept=".csv,text/csv,text/plain"
                        className="sr-only"
                        onChange={e => { const f = e.target.files?.[0]; if (f) void handleFile(f); }}
                    />
                    <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={isImporting || suppliers.length === 0}
                        className="px-3 py-2 min-h-[44px] rounded-xl bg-action-primary text-text-on-primary font-bold text-xs uppercase disabled:opacity-40 flex items-center gap-2 hover:opacity-90 transition-opacity"
                    >
                        {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        Importer une mercuriale (CSV)
                    </button>
                </div>
            </div>

            {error && (
                <div role="alert" className="flex items-start gap-2 px-4 py-3 rounded-xl bg-status-danger/10 border border-status-danger/20 text-status-danger text-xs font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    {error}
                </div>
            )}
            {notice && (
                <div className="px-4 py-3 rounded-xl bg-status-success/10 border border-status-success/20 text-status-success text-xs font-medium">
                    {notice}
                </div>
            )}

            {isLoading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-text-muted text-xs">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Chargement des tarifs…
                </div>
            ) : comparison.length === 0 ? (
                <div className="py-16 text-center space-y-2">
                    <TableProperties className="w-10 h-10 mx-auto text-text-muted/40" />
                    <p className="text-sm text-text-muted max-w-md mx-auto">
                        Aucun tarif enregistré. Importez la mercuriale d&apos;au moins deux fournisseurs
                        pour voir apparaître les écarts de prix.
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-2xl border border-border-default bg-surface-card">
                    <table className="w-full text-left text-xs min-w-[45rem]">
                        <thead className="bg-surface-card border-b border-border-default text-text-muted font-semibold uppercase tracking-wider text-nano">
                            <tr>
                                <th className="p-3.5">Ingrédient</th>
                                <th className="p-3.5">Meilleure offre</th>
                                <th className="p-3.5">Prix unitaire</th>
                                <th className="p-3.5">Conditionnement</th>
                                <th className="p-3.5">Fournisseurs comparés</th>
                                <th className="p-3.5 text-right">Écart max</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-default text-text-secondary">
                            {comparison.map(row => (
                                <tr key={`${row.ingredientName}-${row.best.id}`}>
                                    <td className="p-3.5 font-bold text-text-primary">{row.ingredientName}</td>
                                    <td className="p-3.5 text-status-success font-bold">{row.best.supplierName}</td>
                                    <td className="p-3.5 font-mono font-bold text-text-primary tabular-nums">
                                        {eur(row.best.pricePerUnitInMicrounits)} / {row.unit}
                                    </td>
                                    <td className="p-3.5 text-text-muted">
                                        {row.best.packaging ?? '—'}
                                        {typeof row.best.packPriceInMicrounits === 'number' && (
                                            <span> ({eur(row.best.packPriceInMicrounits)})</span>
                                        )}
                                    </td>
                                    <td className="p-3.5 text-text-muted">
                                        {row.others.length === 0
                                            ? <span className="italic">Seule offre connue</span>
                                            : row.others.map(o => `${o.supplierName} (${eur(o.pricePerUnitInMicrounits)})`).join(', ')}
                                    </td>
                                    <td className={`p-3.5 text-right font-bold tabular-nums ${row.spreadPercent > 0 ? 'text-status-success' : 'text-text-muted'}`}>
                                        {row.others.length === 0 ? '—' : `+${row.spreadPercent.toFixed(2)} %`}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
